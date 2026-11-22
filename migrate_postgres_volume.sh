#!/bin/bash
# PostgreSQL Volume Migration Script
# Migrates data from PostgreSQL 16 volume into a new verified PostgreSQL 18 volume
# Run this BEFORE starting services with the new docker-compose.yml

set -euo pipefail

# Configuration: auto-detect volume matching compose default
if [ -z "${VOLUME_NAME:-}" ]; then
    if docker volume inspect air-aware-ai_postgres_data >/dev/null 2>&1; then
        VOLUME_NAME="air-aware-ai_postgres_data"
    elif docker volume inspect airaware_dev_postgres_data >/dev/null 2>&1; then
        VOLUME_NAME="airaware_dev_postgres_data"
    else
        VOLUME_NAME="air-aware-ai_postgres_data"
    fi
fi

TARGET_VOLUME_NAME="${VOLUME_NAME}_pg18"
DB_USER="airaware"
DB_NAME="airaware_db"
SOURCE_PG_IMAGE="postgres:16-alpine"
TARGET_PG_IMAGE="postgres:18-alpine"
OLD_MOUNT="/var/lib/postgresql/data"
NEW_MOUNT="/var/lib/postgresql"

echo "=== PostgreSQL Volume Migration ==="
echo "Source Volume:  $VOLUME_NAME"
echo "Target Volume:  $TARGET_VOLUME_NAME"
echo "Source Image:   $SOURCE_PG_IMAGE"
echo "Target Image:   $TARGET_PG_IMAGE"
echo "Source Mount:   $OLD_MOUNT"
echo "Target Mount:   $NEW_MOUNT"
echo ""

# Check if volume exists - distinguish absent from Docker command error
echo "Checking for existing volume: $VOLUME_NAME..."
if ! VOL_OUTPUT=$(docker volume ls --format '{{.Name}}' 2>&1); then
    echo "ERROR: Failed to list Docker volumes: $VOL_OUTPUT"
    exit 1
fi

if ! echo "$VOL_OUTPUT" | grep -q "^${VOLUME_NAME}$"; then
    echo "No existing volume $VOLUME_NAME found. Nothing to migrate."
    exit 0
fi

# Create unique private backup directory with restrictive permissions
umask 077
BACKUP_DIR="$(mktemp -d -t pg_backup_XXXXXX)"
echo "Backup dir: $BACKUP_DIR"

RANDOM_SUFFIX="${RANDOM}_$(date +%s)"
SOURCE_NAME="pg_source_${RANDOM_SUFFIX}"
VERIFY_NAME="pg_verify_${RANDOM_SUFFIX}"
RECORDED_CONTAINER_IDS=()

cleanup() {
    local exit_code=$?
    for cid in "${RECORDED_CONTAINER_IDS[@]}"; do
        docker stop "$cid" >/dev/null 2>&1 || true
        docker rm "$cid" >/dev/null 2>&1 || true
    done
    exit $exit_code
}
trap cleanup EXIT

# Step 1: Start source PostgreSQL server on the OLD mount path using PostgreSQL 16
echo "Starting source PostgreSQL 16 container..."
SOURCE_CID=$(docker run -d \
    --name "$SOURCE_NAME" \
    -v "$VOLUME_NAME:$OLD_MOUNT" \
    -e POSTGRES_USER="$DB_USER" \
    -e POSTGRES_PASSWORD=airaware_dev_password \
    -e POSTGRES_DB="$DB_NAME" \
    -e PGDATA="$OLD_MOUNT" \
    "$SOURCE_PG_IMAGE")

if [ -z "$SOURCE_CID" ]; then
    echo "ERROR: Failed to start source PostgreSQL container"
    exit 1
fi
RECORDED_CONTAINER_IDS+=("$SOURCE_CID")
echo "Source container ID: $SOURCE_CID"

# Wait for source server to be ready
echo "Waiting for source PostgreSQL to be ready..."
for i in {1..30}; do
    if docker exec "$SOURCE_CID" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        echo "Source PostgreSQL is ready"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo "ERROR: Source PostgreSQL failed to start"
        docker logs "$SOURCE_CID"
        exit 1
    fi
done

