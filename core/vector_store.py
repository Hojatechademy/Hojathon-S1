"""
SahayAI - High Performance In-Memory Vector Store & Rule Matcher
Indexed with Kerala State & Central welfare schemes.
Zero C++ dependencies; native Windows & Python 3.14 compatibility with NumPy cosine vector search.
"""

import json
import os
import re
from typing import List, Dict, Any, Optional
import numpy as np
from core.state import CitizenProfile, SchemeMatchResult


class SchemeVectorStore:
    def __init__(self, schemes_file: Optional[str] = None):
        self.schemes_file = schemes_file or os.path.join(os.path.dirname(__file__), "..", "data", "schemes.json")
        self.schemes: List[Dict[str, Any]] = []
        self.vocabulary: List[str] = []
        self.doc_vectors: Optional[np.ndarray] = None
        self._load_and_index()

    def _load_and_index(self):
        if not os.path.exists(self.schemes_file):
            print(f"[SchemeVectorStore] Warning: File not found {self.schemes_file}")
            return

        with open(self.schemes_file, "r", encoding="utf-8") as f:
            self.schemes = json.load(f)

        # Build corpus of scheme text for semantic retrieval
        corpus = []
        for scheme in self.schemes:
            text = f"{scheme.get('name', '')} {scheme.get('malayalam_name', '')} {scheme.get('category', '')} " \
                   f"{scheme.get('summary', '')} {scheme.get('malayalam_summary', '')} " \
                   f"{' '.join(scheme.get('eligibility_criteria', {}).get('occupations', []))} " \
                   f"{' '.join(scheme.get('required_documents', []))}"
            corpus.append(text.lower())

        # Build simple TF-IDF / term-frequency vectorizer in pure numpy
        all_words = set()
        for doc in corpus:
            tokens = re.findall(r'[\w\u0D00-\u0D7F]+', doc.lower())
            all_words.update(tokens)
        self.vocabulary = sorted(list(all_words))
        word_to_idx = {w: i for i, w in enumerate(self.vocabulary)}

        # Create document vectors
        vectors = np.zeros((len(corpus), len(self.vocabulary)), dtype=np.float32)
        for doc_idx, doc in enumerate(corpus):
            tokens = re.findall(r'[\w\u0D00-\u0D7F]+', doc.lower())
            for token in tokens:
                if token in word_to_idx:
                    vectors[doc_idx, word_to_idx[token]] += 1.0

        # Normalize L2
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        self.doc_vectors = vectors / norms

    def _vectorize_query(self, query: str) -> np.ndarray:
        q_vec = np.zeros((len(self.vocabulary),), dtype=np.float32)
        tokens = re.findall(r'[\w\u0D00-\u0D7F]+', query.lower())
        word_to_idx = {w: i for i, w in enumerate(self.vocabulary)}
        for token in tokens:
            if token in word_to_idx:
                q_vec[word_to_idx[token]] += 1.0
        norm = np.linalg.norm(q_vec)
        if norm > 0:
            q_vec = q_vec / norm
        return q_vec

    def semantic_search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Vector cosine similarity retrieval."""
        if self.doc_vectors is None or len(self.schemes) == 0:
            return self.schemes[:top_k]

        q_vec = self._vectorize_query(query)
        scores = np.dot(self.doc_vectors, q_vec)
        top_indices = np.argsort(scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            scheme_copy = dict(self.schemes[idx])
            scheme_copy["semantic_similarity"] = float(scores[idx])
            results.append(scheme_copy)
        return results

    def match_schemes_for_citizen(self, profile: CitizenProfile) -> List[SchemeMatchResult]:
        """
        Hybrid matching:
        1. Evaluates strict eligibility constraints (age, income, gender, landholding, occupation).
        2. Semantic similarity based on citizen raw input / intent.
        3. Returns verified ranked SchemeMatchResult list.
        """
        results: List[SchemeMatchResult] = []

        query_text = f"{profile.occupation} {profile.intent} {profile.state} {profile.district} {profile.raw_input}"
        semantic_candidates = self.semantic_search(query_text, top_k=len(self.schemes))

        # Check citizen attributes
        c_age = profile.age or 35
        c_income = profile.annual_income if profile.annual_income is not None else 100000.0
        c_gender = profile.gender.lower() if profile.gender else "unknown"
        c_land = profile.landholding_acres or 0.0
        c_occ = (profile.occupation or "").lower()
        c_intent = profile.intent

        for scheme in semantic_candidates:
            crit = scheme.get("eligibility_criteria", {})
            matched_reasons = []
            unmet_reasons = []
            is_eligible = True

            # 1. Grievance Intent handling
            if c_intent == "grievance_petition":
                if scheme.get("id") == "cmdrf_grievance":
                    matched_reasons.append("പൗരന് സേവന മുടക്കം/പരാതി ഉള്ളതിനാൽ മുഖ്യമന്ത്രിയുടെ പരാതി സെല്ലിലേക്ക് നേരിട്ട് റൗട്ട് ചെയ്യുന്നു.")
                    results.insert(0, SchemeMatchResult(
                        scheme_id=scheme["id"],
                        scheme_name=scheme["name"],
                        hindi_name=scheme.get("malayalam_name"),
                        category=scheme["category"],
                        ministry=scheme.get("ministry"),
                        match_score=99.0,
                        is_eligible=True,
                        benefit_summary=scheme.get("malayalam_summary") or scheme["summary"],
                        benefit_amount_inr=scheme.get("benefit_amount_inr"),
                        matched_reasons=matched_reasons,
                        unmet_reasons=[],
                        required_documents=scheme.get("required_documents", []),
                        application_process=scheme.get("application_process"),
                        grievance_contact=scheme.get("grievance_contact")
                    ))
                    continue
                elif scheme.get("id") == "sevana_pension" and c_age >= 60:
                    matched_reasons.append("മുടങ്ങിയ സേവന പെൻഷൻ പുനഃസ്ഥാപിക്കാനുള്ള അർഹതയുണ്ട്.")

            # 2. Age check
            min_age = crit.get("min_age")
            max_age = crit.get("max_age")
            if min_age is not None and c_age < min_age:
                is_eligible = False
                unmet_reasons.append(f"കുറഞ്ഞ പ്രായം {min_age} വയസ്സ് വേണം (അപേക്ഷകന്റെ പ്രായം: {c_age})")
            elif min_age is not None:
                matched_reasons.append(f"പ്രായപരിധി യോഗ്യത പൂർത്തിയായി ({c_age} വയസ്സ് >= {min_age})")

            if max_age is not None and c_age > max_age:
                is_eligible = False
                unmet_reasons.append(f"പരമാവധി പ്രായപരിധി {max_age} വയസ്സ് കവിഞ്ഞു")

            # 3. Gender check
            req_gender = crit.get("gender", "All").lower()
            if req_gender != "all" and c_gender not in ["unknown", "all"] and req_gender != c_gender:
                is_eligible = False
                unmet_reasons.append(f"ഈ പദ്ധതി {req_gender.upper()} വിഭാഗത്തിന് മാത്രമുള്ളതാണ്")
            elif req_gender != "all":
                matched_reasons.append(f"ലിംഗവിഭാഗ യോഗ്യത പൂർത്തിയായി ({req_gender.title()})")

            # 4. Income check
            max_income = crit.get("max_annual_income")
            if max_income is not None and c_income > max_income:
                is_eligible = False
                unmet_reasons.append(f"വാർഷിക വരുമാനം ₹{max_income:,.0f} പരിധിക്ക് മുകളിലാണ് (വരുമാനം: ₹{c_income:,.0f})")
            elif max_income is not None:
                matched_reasons.append(f"വാർഷിക വരുമാന പരിധിയിൽ യോഗ്യനാണ് (₹{c_income:,.0f} <= ₹{max_income:,.0f})")

            # 5. Landholding check
            land_req = crit.get("landholding_required", False)
            max_land = crit.get("max_landholding_acres")
            if land_req and c_land <= 0.0:
                is_eligible = False
                unmet_reasons.append("കൃഷിഭൂമിയുടെ ഉടമസ്ഥാവകാശം ആവശ്യമാണ്")
            elif land_req and c_land > 0.0:
                matched_reasons.append(f"കൃഷിഭൂമി ലഭ്യമാണ് ({c_land} ഏക്കർ കരമടച്ച രസീത് സഹിതം)")

            if max_land is not None and c_land > max_land:
                is_eligible = False
                unmet_reasons.append(f"ഭൂവിസ്തൃതി {max_land} ഏക്കറിൽ കൂടരുത്")

            # 6. Occupation check
            allowed_occs = [o.lower() for o in crit.get("occupations", ["all"])]
            if "all" in allowed_occs:
                matched_reasons.append("തൊഴിൽ വിഭാഗം പരിഗണനയില്ലാതെ എല്ലാ പൗരന്മാർക്കും ബാധകം")
            elif any(occ in c_occ or c_occ in occ for occ in allowed_occs):
                matched_reasons.append(f"തൊഴിൽ വിഭാഗം അനുയോജ്യമാണ് ({profile.occupation})")
            else:
                # Slight penalty if occupation doesn't match
                if scheme.get("id") in ["life_mission", "kasp_karunya"]:
                    matched_reasons.append("സാമ്പത്തിക പിന്നോക്കാവസ്ഥ അടിസ്ഥാനത്തിൽ അർഹത")
                else:
                    is_eligible = False
                    unmet_reasons.append(f"ലഭ്യമായ തൊഴിൽ വിഭാഗം: {', '.join(allowed_occs)}")

            # Calculate score
            base_score = 70.0 if is_eligible else 25.0
            sem_boost = min(scheme.get("semantic_similarity", 0.0) * 30.0, 28.0)
            final_score = round(min(base_score + sem_boost, 98.0), 1)

            # Do not add duplicate cmdrf_grievance if already added
            if any(r.scheme_id == scheme["id"] for r in results):
                continue

            results.append(SchemeMatchResult(
                scheme_id=scheme["id"],
                scheme_name=scheme["name"],
                hindi_name=scheme.get("malayalam_name"),
                category=scheme["category"],
                ministry=scheme.get("ministry"),
                match_score=final_score,
                is_eligible=is_eligible,
                benefit_summary=scheme.get("malayalam_summary") or scheme["summary"],
                benefit_amount_inr=scheme.get("benefit_amount_inr"),
                matched_reasons=matched_reasons,
                unmet_reasons=unmet_reasons,
                required_documents=scheme.get("required_documents", []),
                application_process=scheme.get("application_process"),
                grievance_contact=scheme.get("grievance_contact")
            ))

        # Sort: eligible first, then by match score
        results.sort(key=lambda x: (x.is_eligible, x.match_score), reverse=True)
        return results
