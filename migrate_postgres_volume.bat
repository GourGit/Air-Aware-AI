@echo off
REM PostgreSQL Volume Migration Script (Windows Batch)
REM Migrates data from PostgreSQL 16 volume into a new verified PostgreSQL 18 volume
REM Run this BEFORE starting services with the new docker-compose.yml

setlocal enabledelayedexpansion

REM Resolve volume name matching Docker Compose default (directory-based or airaware_dev)
if "%VOLUME_NAME%"=="" (
    docker volume inspect air-aware-ai_postgres_data >nul 2>&1
    if not errorlevel 1 (
        set VOLUME_NAME=air-aware-ai_postgres_data
    ) else (
        docker volume inspect airaware_dev_postgres_data >nul 2>&1
        if not errorlevel 1 (
            set VOLUME_NAME=airaware_dev_postgres_data
        ) else (
            set VOLUME_NAME=air-aware-ai_postgres_data
        )
    )
)

set TARGET_VOLUME_NAME=%VOLUME_NAME%_pg18
set DB_USER=airaware
set DB_NAME=airaware_db
set SOURCE_PG_IMAGE=postgres:16-alpine
set TARGET_PG_IMAGE=postgres:18-alpine
set OLD_MOUNT=/var/lib/postgresql/data
set NEW_MOUNT=/var/lib/postgresql

echo ========================================================
echo   PostgreSQL Volume Migration
echo ========================================================
echo Source Volume:  %VOLUME_NAME%
echo Target Volume:  %TARGET_VOLUME_NAME%
echo Source Image:   %SOURCE_PG_IMAGE%
echo Target Image:   %TARGET_PG_IMAGE%
echo Source Mount:   %OLD_MOUNT%
echo Target Mount:   %NEW_MOUNT%
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

set RANDOM_SUFFIX=%RANDOM%_%TIME:~6,2%
set SOURCE_NAME=pg_source_%RANDOM_SUFFIX%
set VERIFY_NAME=pg_verify_%RANDOM_SUFFIX%
set RECORDED_CONTAINER_IDS=

goto :start_migration

:cleanup_containers
for %%c in (%RECORDED_CONTAINER_IDS%) do (
    docker stop %%c >nul 2>&1
    docker rm %%c >nul 2>&1
)
exit /b %1

:start_migration
REM Step 1: Start source PostgreSQL server on the OLD mount path using PostgreSQL 16
echo Starting source PostgreSQL 16 container...
for /f "tokens=*" %%i in ('docker run -d --name %SOURCE_NAME% -v %VOLUME_NAME%:%OLD_MOUNT% -e POSTGRES_USER=%DB_USER% -e POSTGRES_PASSWORD=airaware_dev_password -e POSTGRES_DB=%DB_NAME% -e PGDATA=%OLD_MOUNT% %SOURCE_PG_IMAGE% 2^>nul') do set SOURCE_CID=%%i
if "%SOURCE_CID%"=="" (
    echo ERROR: Failed to start source PostgreSQL container
    call :cleanup_containers 1
    exit /b 1
)
set RECORDED_CONTAINER_IDS=%RECORDED_CONTAINER_IDS% %SOURCE_CID%
echo Source container ID: %SOURCE_CID%

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

REM Step 2: Capture a source marker for verification
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

REM Step 3: Backup database using pg_dump
echo Backing up database via pg_dump...
docker exec %SOURCE_CID% pg_dump -U %DB_USER% -d %DB_NAME% > "%BACKUP_DIR%\airaware_db.sql"
if errorlevel 1 (
    echo ERROR: pg_dump failed
    call :cleanup_containers 1
    exit /b 1
)

for %%F in ("%BACKUP_DIR%\airaware_db.sql") do set FILESIZE=%%~zF
if %FILESIZE% LEQ 0 (
    echo ERROR: Backup file is empty
    call :cleanup_containers 1
    exit /b 1
)
echo Backup created: %BACKUP_DIR%\airaware_db.sql (%FILESIZE% bytes)

REM Step 4: Stop source server
echo Stopping source container...
docker stop %SOURCE_CID% >nul
docker rm %SOURCE_CID% >nul 2>&1

REM Step 5: Create fresh target volume for PostgreSQL 18
echo Creating target PostgreSQL 18 volume: %TARGET_VOLUME_NAME%...
docker volume create %TARGET_VOLUME_NAME% >nul

REM Step 6: Start target PostgreSQL 18 container on NEW volume
echo Starting target PostgreSQL 18 container...
for /f "tokens=*" %%i in ('docker run -d --name %VERIFY_NAME% -v %TARGET_VOLUME_NAME%:%NEW_MOUNT% -e POSTGRES_USER=%DB_USER% -e POSTGRES_PASSWORD=airaware_dev_password -e POSTGRES_DB=%DB_NAME% %TARGET_PG_IMAGE% 2^>nul') do set VERIFY_CID=%%i
if "%VERIFY_CID%"=="" (
    echo ERROR: Failed to start target PostgreSQL 18 container
    call :cleanup_containers 1
    exit /b 1
)
set RECORDED_CONTAINER_IDS=%RECORDED_CONTAINER_IDS% %VERIFY_CID%
echo Target container ID: %VERIFY_CID%

echo Waiting for PostgreSQL 18 to be ready...
set READY=0
for /l %%i in (1,1,60) do (
    docker exec %VERIFY_CID% pg_isready -U %DB_USER% -d %DB_NAME% >nul 2>&1
    if not errorlevel 1 (
        set READY=1
        goto :verify_ready
    )
    timeout /t 1 /nobreak >nul
)
:verify_ready
if %READY%==0 (
    echo ERROR: PostgreSQL 18 failed to become ready
    docker logs %VERIFY_CID%
    call :cleanup_containers 1
    exit /b 1
)

echo Restoring database dump into fresh PostgreSQL 18 volume...
type "%BACKUP_DIR%\airaware_db.sql" | docker exec -i %VERIFY_CID% psql -U %DB_USER% -d %DB_NAME% -v ON_ERROR_STOP=1
if errorlevel 1 (
    echo ERROR: Failed to restore database dump into PostgreSQL 18
    call :cleanup_containers 1
    exit /b 1
)

echo Verifying migrated data...
set DEST_MARKER=
for /f "tokens=*" %%i in ('docker exec %VERIFY_CID% psql -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2^>nul') do set DEST_MARKER=%%i
set DEST_MARKER=%DEST_MARKER: =%
if "%DEST_MARKER%"=="" set DEST_MARKER=0
echo Destination marker (table count): %DEST_MARKER%

if "%DEST_MARKER%" NEQ "%SOURCE_MARKER%" (
    echo ERROR: Data verification failed - marker mismatch (source: %SOURCE_MARKER%, dest: %DEST_MARKER%)
    call :cleanup_containers 1
    exit /b 1
)

echo Running version check...
docker exec %VERIFY_CID% psql -U %DB_USER% -d %DB_NAME% -c "SELECT version();"

echo SUCCESS: PostgreSQL 18 volume migration verified!
docker stop %VERIFY_CID% >nul
docker rm %VERIFY_CID% >nul 2>&1

echo.
echo ========================================================
echo   Migration Complete
echo ========================================================
echo Preserved original volume: %VOLUME_NAME% (for rollback)
echo New PostgreSQL 18 volume:  %TARGET_VOLUME_NAME%
echo Backup saved to:           %BACKUP_DIR%
echo.
pause
exit /b 0
