# ============================================
# AirAware AI Backend — Multi-stage Dockerfile
# ============================================

# ── Stage 1: builder ─────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: runtime ─────────────────────────
FROM python:3.11-slim AS runtime

LABEL maintainer="AirAware AI Team"

# Non-root user for security
RUN groupadd -r airaware && useradd -r -g airaware airaware

WORKDIR /app

# Install only runtime system deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 curl && \
    rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY . .

# Own the working directory
RUN chown -R airaware:airaware /app

USER airaware

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
