# External Integrations Architecture

AirAware AI aggregates environmental intelligence across multiple authoritative providers:

---

## 1. Central Pollution Control Board (CPCB) & Official Indian Portals
- **Standard**: Indian National Air Quality Index (NAQI).
- **Calculation Formula**:
  $$\text{Sub-Index } I_p = I_{low} + \frac{I_{high} - I_{low}}{B_{high} - B_{low}} \times (C_p - B_{low})$$
  $$\text{Overall AQI} = \max(I_1, I_2, \dots, I_n) \quad \text{provided at least 3 pollutants (with PM2.5 or PM10) are measured.}$$
- **CPCB Categories**:
  - Good (0–50)
  - Satisfactory (51–100)
  - Moderate (101–200)
  - Poor (201–300)
  - Very Poor (301–400)
  - Severe (401–500)
- **Integration Approach**: When direct CPCB scrapers/APIs are restricted, official state board data mirrored via OpenAQ or CPCB bulletins is retrieved with clear attribution.

---

## 2. OpenAQ Integration
- **API Version**: v3 (`https://api.openaq.org/v3`)
- **Authentication**: `X-API-Key` header with `OPENAQ_API_KEY`.
- **Purpose**: Real-time sensor readings for Indian monitoring stations across state pollution control boards (WBPCB, DPCC, MPCB, TNPCB) and international reference monitors.
- **Rate Limits**: Respected with local Redis caching (15-minute TTL per station).
- **Error Handling**: Graceful fallback to nearest operational station or hourly satellite/model estimates when ground sensors suffer outages.

---

## 3. Open-Meteo Air Quality & Weather API
- **API Endpoint**: `https://air-quality-api.open-meteo.com/v1/air-quality`
- **Authentication**: Free tier / standard REST.
- **Parameters**: `hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi,us_aqi`
- **Purpose**: 5-day predictive forecasts and hourly meteorological context (temperature, surface wind, relative humidity) used for inversion and dispersion modeling.
- **Provenance Rule**: Predictions are strictly flagged as `forecast` in metadata and never represented as certified observations.

---

## 4. Google Maps Platform
- **Libraries**: `@vis.gl/react-google-maps` (Frontend), Google Maps APIs (Geocoding/Places/Routes).
- **Security**:
  - API Key restricted to domain origin.
  - Strict quotas and billing alarms configured in GCP Console.
- **Purpose**: Interactive map canvas, station markers, geospatial visual bounds, and transit routing distance calculations.

---

## 5. Large Language Model (OpenRouter / OpenAI compatible)
- **Engine**: OpenAI SDK pointing to OpenRouter (`https://openrouter.ai/api/v1`) or direct API.
- **Model Flexibility**: Environment variable `LLM_MODEL` (default: `google/gemini-2.0-flash-001` or `anthropic/claude-3.5-sonnet`).
- **Structured Outputs**: All agents use Pydantic models for validated, deterministic schema synthesis.
- **Guardrails**: Prompt engineering enforces scientific caution, forbids diagnosing illnesses, and mandates citation of station timestamps.
