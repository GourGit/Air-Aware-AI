"""Router registry: aggregates all v1 API routes."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.air_quality import router as air_router
from app.api.routes.assistant import router as assistant_router
from app.api.routes.routines import router as routines_router
from app.api.routes.indoor import router as indoor_router
from app.api.routes.mobility import router as mobility_router
from app.api.routes.impact import router as impact_router
from app.api.routes.community import router as community_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.users import router as users_router
from app.api.routes.locations import router as locations_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(locations_router)
api_router.include_router(air_router)
api_router.include_router(assistant_router)
api_router.include_router(routines_router)
api_router.include_router(indoor_router)
api_router.include_router(mobility_router)
api_router.include_router(impact_router)
api_router.include_router(community_router)
api_router.include_router(notifications_router)
