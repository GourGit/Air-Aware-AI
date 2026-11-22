@echo off
REM PostgreSQL Volume Migration Script (Windows Batch)
REM Migrates data from PostgreSQL 16 old mount to PostgreSQL 18 target
REM Run this BEFORE starting services with the new docker-compose.yml

setlocal enabledelayedexpansion

if "%COMPOSE_PROJECT_NAME%"=="" set COMPOSE_PROJECT_NAME=airaware_dev
set VOLUME_NAME=%COMPOSE_PROJECT_NAME%_postgres_data
set DB_USER=airaware
set DB_NAME=airaware_db
set SOURCE_PG_IMAGE=postgres:16-alpine
set TARGET_PG_IMAGE=postgres:18-alpine
set OLD_MOUNT=/var/lib/postgresql/data
set NEW_MOUNT=/var/lib/postgresql/18/docker

echo ========================================================
echo   PostgreSQL Volume Migration
echo ========================================================
echo Project:       %COMPOSE_PROJECT_NAME%
echo Volume:        %VOLUME_NAME%
echo Source Image:  %SOURCE_PG_IMAGE%
echo Target Image:  %TARGET_PG_IMAGE%
echo Source Mount:  %OLD_MOUNT%
echo Target Mount:  %NEW_MOUNT%
echo.

REM Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop.
    exit /b 1
)

REM Check if volume exists - distinguish absent from Docker errors
echo Checking for existing volume: %VOLUME_NAME%...
docker volume inspect %VOLUME_NAME% >nul 2>&1
if errorlevel 1 (
    docker volume ls --format "{{.Name}}" | findstr /r /c:"^%VOLUME_NAME%$" >nul
    if not errorlevel 1 (
        echo Volume %VOLUME_NAME% found in listing but inspect failed - Docker error
        exit /b 1
    )
    echo No existing volume %VOLUME_NAME% found. Nothing to migrate.
    exit /b 0
)

REM Create unique private backup directory
set TIMESTAMP=%DATE:~-4,4%%DATE:~-10,2%%DATE:~-7,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_DIR=%TEMP%\pg_backup_%TIMESTAMP%
mkdir "%BACKUP_DIR%" 2>nul
if errorlevel 1 (
    echo ERROR: Failed to create backup directory
    exit /b 1
)
echo Backup dir: %BACKUP_DIR%
echo.
goto :start_migration

REM Cleanup function for helper containers
:cleanup_containers
for %%c in (pg_source pg_migrate_temp pg_verify pg_restore) do (
    docker ps -a --format "{{.Names}}" | findstr /r /c:"^%%c$" >nul
    if not errorlevel 1 (
        docker stop %%c >nul 2>&1
        docker rm %%c >nul 2>&1
    )
)
exit /b %1

:start_migration
REM Step 1: Start source PostgreSQL server using PostgreSQL 16 on the OLD mount path
echo Starting source PostgreSQL 16 server on old mount...
docker run --rm -d --name pg_source -v %VOLUME_NAME%:%OLD_MOUNT% -e POSTGRES_USER=%DB_USER% -e POSTGRES_PASSWORD=airaware_dev_password -e POSTGRES_DB=%DB_NAME% -e PGDATA=%OLD_MOUNT% %SOURCE_PG_IMAGE% >nul
if errorlevel 1 (
    echo ERROR: Failed to start source PostgreSQL container
    call :cleanup_containers 1
    exit /b 1
)
set SOURCE_CID=
for /f "tokens=*" %%i in ('docker ps --filter "name=pg_source" --format "{{.ID}}"') do set SOURCE_CID=%%i
if "%SOURCE_CID%"=="" (
    echo ERROR: Source container not found after start
    call :cleanup_containers 1
    exit /b 1
)
echo Source container: %SOURCE_CID%

REM Wait for source server to be ready
echo Waiting for source PostgreSQL to be ready...
set READY=0
for /l %%i in (1,1,30) do (
    docker exec %SOURCE_CID% pg_isready -U %DB_USER% -d %DB_NAME% >nul 2>&1
    if not errorlevel 1 (
        set READY=1
        goto :source_ready
    )
    timeout /t 1 /nobreak >nul
)
:source_ready
if %READY%==0 (
    echo ERROR: Source PostgreSQL failed to start
    docker logs %SOURCE_CID%
    call :cleanup_containers 1
    exit /b 1
)
echo Source PostgreSQL is ready

REM Step 2: Capture a source marker for later verification
echo Capturing source marker...
set SOURCE_MARKER=
for /f "tokens=*" %%i in ('docker exec %SOURCE_CID% psql -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2^>nul') do set SOURCE_MARKER=%%i
set SOURCE_MARKER=%SOURCE_MARKER: =%
if "%SOURCE_MARKER%"=="" (
    for /f "tokens=*" %%i in ('docker exec %SOURCE_CID% psql -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM pg_class WHERE relkind='r';" 2^>nul') do set SOURCE_MARKER=%%i
    set SOURCE_MARKER=%SOURCE_MARKER: =%
)
if "%SOURCE_MARKER%"=="" set SOURCE_MARKER=0
echo Source marker (table count): %SOURCE_MARKER%

REM Step 3: Backup database using pg_dump from RUNNING source server
echo Backing up database via pg_dump...
docker exec %SOURCE_CID% pg_dump -U %DB_USER% -d %DB_NAME% > "%BACKUP_DIR%\airaware_db.sql"
if errorlevel 1 (
    echo ERROR: pg_dump failed
    call :cleanup_containers 1
    exit /b 1
)