# Step 2: Capture a source marker for verification
echo "Capturing source marker..."
SOURCE_MARKER=$(docker exec "$SOURCE_CID" psql -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')
if [ -z "$SOURCE_MARKER" ] || [ "$SOURCE_MARKER" -eq 0 ]; then
    SOURCE_MARKER=$(docker exec "$SOURCE_CID" psql -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM pg_class WHERE relkind='r';" 2>/dev/null | tr -d ' ')
fi
echo "Source marker (table count): $SOURCE_MARKER"

# Step 3: Backup database using pg_dump
echo "Backing up database via pg_dump..."
if ! docker exec "$SOURCE_CID" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_DIR/airaware_db.sql"; then
    echo "ERROR: pg_dump failed"
    exit 1
fi

if [ ! -s "$BACKUP_DIR/airaware_db.sql" ]; then
    echo "ERROR: Backup file is empty"
    exit 1
fi
echo "Backup created: $BACKUP_DIR/airaware_db.sql ($(wc -c < "$BACKUP_DIR/airaware_db.sql") bytes)"

# Step 4: Stop source server
echo "Stopping source container..."
docker stop "$SOURCE_CID" >/dev/null
docker rm "$SOURCE_CID" >/dev/null 2>&1 || true

# Step 5: Create fresh target volume for PostgreSQL 18
echo "Creating target PostgreSQL 18 volume: $TARGET_VOLUME_NAME..."
docker volume create "$TARGET_VOLUME_NAME" >/dev/null

# Step 6: Start target PostgreSQL 18 container on NEW volume
echo "Starting target PostgreSQL 18 container..."
VERIFY_CID=$(docker run -d \
    --name "$VERIFY_NAME" \
    -v "$TARGET_VOLUME_NAME:$NEW_MOUNT" \
    -e POSTGRES_USER="$DB_USER" \
    -e POSTGRES_PASSWORD=airaware_dev_password \
    -e POSTGRES_DB="$DB_NAME" \
    "$TARGET_PG_IMAGE")

if [ -z "$VERIFY_CID" ]; then
    echo "ERROR: Failed to start target PostgreSQL 18 container"
    exit 1
fi
RECORDED_CONTAINER_IDS+=("$VERIFY_CID")
echo "Target container ID: $VERIFY_CID"

echo "Waiting for PostgreSQL 18 to be ready..."
READY=0
DEADLINE=$(($(date +%s) + 60))
while [ $(date +%s) -lt $DEADLINE ]; do
    if docker exec "$VERIFY_CID" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        READY=1
        break
    fi
    sleep 1
done

if [ $READY -eq 0 ]; then
    echo "ERROR: PostgreSQL 18 failed to become ready within 60 seconds"
    docker logs "$VERIFY_CID"
    exit 1
fi

echo "Restoring database dump into fresh PostgreSQL 18 volume..."
docker exec -i "$VERIFY_CID" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 < "$BACKUP_DIR/airaware_db.sql"

echo "Verifying migrated data..."
DEST_MARKER=$(docker exec "$VERIFY_CID" psql -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')
if [ -z "$DEST_MARKER" ] || [ "$DEST_MARKER" -eq 0 ]; then
    DEST_MARKER=$(docker exec "$VERIFY_CID" psql -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM pg_class WHERE relkind='r';" 2>/dev/null | tr -d ' ')
fi
echo "Destination marker (table count): $DEST_MARKER"

if [ "$DEST_MARKER" != "$SOURCE_MARKER" ]; then
    echo "ERROR: Data verification failed - marker mismatch (source: $SOURCE_MARKER, dest: $DEST_MARKER)"
    docker logs "$VERIFY_CID"
    exit 1
fi

echo "Running version check..."
docker exec "$VERIFY_CID" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();"

echo "SUCCESS: PostgreSQL 18 volume migration verified!"
docker stop "$VERIFY_CID" >/dev/null
docker rm "$VERIFY_CID" >/dev/null 2>&1 || true

trap - EXIT

echo ""
echo "=== Migration Complete ==="
echo "Preserved original volume: $VOLUME_NAME (for rollback)"
echo "New PostgreSQL 18 volume:  $TARGET_VOLUME_NAME"
echo "Backup saved to:           $BACKUP_DIR"
