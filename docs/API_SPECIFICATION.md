# REST API Specification (v1)

**Base URL**: `/api/v1`  
**Protocol**: HTTPS (Production) / HTTP (Local Dev)  
**Authentication**: Bearer JWT (`Authorization: Bearer <access_token>`)  
**Data Format**: JSON (`Content-Type: application/json`)

---

## Standard Response Schemas

### Standard Success Envelope
```json
{
  "success": true,
  "data": {},
  "metadata": {
    "timestamp": "2026-11-22T06:20:00Z",
    "request_id": "req-9b8c2d1e-84f2-4a0b-93bf-4d8e5f2a1b3c"
  }
}
```

### Standard Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid latitude coordinate",
    "details": [
      {
        "field": "latitude",
        "issue": "Must be between -90.0 and 90.0"
      }
    ]
  },
  "metadata": {
    "timestamp": "2026-11-22T06:20:00Z",
    "request_id": "req-9b8c2d1e-84f2-4a0b-93bf-4d8e5f2a1b3c"
  }
}
```

---

## 1. Authentication Endpoints (`/auth`)

### `POST /auth/register`
Create a new user account.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "display_name": "Aarav Sharma"
  }
  ```
- **Responses**:
  - `201 Created`: Returns created user profile and JWT token pair.
  - `400 Bad Request`: Email already registered or invalid password complexity.

