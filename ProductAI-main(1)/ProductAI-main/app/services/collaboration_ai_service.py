import asyncio
from typing import List, Dict, Any, Optional
from app.services.gemini_service import generate_product_text
import google.generativeai as genai
import os
from datetime import datetime
import json

class CollaborationAIService:
    """AI service for collaboration features like suggestions, translations, and reviews"""
    
    def __init__(self):
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')

    async def generate_demo_suggestions(self, demo_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate AI suggestions for demo improvement"""
        try:
            print(f"[Collaboration AI] Generating suggestions for demo {demo_data.get('demoId')}")
            
            transcript = demo_data.get('transcript', '')
            pause_durations = demo_data.get('pauseDurations', [])
            replay_frequency = demo_data.get('replayFrequency', [])
            
            # Build analysis prompt
            prompt = f"""
            Analyze this demo recording and provide specific, actionable suggestions for improvement:

            TRANSCRIPT:
            {transcript}

            PAUSE ANALYSIS:
            - Pause durations: {pause_durations}
            - Replay frequency data: {replay_frequency}

            Please provide suggestions in the following categories:
            1. TRIM - sections that should be shortened or removed
            2. CLARIFY - parts that need better explanation
            3. CTA - missing or unclear call-to-actions
            4. PACE - pacing and flow improvements
            5. GENERAL - other improvements

            For each suggestion, provide:
            - timestamp (in seconds, estimate based on content)
            - type (trim/clarify/cta/pace/general)
            - suggestion (specific actionable advice)
            - confidence (0.0-1.0)
            - reasoning (why this suggestion matters)

            Return as JSON array of suggestions.
            """

            response = await self.model.generate_content_async(prompt)
            suggestions_text = response.text

            # Parse AI response
            try:
                # Extract JSON from response
                import re
                json_match = re.search(r'\[.*\]', suggestions_text, re.DOTALL)
                if json_match:
                    suggestions_json = json.loads(json_match.group())
                else:
                    # Fallback parsing
                    suggestions_json = self._parse_suggestions_fallback(suggestions_text, transcript)
            except:
                suggestions_json = self._parse_suggestions_fallback(suggestions_text, transcript)

            # Validate and format suggestions
            formatted_suggestions = []
            for i, suggestion in enumerate(suggestions_json[:10]):  # Limit to 10 suggestions
                formatted_suggestion = {
                    "timestamp": float(suggestion.get("timestamp", i * 10)),
                    "type": suggestion.get("type", "general"),
                    "suggestion": suggestion.get("suggestion", "Consider improving this section"),
                    "confidence": float(suggestion.get("confidence", 0.7)),
                    "reasoning": suggestion.get("reasoning", "AI analysis"),
                    "metadata": {
                        "generated_at": datetime.now().isoformat(),
                        "ai_model": "gemini-2.0-flash"
                    }
                }
                formatted_suggestions.append(formatted_suggestion)

            print(f"[Collaboration AI] Generated {len(formatted_suggestions)} suggestions")
            return formatted_suggestions

        except Exception as e:
            print(f"[Collaboration AI] Error generating suggestions: {e}")
            return self._generate_fallback_suggestions(demo_data)

    async def translate_demo_content(self, demo_data: Dict[str, Any]) -> Dict[str, Any]:
        """Translate demo content to target language"""
        try:
            demo_id = demo_data.get('demoId')
            target_language = demo_data.get('targetLanguage')
            original_transcript = demo_data.get('originalTranscript', '')
            
            print(f"[Collaboration AI] Translating demo {demo_id} to {target_language}")

            # Language mapping
            language_names = {
                'es': 'Spanish', 'fr': 'French', 'de': 'German', 'it': 'Italian',
                'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese', 'ko': 'Korean',
                'zh': 'Chinese', 'ar': 'Arabic', 'hi': 'Hindi'
            }
            
            target_lang_name = language_names.get(target_language, target_language.upper())

            # Translation prompt
            prompt = f"""
            Translate the following demo transcript to {target_lang_name}, maintaining the professional tone and technical accuracy:

            ORIGINAL TRANSCRIPT:
            {original_transcript}

            Requirements:
            1. Maintain technical terminology accuracy
            2. Keep the professional, engaging tone
            3. Adapt cultural references if needed
            4. Preserve the instructional flow

            Please provide:
            1. Full translated transcript
            2. Translated title (create an engaging title based on content)
            3. Key CTA phrases translated
            4. Subtitle timing (estimate based on original length)

            Return as JSON with:
            - translatedTranscript
            - translatedTitle
            - ctaText (object with common CTA phrases)
            - subtitles (array with start, end, text)
            - translationQuality (0.0-1.0 confidence score)
            """

            response = await self.model.generate_content_async(prompt)
            translation_text = response.text

            # Parse translation response
            try:
                import re
                json_match = re.search(r'\{.*\}', translation_text, re.DOTALL)
                if json_match:
                    translation_data = json.loads(json_match.group())
                else:
                    translation_data = self._parse_translation_fallback(translation_text, target_language)
            except:
                translation_data = self._parse_translation_fallback(translation_text, target_language)

            # Generate subtitles if not provided
            if 'subtitles' not in translation_data or not translation_data['subtitles']:
                translation_data['subtitles'] = self._generate_subtitles(
                    translation_data.get('translatedTranscript', original_transcript)
                )

            # Ensure required fields
            result = {
                "translatedTranscript": translation_data.get('translatedTranscript', original_transcript),
                "translatedTitle": translation_data.get('translatedTitle', f"Demo in {target_lang_name}"),
                "translatedSummary": translation_data.get('translatedSummary', ''),
                "ctaText": translation_data.get('ctaText', {
                    "watch_demo": "Watch Demo",
                    "learn_more": "Learn More",
                    "get_started": "Get Started",
                    "contact_us": "Contact Us"
                }),
                "subtitles": translation_data.get('subtitles', []),
                "translationQuality": float(translation_data.get('translationQuality', 0.8))
            }

            print(f"[Collaboration AI] Translation completed for {target_language}")
            return result

        except Exception as e:
            print(f"[Collaboration AI] Error translating to {target_language}: {e}")
            raise Exception(f"Translation failed: {str(e)}")

    async def generate_demo_review(self, review_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive AI review of demo"""
        try:
            demo_id = review_data.get('demoId')
            comments = review_data.get('comments', [])
            languages = review_data.get('languages', [])
            review_type = review_data.get('reviewType', 'on_demand')
            
            print(f"[Collaboration AI] Generating {review_type} review for demo {demo_id}")

            # Analyze comments
            human_comments = [c for c in comments if not c.get('aiGenerated', False)]
            ai_comments = [c for c in comments if c.get('aiGenerated', False)]
            open_comments = [c for c in comments if c.get('status') == 'open']
            resolved_comments = [c for c in comments if c.get('status') == 'resolved']

            # Build review prompt
            prompt = f"""
            Analyze this demo and provide a comprehensive review:

            DEMO STATISTICS:
            - Total comments: {len(comments)}
            - Human comments: {len(human_comments)}
            - AI suggestions: {len(ai_comments)}
            - Open issues: {len(open_comments)}
            - Resolved issues: {len(resolved_comments)}
            - Supported languages: {len(languages)}

            HUMAN COMMENTS:
            {json.dumps([{"timestamp": c.get("timestamp"), "comment": c.get("comment"), "status": c.get("status")} for c in human_comments[:10]], indent=2)}

            AI SUGGESTIONS:
            {json.dumps([{"type": c.get("suggestionType"), "comment": c.get("comment"), "status": c.get("status")} for c in ai_comments[:10]], indent=2)}

            LANGUAGES:
            {json.dumps([{"language": l.get("language"), "quality": l.get("translationQuality")} for l in languages], indent=2)}

            Please provide:
            1. Overall quality score (0-10)
            2. Key insights about demo quality
            3. Common issues mentioned by reviewers
            4. Translation quality warnings
            5. Specific recommendations for improvement
            6. Readiness assessment for publishing

            Return as JSON with:
            - overallScore
            - insights (array of key insights)
            - commonIssues (array of recurring problems)
            - translationWarnings (array of language-specific issues)
            - recommendations (array of actionable improvements)
            - publishReadiness (ready/needs_work/major_issues)
            """

            response = await self.model.generate_content_async(prompt)
            review_text = response.text

            # Parse review response
            try:
                import re
                json_match = re.search(r'\{.*\}', review_text, re.DOTALL)
                if json_match:
                    review_data = json.loads(json_match.group())
                else:
                    review_data = self._parse_review_fallback(review_text, comments, languages)
            except:
                review_data = self._parse_review_fallback(review_text, comments, languages)

            # Format final review
            result = {
                "overallScore": float(review_data.get('overallScore', 7.0)),
                "insights": review_data.get('insights', [
                    f"Demo has {len(comments)} total comments",
                    f"Supports {len(languages)} languages",
                    f"{len(open_comments)} issues remain open"
                ]),
                "commonIssues": review_data.get('commonIssues', []),
                "translationWarnings": review_data.get('translationWarnings', []),
                "recommendations": review_data.get('recommendations', []),
                "publishReadiness": review_data.get('publishReadiness', 'ready'),
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "review_type": review_type,
                    "ai_model": "gemini-2.0-flash"
                }
            }

            print(f"[Collaboration AI] Review completed with score {result['overallScore']}")
            return result

        except Exception as e:
            print(f"[Collaboration AI] Error generating review: {e}")
            return self._generate_fallback_review(review_data)

    def _generate_fallback_suggestions(self, demo_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fallback suggestions when AI fails"""
        transcript = demo_data.get('transcript', '')
        suggestions = []

        if len(transcript) < 50:
            suggestions.append({
                "timestamp": 0,
                "type": "clarify",
                "suggestion": "Consider adding more detailed explanation",
                "confidence": 0.7,
                "reasoning": "Transcript appears very short",
                "metadata": {"fallback": True}
            })

        if 'um' in transcript.lower() or 'uh' in transcript.lower():
            suggestions.append({
                "timestamp": 5,
                "type": "pace",
                "suggestion": "Consider reducing filler words for smoother delivery",
                "confidence": 0.6,
                "reasoning": "Filler words detected",
                "metadata": {"fallback": True}
            })

        return suggestions

    def _parse_translation_fallback(self, text: str, target_language: str) -> Dict[str, Any]:
        """Fallback translation parsing"""
        return {
            "translatedTranscript": f"[Translation to {target_language} failed - original content]",
            "translatedTitle": f"Demo in {target_language.upper()}",
            "ctaText": {"watch_demo": "Watch Demo"},
            "subtitles": [],
            "translationQuality": 0.5
        }

    def _generate_subtitles(self, text: str) -> List[Dict[str, Any]]:
        """Generate basic subtitle timing"""
        words = text.split()
        subtitles = []
        words_per_subtitle = 8
        duration_per_word = 0.5

        for i in range(0, len(words), words_per_subtitle):
            chunk = ' '.join(words[i:i + words_per_subtitle])
            start_time = i * duration_per_word
            end_time = (i + len(chunk.split())) * duration_per_word
            
            subtitles.append({
                "start": start_time,
                "end": end_time,
                "text": chunk
            })

        return subtitles

    def _generate_fallback_review(self, review_data: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback review when AI fails"""
        comments = review_data.get('comments', [])
        languages = review_data.get('languages', [])
        
        open_issues = len([c for c in comments if c.get('status') == 'open'])
        score = max(1, 10 - (open_issues * 0.5))

        return {
            "overallScore": score,
            "insights": [
                f"Demo has {len(comments)} comments",
                f"Supports {len(languages)} languages",
                "Basic analysis completed"
            ],
            "commonIssues": [],
            "translationWarnings": [],
            "recommendations": ["Review open comments", "Consider additional languages"],
            "publishReadiness": "ready" if open_issues < 3 else "needs_work",
            "metadata": {"fallback": True}
        }

    def _parse_suggestions_fallback(self, text: str, transcript: str) -> List[Dict[str, Any]]:
        """Parse suggestions from text when JSON parsing fails"""
        suggestions = []
        lines = text.split('\n')
        
        current_suggestion = {}
        for line in lines:
            line = line.strip()
            if 'timestamp' in line.lower():
                if current_suggestion:
                    suggestions.append(current_suggestion)
                current_suggestion = {"timestamp": 0}
            elif 'type' in line.lower():
                current_suggestion["type"] = "general"
            elif 'suggestion' in line.lower():
                current_suggestion["suggestion"] = line
            elif line and len(line) > 10:
                current_suggestion["suggestion"] = line

        if current_suggestion:
            suggestions.append(current_suggestion)

        return suggestions[:5]  # Limit fallback suggestions

    def _parse_review_fallback(self, text: str, comments: List, languages: List) -> Dict[str, Any]:
        """Parse review from text when JSON parsing fails"""
        score_match = re.search(r'(\d+(?:\.\d+)?)', text)
        score = float(score_match.group(1)) if score_match else 7.0
        
        return {
            "overallScore": min(10, max(0, score)),
            "insights": [f"Analysis of {len(comments)} comments completed"],
            "commonIssues": [],
            "translationWarnings": [],
            "recommendations": ["Review feedback and improve accordingly"],
            "publishReadiness": "ready"
        }

# Export singleton instance
collaboration_ai_service = CollaborationAIService()