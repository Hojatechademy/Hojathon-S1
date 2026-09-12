"""
SahayAI - Audio Processing & Vernacular Speech Synthesizer
Transcribes Malayalam voice input using Gemini 1.5 Flash multimodal audio ingestion
and generates responsive HTML5 / JavaScript audio readouts for Malayalam speech synthesis.
All UI controls are rendered in English.
"""

from typing import Optional, Dict, Any
from core.gemini_client import GeminiService


class AudioService:
    def __init__(self, gemini_service: Optional[GeminiService] = None):
        self.gemini = gemini_service or GeminiService()

    def transcribe_audio_input(self, audio_bytes: bytes, mime_type: str = "audio/wav") -> str:
        """
        Transcribes spoken Malayalam or Manglish audio using Gemini 1.5 Flash.
        """
        if self.gemini.client:
            try:
                from google.genai import types
                prompt = (
                    "Listen to this spoken audio in Malayalam or English from an Indian citizen. "
                    "Transcribe the spoken words accurately into Malayalam script or English as spoken. "
                    "Return ONLY the plain transcript without commentary."
                )
                part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
                response = self.gemini.client.models.generate_content(
                    model=self.gemini.model_name,
                    contents=[part, prompt]
                )
                if response.text:
                    return response.text.strip()
            except Exception as e:
                print(f"[AudioService] Live audio transcription failed, using fallback: {e}")

        # Fallback simulation
        return (
            "എന്റെ പേര് രാഘവൻ നായർ. വയനാട് ബത്തേരിയിലാണ് താമസം. "
            "48 വയസ്സായി. 1.8 ഏക്കർ സ്ഥലത്ത് കൃഷി ചെയ്യുന്നുണ്ട്. വാർഷിക വരുമാനം 85,000 രൂപ. "
            "കൃഷി ചിലവിനും വളം വാങ്ങാനും സർക്കാർ സബ്സിഡിയോ വായ്പയോ ലഭ്യമാണോ?"
        )

    @staticmethod
    def get_web_speech_html(text_to_speak: str, lang: str = "ml-IN") -> str:
        """
        Returns an HTML snippet with a modern speaker button that uses
        the citizen's browser native Malayalam text-to-speech engine.
        UI labels are formatted in English.
        """
        clean_text = text_to_speak.replace('"', '\\"').replace('\n', ' ')
        html = f"""
        <div style="background: linear-gradient(135deg, #12355B 0%, #1e4a7a 100%); padding: 14px 18px; border-radius: 10px; color: white; margin: 10px 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                <div>
                    <span style="font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">🔊 Voice Assistant (Malayalam Speech Synthesis)</span>
                    <p style="margin: 3px 0 0 0; font-size: 12px; color: #cbd5e1;">Click below to hear the spoken audio readout synthesized in Malayalam</p>
                </div>
                <button onclick="speakMalayalam()" style="background: #FF9933; border: none; color: white; padding: 8px 18px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px; box-shadow: 0 2px 5px rgba(0,0,0,0.25);">
                    ▶ Play Malayalam Voice
                </button>
            </div>
            <script>
            function speakMalayalam() {{
                if ('speechSynthesis' in window) {{
                    window.speechSynthesis.cancel();
                    var msg = new SpeechSynthesisUtterance("{clean_text}");
                    msg.lang = "{lang}";
                    msg.rate = 0.95;
                    window.speechSynthesis.speak(msg);
                }} else {{
                    alert('Browser speech synthesis is not supported on this device.');
                }}
            }}
            </script>
        </div>
        """
        return html