### `POST /auth/login`
Authenticate with email and password.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "d8f7e6a5...",
    "token_type": "bearer",
    "expires_in": 1800,
    "user": {
      "id": "a1b2c3d4-...",
      "email": "user@example.com",
      "display_name": "Aarav Sharma"
    }
  }
  ```

### `POST /auth/refresh`
Obtain a new access token using a valid refresh token.
- **Request Body**: `{"refresh_token": "d8f7e6a5..."}`
- **Response**: `200 OK` with renewed access token.

### `POST /auth/logout`
Revoke the refresh token session.
- **Header**: Bearer token required.
- **Response**: `200 OK` `{"message": "Logged out successfully"}`

### `GET /auth/me`
Retrieve currently authenticated identity.
- **Response**: `200 OK` User profile summary.

---

## 2. User & Profile Endpoints (`/users`)

### `GET /users/me`
Retrieve user profile, preferences, and onboarding parameters.

### `PUT /users/me`
Update base profile details (display name).

### `GET /users/profile`
Retrieve deep onboarding profile (city, commute, household context).

### `PUT /users/profile`
Update deep personalization profile:
```json
{
  "city": "Kolkata",
  "preferred_location_lat": 22.5726,
  "preferred_location_lng": 88.3639,
  "preferred_location_name": "Salt Lake Sector V",
  "occupation": "Software Engineer",
  "commute_type": "metro",
  "commute_duration_mins": 45,
  "outdoor_activity_type": "evening_walk",
  "household_context": {
    "has_air_purifier": true,
    "has_children": false,
    "has_elderly": true,
    "pets": "cat"
  }
}
```

### `DELETE /users/me`
Delete user account and all associated personal data in accordance with privacy laws.

---

## 3. Locations & Stations (`/locations`, `/air/stations`)

### `GET /locations/search?q={query}`
Search known urban locations and landmarks.

### `GET /air/stations`
List all monitoring stations with optional bounding box or radius filters.
- **Query Params**:
  - `lat`: float
  - `lng`: float
  - `radius_km`: float (default 25)
  - `city`: string

### `GET /air/stations/{station_id}`
Detailed station metrics, historical uptime, and pollutant capabilities.

---

## 4. Air Quality Intelligence (`/air`)

### `GET /air/current`
Get authoritative current air quality for coordinates or city.
- **Query Params**: `lat`, `lng`, `city`
- **Response**:
```json
{
  "location": {
    "name": "Anand Vihar, Delhi",
    "latitude": 28.6508,
    "longitude": 77.3152,
    "station_name": "Anand Vihar - DPCC",
    "station_id": "cpcb-dl-01"
  },
  "air_quality": {
    "aqi": 342,
    "category": "Very Poor",
    "cpcb_color": "#CC0033",
    "prominent_pollutant": "pm25",
    "standard": "IN_CPCB",
    "status": "live"
  },
  "pollutants": {
    "pm25": { "value": 182.4, "unit": "µg/m³", "sub_index": 342 },
    "pm10": { "value": 298.1, "unit": "µg/m³", "sub_index": 248 },
    "no2": { "value": 64.2, "unit": "µg/m³", "sub_index": 80 },
    "so2": { "value": 18.5, "unit": "µg/m³", "sub_index": 23 },
    "co": { "value": 1.8, "unit": "mg/m³", "sub_index": 90 },
    "o3": { "value": 42.0, "unit": "µg/m³", "sub_index": 42 }
  },
  "health_advisory": {
    "summary": "Respiratory illness on prolonged exposure. Avoid strenuous outdoor activities.",
    "sensitive_groups": "People with lung diseases, children and older adults should stay indoors."
  },
  "metadata": {
    "source": "CPCB / DPCC",
    "observed_at": "2026-11-22T05:30:00Z",
    "retrieved_at": "2026-11-22T06:00:00Z",
    "is_stale": false
  }
}
```

### `GET /air/history`
Historical measurements for a station or area.
- **Query Params**: `station_id`, `from_date`, `to_date`, `pollutant`, `interval` (1h, 24h).

### `GET /air/forecast`
Multi-day hourly forecast from Open-Meteo Air Quality integration.
- **Query Params**: `lat`, `lng`, `days` (1-5).
- Returns hourly predicted PM2.5, PM10, Indian AQI equivalent, and meteorological context.

---

## 5. Daily Routine Generator (`/routines`)

### `POST /routines/generate`
Trigger AI routine generator agent.
- **Request Body**:
  ```json
  {
    "target_date": "2026-11-22",
    "location": { "lat": 28.6508, "lng": 77.3152, "name": "Delhi" },
    "custom_activities": ["morning run", "office commute", "groceries"]
  }
  ```
- **Response**: Complete structured routine partitioned into morning, travel, work, afternoon, evening, and night, with supporting empirical environmental rationale.

### `GET /routines/today`
Retrieve active routine for current date.

### `POST /routines/{routine_id}/items/{item_id}/complete`
Toggle completion state of a routine action.

---

## 6. AI Environmental Assistant (`/assistant`)

### `POST /assistant/chat`
Execute conversational multi-agent workflow.
- **Request Body**:
  ```json
  {
    "conversation_id": "optional-uuid",
    "message": "Is it safe to run outdoors in Salt Lake this morning?",
    "location_context": { "lat": 22.5726, "lng": 88.3639, "city": "Kolkata" }
  }
  ```
- **Response**:
  ```json
  {
    "conversation_id": "a3b4c5...",
    "answer": "Outdoor running is not recommended this morning. Current PM2.5 levels in Salt Lake are 142 µg/m³ (CPCB AQI 318 - Very Poor). Peak inversion is trapping pollutants until 10:30 AM.",
    "intent": "outdoor_activity_safety",
    "supporting_data": {
      "aqi": 318,
      "category": "Very Poor",
      "pm25": 142.0,
      "station": "Salt Lake - WBPCB"
    },
    "recommendations": [
      "Switch to indoor treadmill or bodyweight training",
      "Keep windows closed until midday when dispersion improves"
    ],
    "limitations": "Advisory based on outdoor ambient sensor readings; indoor exposures depend on filtration.",
    "sources": ["WBPCB Real-time Station WB004"],
    "observed_at": "2026-11-22T05:00:00Z"
  }
  ```

### `GET /assistant/conversations`
List previous conversations with preview and timestamps.

### `DELETE /assistant/conversations/{conversation_id}`
Clear conversation history.

---

## 7. Indoor Air Advisor (`/indoor`)

### `GET /indoor/guidance`
Retrieve science-based guidelines for ventilation, air purifiers, cooking emissions, and dust mitigation based on ambient outdoor AQI.

### `POST /indoor/assessment`
Submit household questionnaire to receive custom mitigation score and tailored recommendations.

### `GET /indoor/checklists`
List seasonal and daily indoor air hygiene checklists.

---

## 8. Sustainable Mobility (`/mobility`)

### `POST /mobility/compare`
Deterministic calculation comparing transportation modes for a given route.
- **Request Body**:
  ```json
  {
    "distance_km": 14.5,
    "origin": "Rohini",
    "destination": "Connaught Place",
    "passengers": 1
  }
  ```
- **Response**:
  ```json
  {
    "distance_km": 14.5,
    "comparisons": [
      {
        "mode": "metro",
        "co2e_emissions_kg": 0.23,
        "co2e_saved_vs_car_kg": 2.12,
        "travel_time_est_mins": 35
      },
      {
        "mode": "bus",
        "co2e_emissions_kg": 0.58,
        "co2e_saved_vs_car_kg": 1.77,
        "travel_time_est_mins": 55
      },
      {
        "mode": "private_car_petrol",
        "co2e_emissions_kg": 2.35,
        "co2e_saved_vs_car_kg": 0.0,
        "travel_time_est_mins": 45
      }
    ],
    "emission_factors_source": "India CEA Baseline & ARAI Fleet Averages 2024"
  }
  ```

---

## 9. Personal Impact Tracker (`/impact`)

### `GET /impact/summary`
Get total lifetime and monthly CO2e savings, mode distribution, and health exposure credits.

### `POST /impact/records`
Log a sustainable choice (e.g. took metro, cycled, maintained purifier).

---

## 10. Community Pollution Intelligence (`/community`)

### `GET /community/reports`
Fetch geotagged community pollution reports.
- **Query Params**: `lat`, `lng`, `radius_km`, `category`, `status` (default: approved).

### `POST /community/reports`
Submit an environmental report (waste burning, construction dust, industrial fumes).
- **Request**: Multipart or JSON with category, description, lat/lng, anonymized location name, and optional image URL.

### `POST /community/reports/{id}/moderate` (Admin/Moderator only)
Approve, reject, or flag a user submission.

---

## 11. Alerts & Notifications (`/notifications`)

### `GET /notifications`
Fetch recent user notifications.

### `PATCH /notifications/{id}/read`
Mark alert as read.

### `GET /notifications/preferences` & `PUT /notifications/preferences`
Inspect and update alert thresholds and morning brief schedule.

---

## 12. System Health (`/health`)

### `GET /health`
Liveness probe. Returns `{"status": "ok"}`.

### `GET /health/ready`
Readiness probe. Checks PostgreSQL connectivity, Redis latency, and external API status.
