"""OpenAQ API v3 client."""
from __future__ import annotations

import logging
from typing import Any
import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


class OpenAQClient:
    BASE_URL = "https://api.openaq.org/v3"

    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_key = self.settings.OPENAQ_API_KEY

    async def get_locations(self, country: str = "IN", city: str | None = None, limit: int = 20) -> list[dict[str, Any]]:
        headers = {}
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        
        params: dict[str, Any] = {"countries_id": 9, "limit": limit}  # 9 is India in OpenAQ v3
        if city:
            params["city"] = city

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.get(f"{self.BASE_URL}/locations", params=params, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("results", [])
        except Exception as e:
            logger.warning("OpenAQ API call failed: %s", e)
        return []
