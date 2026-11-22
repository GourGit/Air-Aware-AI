"""Air quality measurement, summary, forecast, and data-source models."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class AirMeasurement(Base):
    """Single air-quality measurement from a monitoring station."""

    __tablename__ = "air_measurements"

    station_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("monitoring_stations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    aqi: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    dominant_pollutant: Mapped[str | None] = mapped_column(String(20), nullable=True)
    pm25: Mapped[float | None] = mapped_column(Float, nullable=True)
    pm10: Mapped[float | None] = mapped_column(Float, nullable=True)
    no2: Mapped[float | None] = mapped_column(Float, nullable=True)
    so2: Mapped[float | None] = mapped_column(Float, nullable=True)
    o3: Mapped[float | None] = mapped_column(Float, nullable=True)
    co: Mapped[float | None] = mapped_column(Float, nullable=True)
    nh3: Mapped[float | None] = mapped_column(Float, nullable=True)
    pb: Mapped[float | None] = mapped_column(Float, nullable=True)
    pollutant_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    # Relationships
    station: Mapped["MonitoringStation"] = relationship(  # type: ignore[name-defined]
        "MonitoringStation", back_populates="measurements",
    )


class AirQualitySummary(Base):
    """Daily / hourly summary aggregation for a location."""

    __tablename__ = "air_quality_summaries"

    location_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("locations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    period_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'hourly', 'daily'
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    avg_aqi: Mapped[int] = mapped_column(Integer, nullable=False)
    min_aqi: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_aqi: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dominant_pollutant: Mapped[str | None] = mapped_column(String(20), nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    summary_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class AirForecast(Base):
    """Predicted air quality for a future date/time."""

    __tablename__ = "air_forecasts"

    location_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("locations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    forecast_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    predicted_aqi: Mapped[int] = mapped_column(Integer, nullable=False)
    predicted_category: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    model_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    forecast_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class EnvironmentalDataSource(Base):
    """Registry of external data sources (OpenAQ, CPCB, etc.)."""

    __tablename__ = "environmental_data_sources"

    name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    base_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    api_key_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
