"""User profile and settings routes."""
from __future__ import annotations

from fastapi import APIRouter
from app.schemas.user import UserProfileUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
async def get_current_user_info():
    """Retrieve current user profile."""
    return {
        "success": True,
        "data": {
            "id": "usr-1234-5678",
            "email": "user@airaware.ai",
            "display_name": "Aarav Sharma",
            "role": "user",
            "is_active": True,
        },
    }


@router.get("/profile")
async def get_user_profile():
    """Retrieve full lifestyle and onboarding profile context."""
    return {
        "success": True,
        "data": {
            "city": "Delhi",
            "preferred_location_name": "Anand Vihar",
            "preferred_location_lat": 28.6508,
            "preferred_location_lng": 77.3152,
            "occupation": "Corporate Professional",
            "commute_type": "metro",
            "commute_duration_mins": 45,
            "outdoor_activity_type": "evening_walk",
            "household_context": {
                "has_air_purifier": True,
                "has_children": False,
                "has_elderly": True,
            },
        },
    }


@router.put("/profile")
async def update_user_profile(req: UserProfileUpdate):
    """Update user onboarding and personalization parameters."""
    return {"success": True, "data": req.model_dump()}
