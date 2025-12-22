from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from pydantic import BaseModel
from app.services.collaboration_ai_service import collaboration_ai_service

router = APIRouter(prefix="/collaboration", tags=["collaboration"])

# Request models
class DemoSuggestionsRequest(BaseModel):
    demoId: str
    transcript: str
    pauseDurations: List[float] = []
    replayFrequency: List[int] = []

class TranslateDemoRequest(BaseModel):
    demoId: str
    targetLanguage: str
    originalTranscript: str

class AIReviewRequest(BaseModel):
    demoId: str
    comments: List[Dict[str, Any]]
    languages: List[Dict[str, Any]]
    reviewType: str = "on_demand"

# Response models
class SuggestionResponse(BaseModel):
    timestamp: float
    type: str
    suggestion: str
    confidence: float
    reasoning: str
    metadata: Dict[str, Any]

class TranslationResponse(BaseModel):
    translatedTranscript: str
    translatedTitle: str
    translatedSummary: str
    ctaText: Dict[str, str]
    subtitles: List[Dict[str, Any]]
    translationQuality: float

class ReviewResponse(BaseModel):
    overallScore: float
    insights: List[str]
    commonIssues: List[str]
    translationWarnings: List[str]
    recommendations: List[str]
    publishReadiness: str
    metadata: Dict[str, Any]

@router.post("/ai-suggestions")
async def generate_ai_suggestions(request: DemoSuggestionsRequest):
    """Generate AI suggestions for demo improvement"""
    try:
        print(f"[Collaboration API] Generating suggestions for demo {request.demoId}")
        
        demo_data = {
            "demoId": request.demoId,
            "transcript": request.transcript,
            "pauseDurations": request.pauseDurations,
            "replayFrequency": request.replayFrequency
        }
        
        suggestions = await collaboration_ai_service.generate_demo_suggestions(demo_data)
        
        return {
            "success": True,
            "suggestions": suggestions,
            "count": len(suggestions),
            "demoId": request.demoId
        }
        
    except Exception as e:
        print(f"[Collaboration API] Error generating suggestions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {str(e)}")

@router.post("/translate-demo")
async def translate_demo(request: TranslateDemoRequest):
    """Translate demo content to target language"""
    try:
        print(f"[Collaboration API] Translating demo {request.demoId} to {request.targetLanguage}")
        
        demo_data = {
            "demoId": request.demoId,
            "targetLanguage": request.targetLanguage,
            "originalTranscript": request.originalTranscript
        }
        
        translation_result = await collaboration_ai_service.translate_demo_content(demo_data)
        
        return {
            "success": True,
            "demoId": request.demoId,
            "targetLanguage": request.targetLanguage,
            **translation_result
        }
        
    except Exception as e:
        print(f"[Collaboration API] Error translating demo: {e}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

@router.post("/ai-review")
async def generate_ai_review(request: AIReviewRequest):
    """Generate comprehensive AI review of demo"""
    try:
        print(f"[Collaboration API] Generating {request.reviewType} review for demo {request.demoId}")
        
        review_data = {
            "demoId": request.demoId,
            "comments": request.comments,
            "languages": request.languages,
            "reviewType": request.reviewType
        }
        
        review_result = await collaboration_ai_service.generate_demo_review(review_data)
        
        return {
            "success": True,
            "demoId": request.demoId,
            "reviewType": request.reviewType,
            **review_result
        }
        
    except Exception as e:
        print(f"[Collaboration API] Error generating review: {e}")
        raise HTTPException(status_code=500, detail=f"Review generation failed: {str(e)}")

@router.get("/health")
async def collaboration_health():
    """Health check for collaboration services"""
    return {
        "status": "healthy",
        "services": {
            "ai_suggestions": "available",
            "translation": "available", 
            "ai_review": "available"
        },
        "supported_languages": [
            "en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh", "ar", "hi"
        ]
    }