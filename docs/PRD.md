# AirAware AI — Product Requirements Document

> **Understand Your Air. Improve Your Everyday.**

## 1. Product Vision

AirAware AI is an Agentic Urban Air Quality & Lifestyle Intelligence Platform that transforms raw air quality data into actionable, personalized lifestyle guidance. By combining real-time environmental monitoring with a multi-agent AI system, AirAware empowers individuals and communities to make informed decisions about their daily routines, commutes, indoor environments, and long-term health — all through natural conversation.

Air pollution is the single largest environmental health risk globally, responsible for an estimated 7 million premature deaths annually (WHO). In Indian cities — where AQI frequently exceeds hazardous thresholds — citizens lack a single, intelligent platform that translates dense pollution data into plain-language guidance they can act on immediately. AirAware bridges this gap.

### 1.1 Product Principles

| Principle | Description |
|-----------|-------------|
| **Actionable Over Informational** | Every data point must lead to a recommendation the user can act on today. |
| **Conversational First** | Users interact through natural language; the AI handles complexity behind the scenes. |
| **Scientifically Grounded** | All guidance cites data sources, uses Indian CPCB AQI standards, and passes validation. |
| **Privacy Respectful** | Minimal data collection, full account deletion support, no data selling. |
| **Inclusive Design** | Accessible to students, families, elderly, and non-technical users alike. |

---

## 2. Target Users

### 2.1 Primary Personas

#### Health-Conscious Individual
- **Age:** 25–45
- **Context:** Lives in a metro city (Delhi, Mumbai, Kolkata, Bengaluru). Checks AQI before morning jog.
- **Needs:** Real-time AQI, exercise timing, mask recommendations, indoor air tips.
- **Pain Point:** Existing apps show numbers but no guidance on what to *do*.

#### Parent / Family Caregiver
- **Age:** 30–50
- **Context:** Has children or elderly family members with respiratory sensitivities.
- **Needs:** School commute safety, indoor air quality in home, alerts for vulnerable family members.
- **Pain Point:** No single app addresses household-level air quality planning.

#### College Student
- **Age:** 18–25
- **Context:** Commutes by public transport, budget-conscious, tech-savvy.
- **Needs:** Best commute mode for air quality, campus area AQI, low-cost indoor tips.
- **Pain Point:** Unaware of cumulative pollution exposure during daily commute.

#### Daily Commuter
- **Age:** 22–55
- **Context:** Drives or takes public transport to work in heavy-traffic corridors.
- **Needs:** Route-aware air quality, transport mode comparison, emission impact of travel choices.
- **Pain Point:** No visibility into how commute choice affects both exposure and emissions.

#### Community Organizer
- **Age:** 30–60
- **Context:** Leads a residential welfare association or local environmental group.
- **Needs:** Community-level AQI reporting, crowdsourced observations, moderation tools.
- **Pain Point:** No platform to aggregate and act on hyper-local air quality observations.

### 2.2 Accessibility Considerations

- Support for English interface with clear, jargon-free language
- Color-coded AQI categories following CPCB standards with text labels for color-blind users
- Responsive design for mobile, tablet, and desktop
- Keyboard-navigable UI with proper ARIA labels

---

## 3. Core Features (11 Modules)

### Module 1: Real-Time AQI Dashboard
- Current AQI for user's saved locations with CPCB category display (Good / Satisfactory / Moderate / Poor / Very Poor / Severe)
- Individual pollutant breakdown: PM2.5, PM10, NO₂, SO₂, CO, O₃
- 24-hour trend chart and 5-day forecast
- Nearby monitoring station display on interactive map
- Data freshness indicator with source attribution

### Module 2: AI-Powered Conversational Assistant
- Natural language chat interface for air quality questions
- Multi-turn conversation with context retention
- Intent classification routing to specialized AI agents
- Source-cited responses with confidence indicators
- Conversation history management

### Module 3: Personalized Routine Planning
- AI-generated daily schedules optimized for air quality windows
- Activity-specific recommendations (outdoor exercise, commute timing, errands)
- Adaptation to user's health profile and sensitivity level
- Routine item tracking with completion status
- Historical routine review

