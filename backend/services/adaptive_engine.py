import json
import os
import logging

logger = logging.getLogger("adaptive-engine")

RANKS = [
    {"rank_id": 1, "name": "Novice Explorer", "min_xp": 0, "max_xp": 199, "difficulty_label": "Foundational (Easy)", "color": "emerald"},
    {"rank_id": 2, "name": "Apprentice Scholar", "min_xp": 200, "max_xp": 499, "difficulty_label": "Core Understanding (Medium-Easy)", "color": "blue"},
    {"rank_id": 3, "name": "Skilled Adept", "min_xp": 500, "max_xp": 999, "difficulty_label": "Intermediate Problem-Solving (Medium)", "color": "indigo"},
    {"rank_id": 4, "name": "Master Practitioner", "min_xp": 1000, "max_xp": 1999, "difficulty_label": "Advanced Application (Hard)", "color": "purple"},
    {"rank_id": 5, "name": "Grandmaster", "min_xp": 2000, "max_xp": 999999, "difficulty_label": "Olympiad & Deep Synthesis (Master)", "color": "amber"}
]

class AdaptiveEngine:
    def __init__(self, profile_path):
        self.profile_path = profile_path
        self.profile = self._load_profile()

    def _default_profile(self):
        return {
            "student_id": "student_001",
            "name": "Alex Rivera",
            "xp": 120,
            "rank_id": 1,
            "streak_days": 3,
            "completed_chapters": ["physics_ch1"],
            "topic_mastery": {
                "physics_ch1": 68,
                "cs_ch1": 45,
                "bio_ch1": 20,
                "math_ch1": 15
            },
            "quiz_history": [],
            "preferred_pace": "balanced", # "casual", "balanced", "intensive"
            "weak_spots": ["Action-Reaction forces in non-isolated systems", "Time complexity of recursive branching"]
        }

    def _load_profile(self):
        if os.path.exists(self.profile_path):
            try:
                with open(self.profile_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data
            except Exception as e:
                logger.error(f"Error loading student profile: {e}")
        profile = self._default_profile()
        self._save_profile(profile)
        return profile

    def _save_profile(self, profile=None):
        if profile is not None:
            self.profile = profile
        try:
            os.makedirs(os.path.dirname(self.profile_path), exist_ok=True)
            with open(self.profile_path, "w", encoding="utf-8") as f:
                json.dump(self.profile, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving student profile: {e}")

    def get_rank_info(self, xp):
        for r in RANKS:
            if r["min_xp"] <= xp <= r["max_xp"]:
                # Calculate progress to next rank
                if r["max_xp"] >= 999999:
                    progress_pct = 100
                    xp_to_next = 0
                else:
                    span = r["max_xp"] - r["min_xp"] + 1
                    current = xp - r["min_xp"]
                    progress_pct = min(100, max(0, int((current / span) * 100)))
                    xp_to_next = (r["max_xp"] + 1) - xp
                return {
                    **r,
                    "progress_pct": progress_pct,
                    "xp_to_next": xp_to_next
                }
        return {**RANKS[0], "progress_pct": 0, "xp_to_next": 200}

    def get_profile(self):
        rank_info = self.get_rank_info(self.profile.get("xp", 0))
        return {
            **self.profile,
            "rank": rank_info
        }

    def update_after_quiz(self, chapter_id, earned_score, max_score, feedback_summary, identified_weakness=None):
        """
        Updates student XP, rank, mastery %, and records quiz history.
        """
        old_xp = self.profile.get("xp", 0)
        old_rank = self.get_rank_info(old_xp)

        # Calculate XP bonus: base XP + accuracy bonus
        accuracy = (earned_score / max_score) if max_score > 0 else 0
        xp_gained = int(earned_score * 25 + (accuracy * 30))
        new_xp = old_xp + xp_gained
        new_rank = self.get_rank_info(new_xp)

        # Update topic mastery (exponential moving average / blend)
        old_mastery = self.profile["topic_mastery"].get(chapter_id, 30)
        score_pct = int(accuracy * 100)
        new_mastery = int((old_mastery * 0.6) + (score_pct * 0.4))
        self.profile["topic_mastery"][chapter_id] = min(100, max(0, new_mastery))

        # Update weak spots if identified
        if identified_weakness and identified_weakness not in self.profile.get("weak_spots", []):
            weak_spots = self.profile.get("weak_spots", [])
            weak_spots.append(identified_weakness)
            self.profile["weak_spots"] = weak_spots[-5:] # keep top 5

        # Update completed chapters if accuracy >= 70%
        if accuracy >= 0.70 and chapter_id not in self.profile.get("completed_chapters", []):
            self.profile.setdefault("completed_chapters", []).append(chapter_id)

        # Record history
        record = {
            "timestamp": "recent",
            "chapter_id": chapter_id,
            "score": earned_score,
            "max_score": max_score,
            "accuracy_pct": score_pct,
            "xp_gained": xp_gained,
            "feedback": feedback_summary
        }
        self.profile.setdefault("quiz_history", []).insert(0, record)
        self.profile["quiz_history"] = self.profile["quiz_history"][:15] # keep last 15
        self.profile["xp"] = new_xp
        self.profile["rank_id"] = new_rank["rank_id"]

        self._save_profile()

        ranked_up = new_rank["rank_id"] > old_rank["rank_id"]
        return {
            "xp_gained": xp_gained,
            "total_xp": new_xp,
            "score_pct": score_pct,
            "old_rank": old_rank,
            "new_rank": new_rank,
            "ranked_up": ranked_up,
            "chapter_mastery": new_mastery
        }

    def reset_profile(self):
        self.profile = self._default_profile()
        self._save_profile()
        return self.get_profile()