REM Verify backup is non-empty
for %%F in ("%BACKUP_DIR%\airaware_db.sql") do set FILESIZE=%%~zF
if %FILESIZE% LEQ 0 (
    echo ERROR: Backup file is empty
    call :cleanup_containers 1
    exit /b 1
)
echo Backup created: %BACKUP_DIR%\airaware_db.sql (%FILESIZE% bytes)

REM Step 4: Stop source server BEFORE initializing PostgreSQL 18 target
echo Stopping source server...
docker stop %SOURCE_CID% >nul
docker rm %SOURCE_CID% >nul 2>&1

REM Step 5: Start PostgreSQL 18 target container on NEW mount and restore dump
echo Initializing PostgreSQL 18 cluster on %NEW_MOUNT%...
docker run --rm -d --name pg_verify -v %VOLUME_NAME%:%NEW_MOUNT% -e POSTGRES_USER=%DB_USER% -e POSTGRES_PASSWORD=airaware_dev_password -e POSTGRES_DB=%DB_NAME% %TARGET_PG_IMAGE% >nul
if errorlevel 1 (
    echo ERROR: Failed to start target PostgreSQL 18 container
    call :cleanup_containers 1
    exit /b 1
)
set VERIFY_CID=
for /f "tokens=*" %%i in ('docker ps --filter "name=pg_verify" --format "{{.ID}}"') do set VERIFY_CID=%%i
if "%VERIFY_CID%"=="" (
    echo ERROR: Target container not found after start
    call :cleanup_containers 1
    exit /b 1
)
echo Target container: %VERIFY_CID%

REM Readiness polling with deadline (60 seconds)
echo Waiting for PostgreSQL 18 to be ready...
set READY=0
for /l %%i in (1,1,60) do (
    docker exec %VERIFY_CID% pg_isready -U %DB_USER% -d %DB_NAME% >nul 2>&1
    if not errorlevel 1 (
        set READY=1
        goto :verify_ready
    )
    docker ps --format "{{.Names}}" | findstr /r /c:"^pg_verify$" >nul
    if errorlevel 1 (
        echo ERROR: Verification container exited unexpectedly
        docker logs %VERIFY_CID%
        call :cleanup_containers 1
        exit /b 1
    )
    timeout /t 1 /nobreak >nul
)
:verify_ready
if %READY%==0 (
    echo ERROR: PostgreSQL 18 failed to become ready within 60 seconds
    docker logs %VERIFY_CID%
    call :cleanup_containers 1
    exit /b 1
)

echo Restoring database dump into PostgreSQL 18...
type "%BACKUP_DIR%\airaware_db.sql" | docker exec -i %VERIFY_CID% psql -U %DB_USER% -d %DB_NAME% -v ON_ERROR_STOP=1
if errorlevel 1 (
    echo ERROR: Failed to restore database dump into PostgreSQL 18
    call :cleanup_containers 1
    exit /b 1
)

echo Verifying migrated data in PostgreSQL 18...
set DEST_MARKER=
for /f "tokens=*" %%i in ('docker exec %VERIFY_CID% psql -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2^>nul') do set DEST_MARKER=%%i
set DEST_MARKER=%DEST_MARKER: =%
if "%DEST_MARKER%"=="" (
    for /f "tokens=*" %%i in ('docker exec %VERIFY_CID% psql -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM pg_class WHERE relkind='r';" 2^>nul') do set DEST_MARKER=%%i
    set DEST_MARKER=%DEST_MARKER: =%
)
if "%DEST_MARKER%"=="" set DEST_MARKER=0
echo Destination marker (table count): %DEST_MARKER%

if "%DEST_MARKER%" NEQ "%SOURCE_MARKER%" (
    echo ERROR: Data verification failed - marker mismatch (source: %SOURCE_MARKER%, dest: %DEST_MARKER%)
    docker logs %VERIFY_CID%
    call :cleanup_containers 1
    exit /b 1
)

echo Running final version check...
docker exec %VERIFY_CID% psql -U %DB_USER% -d %DB_NAME% -c "SELECT version();"
if errorlevel 1 (
    echo ERROR: Verification query failed
    call :cleanup_containers 1
    exit /b 1
)

echo SUCCESS: Migrated PostgreSQL 18 database verified!

REM Stop verification container
docker stop %VERIFY_CID% >nul
docker rm %VERIFY_CID% >nul 2>&1

echo.
echo ========================================================
echo   Migration Complete
echo ========================================================
echo Backup saved to: %BACKUP_DIR%
echo You can now start services with docker-compose.yml
echo.
echo To restore from backup if needed:
echo   1. Start the target PostgreSQL server with the migrated volume:
echo      docker run -d --name pg_restore -v %VOLUME_NAME%:%NEW_MOUNT% ^
echo        -e POSTGRES_USER=%DB_USER% -e POSTGRES_PASSWORD=airaware_dev_password ^
echo        -e POSTGRES_DB=%DB_NAME% %TARGET_PG_IMAGE%
echo   2. Wait for it to be ready, then restore into an empty database:
echo      docker exec pg_restore psql -U %DB_USER% -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS %DB_NAME%_restore;"
echo      docker exec pg_restore psql -U %DB_USER% -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE %DB_NAME%_restore;"
echo      type "%BACKUP_DIR%\airaware_db.sql" ^| docker exec -i pg_restore psql -U %DB_USER% -d %DB_NAME%_restore -v ON_ERROR_STOP=1
echo   3. Verify the restored database, then stop pg_restore
echo.
pause
exit /b 0
