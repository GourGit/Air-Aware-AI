#!/bin/bash
# PostgreSQL Volume Migration Script
# Migrates data from PostgreSQL 16 old mount to PostgreSQL 18 target
# Run this BEFORE starting services with the new docker-compose.yml

set -euo pipefail

# Configuration
OLD_MOUNT="/var/lib/postgresql/data"
NEW_MOUNT="/var/lib/postgresql/18/docker"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-airaware_dev}"
VOLUME_NAME="${COMPOSE_PROJECT_NAME}_postgres_data"
DB_USER="airaware"
DB_NAME="airaware_db"
SOURCE_PG_IMAGE="postgres:16-alpine"
TARGET_PG_IMAGE="postgres:18-alpine"

echo "=== PostgreSQL Volume Migration ==="
echo "Project:       $COMPOSE_PROJECT_NAME"
echo "Volume:        $VOLUME_NAME"
echo "Source Image:  $SOURCE_PG_IMAGE"
echo "Target Image:  $TARGET_PG_IMAGE"
echo "Old mount:     $OLD_MOUNT"
echo "New mount:     $NEW_MOUNT"
echo ""

# Check if volume exists - distinguish absent from Docker errors
echo "Checking for existing volume: $VOLUME_NAME..."
if ! docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1; then
    if docker volume ls --format '{{.Name}}' | grep -q "^${VOLUME_NAME}$"; then
        echo "Volume $VOLUME_NAME found in listing but inspect failed - Docker error"
        exit 1
    fi
    echo "No existing volume $VOLUME_NAME found. Nothing to migrate."
    exit 0
fi

# Create unique private backup directory with restrictive permissions
umask 077
BACKUP_DIR="$(mktemp -d -t pg_backup_XXXXXX)"
echo "Backup dir: $BACKUP_DIR"

# Cleanup function for helper containers
cleanup() {
    local exit_code=$?
    for container in pg_source pg_verify pg_restore; do
        if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
            docker stop "$container" >/dev/null 2>&1 || true
            docker rm "$container" >/dev/null 2>&1 || true
        fi
    done
    exit $exit_code
}
trap cleanup EXIT

# Step 1: Start source PostgreSQL server with PostgreSQL 16 on the OLD mount path
echo "Starting source PostgreSQL 16 server on old mount..."
SOURCE_CID=$(docker run --rm -d \
    --name pg_source \
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
echo "Source container: $SOURCE_CID"

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

# Step 2: Capture a source marker (schema or data) for later verification
echo "Capturing source marker..."
SOURCE_MARKER=$(docker exec "$SOURCE_CID" psql -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')
if [ -z "$SOURCE_MARKER" ] || [ "$SOURCE_MARKER" -eq 0 ]; then
    SOURCE_MARKER=$(docker exec "$SOURCE_CID" psql -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM pg_class WHERE relkind='r';" 2>/dev/null | tr -d ' ')
fi
echo "Source marker (table count): $SOURCE_MARKER"

# Step 3: Backup database using pg_dump from RUNNING source server
echo "Backing up database via pg_dump..."
if ! docker exec "$SOURCE_CID" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_DIR/airaware_db.sql"; then
    echo "ERROR: pg_dump failed"
    exit 1
fi

# Verify backup is non-empty
if [ ! -s "$BACKUP_DIR/airaware_db.sql" ]; then
    echo "ERROR: Backup file is empty"
    exit 1
fi
echo "Backup created: $BACKUP_DIR/airaware_db.sql ($(wc -c < "$BACKUP_DIR/airaware_db.sql") bytes)"

# Step 4: Stop source server BEFORE initializing PostgreSQL 18
echo "Stopping source server..."
docker stop "$SOURCE_CID" >/dev/null
docker rm "$SOURCE_CID" >/dev/null 2>&1 || true

# Step 5: Start PostgreSQL 18 target container and restore dump
echo "Initializing PostgreSQL 18 cluster on $NEW_MOUNT..."
VERIFY_CID=$(docker run --rm -d \
    --name pg_verify \
    -v "$VOLUME_NAME:$NEW_MOUNT" \
    -e POSTGRES_USER="$DB_USER" \
    -e POSTGRES_PASSWORD=airaware_dev_password \
    -e POSTGRES_DB="$DB_NAME" \
    "$TARGET_PG_IMAGE")

if [ -z "$VERIFY_CID" ]; then
    echo "ERROR: Failed to start verification container"
    exit 1
fi
echo "Verification container: $VERIFY_CID"

# Readiness polling with deadline
echo "Waiting for PostgreSQL 18 to be ready..."
READY=0
DEADLINE=$(($(date +%s) + 60))
while [ $(date +%s) -lt $DEADLINE ]; do
    if docker exec "$VERIFY_CID" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        READY=1
        break
    fi
    if ! docker ps --format '{{.Names}}' | grep -q "^pg_verify$"; then
        echo "ERROR: Verification container exited unexpectedly"
        docker logs "$VERIFY_CID" 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

if [ $READY -eq 0 ]; then
    echo "ERROR: PostgreSQL 18 failed to become ready within 60 seconds"
    docker logs "$VERIFY_CID"
    exit 1
fi

echo "Restoring database dump into PostgreSQL 18..."
docker exec -i "$VERIFY_CID" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 < "$BACKUP_DIR/airaware_db.sql"

echo "Verifying migrated data in PostgreSQL 18..."
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

echo "Running final verification query..."
if ! docker exec "$VERIFY_CID" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();"; then
    echo "ERROR: Verification query failed"
    exit 1
fi

echo "SUCCESS: Migrated database verified in PostgreSQL 18!"

# Stop verification container
docker stop "$VERIFY_CID" >/dev/null
docker rm "$VERIFY_CID" >/dev/null 2>&1 || true

# Disable trap since we're done
trap - EXIT

echo ""
echo "=== Migration Complete ==="
echo "Backup saved to: $BACKUP_DIR"
echo "You can now start services with the new docker-compose.yml"
echo ""
echo "To restore from backup if needed:"
echo "  1. Start the target PostgreSQL server with the migrated volume:"
echo "     docker run -d --name pg_restore -v $VOLUME_NAME:$NEW_MOUNT \\"
echo "       -e POSTGRES_USER=$DB_USER -e POSTGRES_PASSWORD=airaware_dev_password \\"
echo "       -e POSTGRES_DB=$DB_NAME $TARGET_PG_IMAGE"
echo "  2. Wait for it to be ready, then restore into an empty database:"
echo "     docker exec pg_restore psql -U $DB_USER -d postgres -v ON_ERROR_STOP=1 -c \"DROP DATABASE IF EXISTS ${DB_NAME}_restore;\""
echo "     docker exec pg_restore psql -U $DB_USER -d postgres -v ON_ERROR_STOP=1 -c \"CREATE DATABASE ${DB_NAME}_restore;\""
echo "     docker exec -i pg_restore psql -U $DB_USER -d ${DB_NAME}_restore -v ON_ERROR_STOP=1 < $BACKUP_DIR/airaware_db.sql"
echo "  3. Verify the restored database, then stop pg_restore"
