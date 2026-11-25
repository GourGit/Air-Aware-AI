"""seed_emission_factors

Revision ID: be0854f6d129
Revises: 001_initial_schema
Create Date: 2026-11-25 00:03:42.726848

"""
from typing import Sequence, Union
from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'be0854f6d129'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


EMISSION_FACTORS = [
    {
        "transport_mode": "walking",
        "co2_per_km": 0.0,
        "unit": "g/km",
        "source": "ARAI & CEA 2024 - Zero tailpipe emissions",
        "notes": "Active mode, no emissions",
    },
    {
        "transport_mode": "bicycle",
        "co2_per_km": 0.0,
        "unit": "g/km",
        "source": "ARAI & CEA 2024 - Zero tailpipe emissions",
        "notes": "Active mode, no emissions",
    },
    {
        "transport_mode": "metro",
        "co2_per_km": 15.8,
        "unit": "g/km",
        "source": "ARAI & CEA 2024 - Indian Grid Average & Metro Rail efficiency",
        "notes": "Based on CEA Indian Grid Average & Metro Rail efficiency",
    },
    {
        "transport_mode": "electric_bus",
        "co2_per_km": 25.0,
        "unit": "g/km",
        "source": "ARAI & CEA 2024 - Electric bus fleet average",
        "notes": "Electric bus with Indian grid charging",
    },
    {
        "transport_mode": "cng_bus",
        "co2_per_km": 40.2,
        "unit": "g/km",
        "source": "ARAI 2024 - CNG bus fleet",
        "notes": "Compressed Natural Gas bus",
    },
    {
        "transport_mode": "bus",
        "co2_per_km": 52.0,
        "unit": "g/km",
        "source": "ARAI 2024 - Average Indian urban municipal diesel/cng bus fleet",
        "notes": "Average city bus",
    },
    {
        "transport_mode": "motorcycle",
        "co2_per_km": 68.5,
        "unit": "g/km",
        "source": "ARAI 2024 - 100-150cc typical two-wheeler single occupant",
        "notes": "Typical two-wheeler",
    },
    {
        "transport_mode": "electric_car",
        "co2_per_km": 62.0,
        "unit": "g/km",
        "source": "CEA 2024 - Life-cycle charging from standard Indian coal-heavy grid",
        "notes": "Electric car with Indian grid charging",
    },
    {
        "transport_mode": "private_car_cng",
        "co2_per_km": 125.0,
        "unit": "g/km",
        "source": "ARAI 2024 - CNG private car",
        "notes": "CNG private car",
    },
    {
        "transport_mode": "private_car_diesel",
        "co2_per_km": 155.0,
        "unit": "g/km",
        "source": "ARAI 2024 - Diesel private car",
        "notes": "Diesel private car",
    },
    {
        "transport_mode": "private_car_petrol",
        "co2_per_km": 162.0,
        "unit": "g/km",
        "source": "ARAI 2024 - Baseline standard single-occupant hatchback/sedan",
        "notes": "Baseline comparison mode",
    },
    {
        "transport_mode": "auto_rickshaw",
        "co2_per_km": 72.0,
        "unit": "g/km",
        "source": "ARAI 2024 - Auto rickshaw",
        "notes": "Three-wheeler auto rickshaw",
    },
]


def upgrade() -> None:
    # Insert emission factors
    for factor in EMISSION_FACTORS:
        op.execute(
            sa.text("""
                INSERT INTO emission_factors (id, created_at, updated_at, transport_mode, co2_per_km, unit, source, notes)
                VALUES (gen_random_uuid(), :created_at, :updated_at, :transport_mode, :co2_per_km, :unit, :source, :notes)
                ON CONFLICT (transport_mode) DO UPDATE SET
                    co2_per_km = EXCLUDED.co2_per_km,
                    unit = EXCLUDED.unit,
                    source = EXCLUDED.source,
                    notes = EXCLUDED.notes,
                    updated_at = EXCLUDED.updated_at
            """),
            {
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                **factor,
            }
        )


def downgrade() -> None:
    # Remove seeded emission factors
    modes = [f["transport_mode"] for f in EMISSION_FACTORS]
    for mode in modes:
        op.execute(
            sa.text("DELETE FROM emission_factors WHERE transport_mode = :mode"),
            {"mode": mode},
        )
