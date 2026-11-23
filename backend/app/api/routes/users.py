"""User profile and settings routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import DBSession, CurrentUser
from app.models.profile import UserProfile
from app.repositories import UserRepository
from app.schemas.user import UserProfileUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
async def get_current_user_info(user: CurrentUser):
    """Retrieve current user profile."""
    return {
        "success": True,
        "data": {
            "id": str(user.id),
            "email": user.email,
            "display_name": user.display_name,
            "role": "user",
            "is_active": user.is_active,
        },
    }


@router.get("/profile")
async def get_user_profile(
    user: CurrentUser,
    db: DBSession,
):
    """Retrieve full lifestyle and onboarding profile context."""
    repo = UserRepository(db)
    profile = await repo.get_user_profile(user.id)

    if not profile:
        # Return defaults if no profile exists
        return {
            "success": True,
            "data": {
                "city": None,
                "preferred_location_name": None,
                "preferred_location_lat": None,
                "preferred_location_lng": None,
                "occupation": None,
                "commute_type": None,
                "commute_duration_mins": None,
                "outdoor_activity_type": None,
                "household_context": {},
            },
        }

    return {
        "success": True,
        "data": {
            "city": profile.city,
            "preferred_location_name": None,  # Not stored directly
            "preferred_location_lat": profile.preferred_location_lat,
            "preferred_location_lng": profile.preferred_location_lng,
            "occupation": profile.occupation,
            "commute_type": profile.commute_type,
            "commute_duration_mins": profile.commute_duration,
            "outdoor_activity_type": profile.outdoor_activity,
            "household_context": profile.household_context or {},
        },
    }


@router.put("/profile")
async def update_user_profile(
    req: UserProfileUpdate,
    user: CurrentUser,
    db: DBSession,
):
    """Update user onboarding and personalization parameters."""
    repo = UserRepository(db)
    profile = await repo.get_user_profile(user.id)

    if not profile:
        profile = UserProfile(user_id=user.id)

    # Update fields
    if req.city is not None:
        profile.city = req.city
    if req.preferred_location_lat is not None:
        profile.preferred_location_lat = req.preferred_location_lat
    if req.preferred_location_lng is not None:
        profile.preferred_location_lng = req.preferred_location_lng
    if req.occupation is not None:
        profile.occupation = req.occupation
    if req.commute_type is not None:
        profile.commute_type = req.commute_type
    if req.commute_duration_mins is not None:
        profile.commute_duration = req.commute_duration_mins
    if req.outdoor_activity_type is not None:
        profile.outdoor_activity = req.outdoor_activity_type
    if req.household_context is not None:
        profile.household_context = req.household_context

    if profile.id is None:
        await repo.create_user_profile(profile)
    else:
        await repo.update_user_profile(profile)

    return {"success": True, "data": req.model_dump()}
