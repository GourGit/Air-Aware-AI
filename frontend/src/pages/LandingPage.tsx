import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wind, Shield, Activity, Compass, ArrowRight, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
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
            <a href="#features" className="hover:text-charcoal dark:hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-charcoal dark:hover:text-white transition-colors">How It Works</a>
            <a href="#aqi-standard" className="hover:text-charcoal dark:hover:text-white transition-colors">CPCB Standards</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-mint hover:bg-mint/90 text-white">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-mint/10 border border-mint/20 text-mint text-xs font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Agent Urban Environmental Intelligence</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-charcoal dark:text-white leading-[1.15]"
            >
              Know Your Air. Make Better Choices. <span className="text-mint">Breathe Smarter.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-slate dark:text-slate/80 leading-relaxed"
            >
              Your intelligent companion for understanding urban pollution, planning healthier daily routines, and making sustainable mobility decisions across Indian cities.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link to="/dashboard">
                <Button size="lg" className="w-full sm:w-auto bg-mint hover:bg-mint/90 text-white font-medium px-8 gap-2 shadow-lg shadow-mint/20">
                  Explore Live AQI <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/map">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Interactive Pollution Map
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Environmental Dashboard Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 max-w-5xl mx-auto rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal shadow-2xl p-6 md:p-8"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-border dark:border-forest/30 gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-slate">Live CAAQMS Station</span>
                <h3 className="text-xl font-bold font-display text-charcoal dark:text-white">Anand Vihar, Delhi — DPCC</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  Very Poor (AQI 342)
                </span>
                <span className="text-xs text-slate">CPCB NAQI Standard</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 py-6">
              {[
                { label: 'PM2.5', val: '178 µg/m³', sub: 'Sub-idx: 342' },
                { label: 'PM10', val: '292 µg/m³', sub: 'Sub-idx: 242' },
                { label: 'NO2', val: '68 µg/m³', sub: 'Sub-idx: 85' },
                { label: 'SO2', val: '19.5 µg/m³', sub: 'Sub-idx: 24' },
                { label: 'CO', val: '1.9 mg/m³', sub: 'Sub-idx: 95' },
                { label: 'Ozone', val: '38 µg/m³', sub: 'Sub-idx: 38' },
              ].map((item, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-muted dark:bg-forest/20 border border-border/60 dark:border-forest/40">
                  <span className="text-xs font-semibold text-slate">{item.label}</span>
                  <p className="text-base font-bold text-charcoal dark:text-white mt-1">{item.val}</p>
                  <span className="text-[10px] text-slate/80">{item.sub}</span>
                </div>
              ))}
            </div>

            <div className="bg-mint/5 dark:bg-mint/10 border border-mint/20 rounded-xl p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-mint shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-charcoal dark:text-mist">
                <strong>AI Environmental Intelligence:</strong> Surface atmospheric thermal inversion is trapping particulate matter this morning. Recommended action: Reschedule outdoor cardio workouts to indoors; utilize public transit or keep vehicle AC in recirculate mode.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section id="features" className="py-20 bg-white dark:bg-charcoal/50 border-y border-border dark:border-forest/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-bold font-display text-charcoal dark:text-white">Built for Everyday Urban Health</h2>
            <p className="text-slate">Beyond raw sensor numbers — translating complex atmospheric physics into practical human guidance.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Activity,
                title: 'LangGraph Multi-Agent AI',
                desc: 'Coordinated specialized agents for routine planning, indoor air advice, deterministic transit emissions, and safety validation without medical hallucination.',
              },
              {
                icon: Compass,
                title: 'Official CPCB NAQI Standard',
                desc: 'Strict Indian Central Pollution Control Board calculations requiring multi-pollutant breakpoints with dominant pollutant identification.',
              },
              {
                icon: Wind,
                title: 'Sustainable Mobility & Impact',
                desc: 'Calculates true grams of CO2e avoided when choosing metro, electric bus, or bicycle over private vehicles based on ARAI standards.',
              },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border dark:border-forest/40 bg-muted/50 dark:bg-forest/10 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-mint/10 border border-mint/20 flex items-center justify-center text-mint">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-display text-charcoal dark:text-white">{f.title}</h3>
                <p className="text-sm text-slate leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-charcoal text-slate text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-mint flex items-center justify-center text-white font-bold text-sm">
              AA
            </div>
            <span className="font-display font-bold text-mist">AirAware AI</span>
            <span className="text-xs text-slate">© 2026. Official Indian CPCB Standards.</span>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <Link to="/login" className="hover:text-mist">Sign In</Link>
            <Link to="/register" className="hover:text-mist">Register</Link>
            <a href="#aqi-standard" className="hover:text-mist">Methodology</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