### Module 4: Indoor Air Quality Guidance
- Room-by-room ventilation scheduling based on outdoor AQI
- Air purifier and filter recommendations with CADR guidance
- Household pollutant source identification (cooking, cleaning, furniture)
- Plant recommendations for natural air filtration
- Seasonal indoor air management checklists

### Module 5: Smart Mobility & Commute Intelligence
- Transport mode comparison (walk, cycle, auto, bus, metro, car) with air quality exposure scores
- Route-aware pollution exposure estimation
- Real-time commute recommendations based on current AQI
- Historical commute pattern analysis

### Module 6: Personal Impact Calculator
- Carbon footprint tracking from transport choices
- Cumulative pollution exposure estimation
- Sustainability milestones and streaks
- Comparative impact visualization (vs. city average)
- Actionable reduction suggestions

### Module 7: Emission Factor Engine
- Deterministic emission calculations per transport mode per km
- Indian-specific emission factors (BS-VI norms, local fleet composition)
- Well-to-wheel vs. tailpipe emission breakdowns
- Equivalent impact translations (trees needed, electricity saved)

### Module 8: Community Air Quality Reports
- Crowdsourced air quality observations with photo uploads
- Location-tagged community reports with moderation
- Community-level AQI heatmaps
- Report voting and verification
- Moderation queue for flagged content

### Module 9: Smart Notifications & Alerts
- Configurable AQI threshold alerts per location
- Severe pollution spike notifications
- Optimal activity window suggestions
- Routine reminders with air quality context
- Notification preference management (push, in-app)

### Module 10: Household Management
- Multi-member household profiles with individual health sensitivities
- Household-level air quality recommendations
- Shared location management
- Family member vulnerability scoring (age, conditions)

### Module 11: Data Provenance & Safety Layer
- Source attribution for every data point
- Data freshness validation and staleness warnings
- Claim verification for AI-generated recommendations
- Audit trail for all AI agent decisions
- Transparent confidence scoring

---

## 4. User Journeys

### Journey 1: Morning Routine Optimization

```
User opens app → Sees current AQI (Moderate: 145) for home location
→ Asks: "Is it safe to go for a morning run?"
→ AI Orchestrator classifies intent → Routes to AQI Agent + Routine Agent
→ AQI Agent retrieves current data + 3-hour forecast
→ Routine Agent generates optimized schedule
→ Response: "Current PM2.5 is 65 µg/m³ (Moderate). AQI drops to 95 by 7:30 AM.
   Recommendation: Delay your run to 7:30–8:30 AM. Use an N95 mask if running earlier."
→ User accepts → Routine item created → Completion tracked
```

### Journey 2: Commute Decision

```
User asks: "Should I bike or take the metro to work today?"
→ Orchestrator routes to Mobility Agent + AQI Agent + Impact Agent
→ Mobility Agent compares exposure: Bike (42 min, AQI 180 exposure) vs. Metro (35 min, AQI 65 exposure)
→ Impact Agent calculates: Bike (0 kg CO₂) vs. Metro (0.4 kg CO₂) vs. Car (2.1 kg CO₂)
→ Response: "Metro recommended today. Outdoor AQI is 180 (Poor) — cycling would
   expose you to 3x more PM2.5. Metro saves you 1.7 kg CO₂ vs. driving."
→ User logs commute → Impact record created
```

### Journey 3: Family Air Quality Alert

```
AQI spikes to 350 (Very Poor) at user's home location
→ Notification system triggers alert
→ User opens app → Asks: "What should my family do right now?"
→ Orchestrator routes to Indoor Agent + AQI Agent
→ Indoor Agent generates emergency guidance
→ Response: "AQI is 350 (Very Poor). Immediate actions:
   1. Close all windows and doors
   2. Run air purifiers on max (keep bedroom doors open)
   3. Avoid cooking with gas — use electric appliances
   4. Keep children and elderly indoors
   5. AQI expected to improve to 200 by tomorrow morning."
```

### Journey 4: Community Reporting

```
User notices unusual smoke in neighborhood
→ Opens Community tab → Creates report with photo + location
→ Report tagged with current AQI + GPS coordinates
→ Nearby users see report on community map
→ Moderator validates → Report verified
→ Community AQI overlay updated with crowdsourced data
```

---

## 5. Success Metrics

### 5.1 Engagement Metrics

