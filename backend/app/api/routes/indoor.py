"""Indoor air quality advisor routes."""
from __future__ import annotations

from fastapi import APIRouter
from app.schemas.indoor import IndoorAssessmentRequest
from app.services.station_service import get_current_air_quality

router = APIRouter(prefix="/indoor", tags=["Indoor Air Quality"])


@router.get("/guidance")
async def get_indoor_guidance():
    """Retrieve general indoor air quality mitigation guidance based on ambient air."""
    aqi_data = get_current_air_quality()
    aqi = aqi_data["air_quality"]["aqi"]

    return {
        "success": True,
        "data": {
            "ventilation_status": "Restricted" if aqi > 200 else "Recommended",
            "ventilation_advice": (
                "Keep windows closed during early morning and late evening smog peaks. Use mechanical filtration."
                if aqi > 200
                else "Open windows between 12 PM - 3 PM to exchange stale indoor air and lower CO2 buildup."
            ),
            "air_purifier_guidance": (
                "Continuous HEPA filtration recommended. Ensure pre-filters are cleaned monthly."
                if aqi > 150
                else "Operate air purifier on low or auto mode during sleeping hours."
            ),
            "cooking_advice": "Always operate exhaust fan or kitchen hood during frying to vent volatile organic compounds.",
            "dust_control_advice": "Mop floors with water and microfiber cloths instead of sweeping to prevent airborne particulate re-suspension.",
            "outdoor_aqi_comparison": {
                "outdoor_aqi": aqi,
                "outdoor_category": aqi_data["air_quality"]["category"],
            },
            "limitations": "Indoor guidance provides protective measures. Actual indoor quality depends on room airtightness and filter ratings.",
        },
    }


@router.post("/assessment")
async def conduct_indoor_assessment(req: IndoorAssessmentRequest):
    """Conduct household air hygiene assessment and calculate vulnerability score."""
    score = 85
    strengths = []
    vulnerabilities = []
    actions = []

    if req.has_air_purifier:
        strengths.append("True HEPA air purifier available for particulate capture")
        if req.purifier_filter_age_months and req.purifier_filter_age_months > 6:
            vulnerabilities.append("HEPA filter is older than 6 months — filtration efficiency may be degraded")
            score -= 15
            actions.append({"priority": "High", "action": "Inspect and replace HEPA filter cartridge"})
    else:
        vulnerabilities.append("No active mechanical HEPA filtration in living spaces")
        score -= 25
        actions.append({"priority": "Medium", "action": "Consider installing a CADR-rated HEPA air purifier"})

    if req.cooking_fuel_type == "biomass":
        vulnerabilities.append("Biomass cooking creates high indoor PM2.5 and CO exposure")
        score -= 30
        actions.append({"priority": "Critical", "action": "Switch to LPG, biogas or induction cooking immediately"})
    elif req.cooking_fuel_type == "lpg":
        strengths.append("Clean LPG / Induction cooking fuel")

    if req.has_smokers:
        vulnerabilities.append("Secondhand tobacco smoke introduces severe carcinogens and VOCs")
        score -= 35
        actions.append({"priority": "Critical", "action": "Strictly enforce 100% smoke-free indoor policy"})

    if req.has_children_or_elderly:
        vulnerabilities.append("Sensitive demographics present with higher respiratory vulnerability")

    risk_level = "Low" if score >= 80 else ("Moderate" if score >= 60 else "High")

    return {
        "success": True,
        "data": {
            "overall_indoor_score": max(10, score),
            "risk_level": risk_level,
            "strengths": strengths,
            "vulnerabilities": vulnerabilities,
            "actionable_checklist": actions,
            "filter_replacement_due": (req.purifier_filter_age_months or 0) > 6,
        },
    }


@router.get("/checklists")
async def get_checklists():
    """Retrieve seasonal indoor air maintenance checklists."""
    return {
        "success": True,
        "data": [
            {"id": "c1", "title": "Clean AC & Air Purifier Pre-Filters", "frequency": "Bi-weekly", "benefit": "Preserves HEPA life and airflow"},
            {"id": "c2", "title": "Check Weatherstripping on Windows", "frequency": "Seasonal", "benefit": "Prevents outdoor smog ingress"},
            {"id": "c3", "title": "Clean Kitchen Exhaust Hood Filter", "frequency": "Monthly", "benefit": "Maintains VOC removal efficiency"},
            {"id": "c4", "title": "Damp Mop Bedroom Floors", "frequency": "Daily", "benefit": "Captures settled coarse and fine dust"},
        ],
    }
