import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Briefcase, Car, Activity, Bell, Home, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [city, setCity] = useState('Delhi');
  const [commuteType, setCommuteType] = useState('metro');
  const [outdoorActivity, setOutdoorActivity] = useState('evening_walk');
  const [hasPurifier, setHasPurifier] = useState(true);
  const [step, setStep] = useState(1);

  const handleFinish = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-muted dark:bg-charcoal flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto w-full bg-white dark:bg-charcoal/90 p-8 rounded-2xl border border-border dark:border-forest/40 shadow-xl space-y-6">
        <div className="border-b border-border dark:border-forest/30 pb-4">
          <span className="text-xs font-bold uppercase text-mint tracking-wider">Step {step} of 3</span>
          <h2 className="text-2xl font-bold font-display text-charcoal dark:text-white mt-1">
            Personalize Your Air Experience
          </h2>
          <p className="text-sm text-slate mt-1">
            Tailor recommendations to your daily city commute and lifestyle routine.
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Primary City of Residence</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border dark:border-forest/40 bg-white dark:bg-charcoal text-sm text-charcoal dark:text-white"
              >
                <option value="Delhi">Delhi NCR (Anand Vihar, R K Puram)</option>
                <option value="Kolkata">Kolkata (Salt Lake, Victoria Memorial)</option>
                <option value="Mumbai">Mumbai (BKC, Bandra)</option>
                <option value="Bengaluru">Bengaluru (Silk Board, Whitefield)</option>
                <option value="Chennai">Chennai (Alandur)</option>
                <option value="Lucknow">Lucknow (Talkatora)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Typical Commute Mode</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'metro', label: 'Metro Rail' },
                  { id: 'bus', label: 'City Bus' },
                  { id: 'car', label: 'Private Car' },
                  { id: 'motorcycle', label: 'Motorcycle / Scooter' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCommuteType(item.id)}
                    className={`p-3 rounded-xl border text-sm font-medium text-left transition-colors ${
                      commuteType === item.id
                        ? 'border-mint bg-mint/10 text-mint'
                        : 'border-border dark:border-forest/40 text-slate hover:bg-mist dark:hover:bg-forest/20'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={() => setStep(2)} className="w-full bg-mint hover:bg-mint/90 text-white mt-4">
              Next: Lifestyle & Exercise
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Typical Outdoor Activity</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'morning_run', label: 'Morning Jog / Run' },
                  { id: 'evening_walk', label: 'Evening Walk' },
                  { id: 'cycling', label: 'Road Cycling' },
                  { id: 'indoor_gym', label: 'Primarily Indoor Gym' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOutdoorActivity(item.id)}
                    className={`p-3 rounded-xl border text-sm font-medium text-left transition-colors ${
                      outdoorActivity === item.id
                        ? 'border-mint bg-mint/10 text-mint'
                        : 'border-border dark:border-forest/40 text-slate hover:bg-mist dark:hover:bg-forest/20'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Household Air Protection</label>
              <div className="p-4 rounded-xl border border-border dark:border-forest/40 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-charcoal dark:text-white">HEPA Air Purifier</h4>
                  <p className="text-xs text-slate">Do you currently have an operational air purifier at home?</p>
                </div>
                <input
                  type="checkbox"
                  checked={hasPurifier}
                  onChange={(e) => setHasPurifier(e.target.checked)}
                  className="w-5 h-5 accent-mint rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="w-1/3">Back</Button>
              <Button onClick={() => setStep(3)} className="w-2/3 bg-mint hover:bg-mint/90 text-white">Next: Notifications</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-mint/10 border border-mint/20 space-y-2">
              <div className="flex items-center gap-2 text-mint font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Profile Configuration Ready</span>
              </div>
              <p className="text-xs text-charcoal dark:text-mist">
                We will send daily smog alerts when AQI in {city} exceeds 200, and tailor your morning schedule based on thermal inversion forecasts.
              </p>
            </div>

            <Button onClick={handleFinish} className="w-full bg-mint hover:bg-mint/90 text-white">
              Complete Setup & Open Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