| Metric | Target (Month 3) | Target (Month 6) |
|--------|------------------|------------------|
| Daily Active Users (DAU) | 500 | 2,000 |
| Avg. sessions per user/week | 3 | 5 |
| Chat messages per session | 2.5 | 4 |
| Routine completion rate | 40% | 60% |
| Community reports per week | 50 | 200 |

### 5.2 Quality Metrics

| Metric | Target |
|--------|--------|
| AI response accuracy (validated) | ≥ 90% |
| Data freshness (< 2 hours old) | ≥ 95% of queries |
| API uptime | ≥ 99.5% |
| P95 response latency | < 3 seconds |
| Chat satisfaction rating | ≥ 4.0 / 5.0 |

### 5.3 Impact Metrics

| Metric | Target (Month 6) |
|--------|------------------|
| Total CO₂ reduction tracked | 10,000 kg |
| Users with reduced pollution exposure | 60% of active users |
| Community reports leading to action | 15% |

---

## 6. Non-Functional Requirements

### 6.1 Performance
- Page load time: < 2 seconds (LCP)
- API response time: < 500ms for data endpoints, < 5s for AI endpoints
- Map rendering: < 1 second for initial tile load
- Support 1,000 concurrent users at launch

### 6.2 Security
- All data encrypted in transit (TLS 1.2+) and at rest
- JWT-based authentication with short-lived access tokens (15 min) and refresh tokens (7 days)
- Password hashing with bcrypt (12 rounds)
- Rate limiting on all public endpoints
- Full OWASP Top 10 mitigation
- Complete account and data deletion support

### 6.3 Reliability
- 99.5% uptime SLA for backend services
- Graceful degradation when external APIs are unavailable
- Circuit breaker pattern for third-party integrations
- Automatic retry with exponential backoff for transient failures

### 6.4 Scalability
- Stateless backend services behind load balancer
- Database connection pooling
- Redis caching for frequently accessed AQI data (TTL: 5–15 minutes)
- Horizontal scaling capability for backend workers

### 6.5 Compliance
- Indian IT Act compliance for data handling
- CPCB AQI standard (IND-AQI) for all air quality calculations
- Transparent data source attribution per government open data guidelines
- No collection of unnecessary personal data (data minimization)

### 6.6 Maintainability
- Comprehensive API documentation (OpenAPI 3.1)
- Structured logging with correlation IDs
- Database migration management with Alembic
- Type safety with TypeScript (frontend) and Pydantic (backend)

---

## 7. Release Strategy

### Phase 0 — Foundation (Current)
- Project documentation and architecture design
- Database schema design and API specification
- Security model and integration planning

### Phase 1 — Backend Core
- Authentication system, user management, database setup
- Air quality data ingestion pipeline
- Core API endpoints

### Phase 2 — Frontend Foundation
- React app scaffold, routing, auth flows
- AQI dashboard with map and charts
- Responsive layout and design system

### Phase 3 — AI Agent System
- LangGraph multi-agent implementation
- Conversational assistant with intent routing
- Agent orchestration and response synthesis

### Phase 4 — Feature Modules
- Routine planning, indoor air, mobility, impact calculator
- Community reports, notifications, household management

### Phase 5 — Polish & Launch
- Performance optimization, error handling, monitoring
- User testing, documentation, deployment automation

---

## 8. Assumptions and Constraints

### Assumptions
- OpenAQ API continues to provide free access to Indian monitoring station data
- Open-Meteo Air Quality API remains freely available for forecast data
- Users have smartphones or computers with modern browsers
- Indian CPCB AQI standard remains the reference framework

### Constraints
- LLM API costs require careful token management and caching
- CPCB does not provide a stable, documented public API — data access methods may change
- Real-time AQI data has inherent 1–2 hour lag from monitoring stations
- Initial launch targets Indian metro cities only

### Dependencies
- OpenAQ API v3 for historical and real-time air quality data
- Open-Meteo Air Quality API for forecast data
- Google Maps Platform for maps, geocoding, and routing
- OpenRouter for LLM access (GPT-4, Claude, Mixtral)
- Neon PostgreSQL for managed database
- Upstash Redis for managed caching

---

*Last updated: Phase 0 — Foundation*
*Document owner: AirAware AI Team*
