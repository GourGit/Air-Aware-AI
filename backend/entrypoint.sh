#!/bin/sh
set -e

echo "=============================================="
echo "AirAware AI Backend — Container Startup"
echo "=============================================="

# Wait for PostgreSQL database readiness if DATABASE_URL is configured
if [ -n "$DATABASE_URL" ]; then
    echo "Checking database connectivity..."
    python - <<'EOF'
import os
import sys
import time
from sqlalchemy import create_engine, text

db_url = os.environ.get("DATABASE_URL", "")
# Convert asyncpg scheme to sync psycopg2/standard driver for quick socket check
sync_url = db_url.replace("postgresql+asyncpg://", "postgresql://")

max_retries = 30
retry_delay = 2

for attempt in range(1, max_retries + 1):
    try:
        engine = create_engine(sync_url, pool_pre_ping=True, connect_args={"connect_timeout": 3})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"Database connection verified (attempt {attempt}/{max_retries}).")
        sys.exit(0)
    except Exception as exc:
        print(f"Waiting for database (attempt {attempt}/{max_retries}): {exc}")
        time.sleep(retry_delay)

print("ERROR: Database connection timed out after 60 seconds.", file=sys.stderr)
sys.exit(1)
EOF
fi

# Apply migrations if requested or running in standalone mode
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Applying Alembic schema migrations..."
    if ! python -m alembic upgrade head; then
        echo "ERROR: Database migration failed. Aborting startup." >&2
        exit 1
    fi
    echo "Alembic schema migrations completed successfully."
fi

echo "Starting service: $@"
exec "$@"
