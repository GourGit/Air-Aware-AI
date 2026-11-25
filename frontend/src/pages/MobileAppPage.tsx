import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Smartphone,
  MessageSquare,
  CalendarClock,
  Home,
  Route,
  Leaf,
  Users,
  Settings,
  ArrowRight,
  CheckCircle2,
  Shield,
  Sparkles,
  Wind,
  MapPin,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'LangGraph Multi-Agent AI Chat',
    desc: 'Specialized agents for routine planning, indoor air advice, transit emissions, impact tracking, and safety validation — all coordinated in one conversation.',
  },
  {
    icon: CalendarClock,
    title: 'Personalized Daily Routine',
    desc: 'Pollution-aware schedule with morning, commute, work, afternoon, evening, and night recommendations based on live CPCB data for your location.',
  },
  {
    icon: Home,
    title: 'Indoor Air Quality Advisor',
    desc: 'Ventilation timing, HEPA filter guidance, cooking emissions control, dust management, and humidity optimization for your specific home.',
  },
  {
    icon: Route,
    title: 'Sustainable Mobility Coach',
    desc: 'Deterministic CO2e comparisons for metro, bus, EV, bike, and walking. Calculates exact grams avoided vs private car using ARAI/CEA factors.',
  },
  {
    icon: Leaf,
    title: 'Personal Impact Tracker',
    desc: 'Verified carbon avoidance from your logged trips. Daily, weekly, monthly summaries with tier progression and ecological equivalence models.',
  },
  {
    icon: Users,
    title: 'Community Pollution Reporting',
    desc: 'Submit geotagged observations (smoke, dust, waste burning). Track moderation status. View nearby reports on the map.',
  },
  {
    icon: Settings,
    title: 'Smart Notifications & Preferences',
    desc: 'AQI spike alerts, daily briefings, purifier maintenance reminders, routine suggestions. Configurable thresholds and channels.',
  },
  {
    icon: Shield,
    title: 'Safety & Validation Layer',
    desc: 'Medical claim detection, data provenance verification, forecast vs observation separation, numerical consistency checks — no hallucination.',
  },
];

const PLATFORMS = [
  {
    name: 'Android (Google Play)',
    icon: '🤖',
    desc: 'Native Android app with offline caching, background sync, and system notifications.',
  },
  {
    name: 'iOS (App Store)',
    icon: '🍎',
    desc: 'Native iOS app with widget support, Siri shortcuts, and HealthKit integration ready.',
  },
];

export default function MobileAppPage() {
  return (
    <div className="min-h-screen bg-muted dark:bg-charcoal text-charcoal dark:text-mist">
      {/* Navigation Bar */}
      <header className="border-b border-border dark:border-forest/40 bg-white/80 dark:bg-charcoal/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center text-white font-display font-bold text-lg shadow-sm">
              AA
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-charcoal dark:text-white">
              AirAware AI
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate">
            <Link to="/" className="hover:text-charcoal dark:hover:text-white transition-colors">Live AQI</Link>
            <Link to="/map" className="hover:text-charcoal dark:hover:text-white transition-colors">Pollution Map</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 bg-gradient-to-b from-mint/5 to-transparent dark:from-forest/10 dark:to-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-mint/10 border border-mint/20 text-mint text-xs font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Native Mobile Application</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-charcoal dark:text-white leading-[1.15]"
            >
              Personalized Environmental Intelligence <span className="text-mint">in Your Pocket</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-slate dark:text-slate/80 leading-relaxed max-w-2xl mx-auto"
            >
              The public website shows live ambient AQI. The mobile app gives you a personal environmental companion — AI chat, pollution-aware routines, indoor guidance, transit emissions, impact tracking, and community reporting — all synced to your location and preferences.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Button size="lg" className="w-full sm:w-auto bg-mint hover:bg-mint/90 text-white font-medium px-8 gap-2 shadow-lg shadow-mint/20">
                <Download className="w-4 h-4" />
                <span>Get the Mobile App</span>
              </Button>
              <Link to="/dashboard">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Continue to Public AQI
                </Button>
              </Link>
            </motion.div>

            {/* Platform badges */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6"
            >
              {PLATFORMS.map((p, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-charcoal border border-border dark:border-forest/30 text-xs font-medium text-slate">
                  <span>{p.icon}</span>
                  <span>{p.name}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white dark:bg-charcoal/50 border-y border-border dark:border-forest/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-mint/10 border border-mint/20 text-mint text-xs font-semibold"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>8 Specialized Capabilities</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold font-display text-charcoal dark:text-white"
            >
              Everything Your Personal Environmental Companion Does
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate"
            >
              Built on the same CPCB-standard backend as the public website — but personalized, private, and proactive.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="p-6 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal space-y-4 hover:border-mint/40 hover:shadow-lg hover:shadow-mint/10 dark:hover:shadow-mint/5 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-mint/10 border border-mint/20 flex items-center justify-center text-mint">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-display text-charcoal dark:text-white">{f.title}</h3>
                <p className="text-sm text-slate leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/50 dark:bg-forest/10 border-y border-border dark:border-forest/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-bold font-display text-charcoal dark:text-white">Seamless Public ↔ Personal Experience</h2>
            <p className="text-slate">One shared backend. Two optimized frontends. Zero duplication.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Public Website',
                desc: 'Anyone visits airaware.ai → sees live CPCB AQI, station map, forecasts, pollutant details — no login needed.',
                icon: Wind,
              },
              {
                step: '02',
                title: 'Download Mobile App',
                desc: 'Install from Play Store or App Store → sign up with email → grant location permission for hyperlocal data.',
                icon: Smartphone,
              },
              {
                step: '03',
                title: 'Personalized Intelligence',
                desc: 'AI chat knows your city. Routine adapts to your AQI. Impact tracks your trips. Notifications alert you proactively.',
                icon: Sparkles,
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="p-8 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-mint/10 border border-mint/20 flex items-center justify-center text-mint font-bold text-2xl">
                    {s.step}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-muted dark:bg-forest/20 flex items-center justify-center text-mint">
                    <s.icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-xl font-bold font-display text-charcoal dark:text-white">{s.title}</h3>
                <p className="text-slate leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-charcoal dark:bg-charcoal text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-mint/20 border border-mint/30 text-mint text-xs font-semibold"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy-First Architecture</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold font-display leading-[1.2]"
          >
            Your Data Stays Yours. Your Air Intelligence Goes Everywhere.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate/80 text-lg leading-relaxed"
          >
            Location data processed locally for hyperlocal AQI. Conversations encrypted. No tracking. No ads. Open-source methodology.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button size="lg" className="w-full sm:w-auto bg-mint hover:bg-mint/90 text-white font-medium px-8 gap-2 shadow-lg shadow-mint/20">
              <Download className="w-4 h-4" />
              <span>Download Mobile App</span>
            </Button>
            <Link to="/dashboard">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto border-white/20 hover:border-white/40 text-white">
                Back to Public AQI
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-charcoal/80 dark:bg-charcoal text-slate text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-mint flex items-center justify-center text-white font-bold text-sm">
              AA
            </div>
            <span className="font-display font-bold text-white">AirAware AI</span>
            <span className="text-xs text-slate">© 2026. Official Indian CPCB Standards.</span>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <Link to="/login" className="hover:text-white">Sign In</Link>
            <Link to="/register" className="hover:text-white">Register</Link>
            <a href="#aqi-standard" className="hover:text-white">Methodology</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}