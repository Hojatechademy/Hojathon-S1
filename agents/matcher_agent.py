"""
SahayAI - Agent 2: Scheme Matcher Agent (സ്കീം മാച്ചർ ഏജന്റ്)
Matches structured citizen profile against Vector DB of Kerala and Central welfare schemes.
"""

from typing import List, Dict, Any, Optional
from core.state import CitizenProfile, SchemeMatchResult
from core.vector_store import SchemeVectorStore


class SchemeMatcherAgent:
    def __init__(self, vector_store: Optional[SchemeVectorStore] = None):
        self.vector_store = vector_store or SchemeVectorStore()

    def match_schemes(self, profile: CitizenProfile) -> List[SchemeMatchResult]:
        """
        Runs vector similarity and rule verification to find matching government schemes.
        """
        results = self.vector_store.match_schemes_for_citizen(profile)
        return results
