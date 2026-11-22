import { useState, useEffect } from 'react';
import { Users, Plus, AlertTriangle, ShieldCheck, MapPin, Eye, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { communityService } from '@/services/features';

export default function CommunityPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState('waste_burning');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('Anand Vihar Area');
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async () => {
    try {
      const data = await communityService.getReports();
      setReports(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      await communityService.submitReport({
        category,
        description,
        latitude: 28.652,
        longitude: 77.316,
        approx_location_name: locationName,
      });
      setShowModal(false);
      setDescription('');
      fetchReports();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border dark:border-forest/30">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-mint uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>Crowdsourced Environmental Watch</span>
            </div>
            <h1 className="text-2xl font-extrabold font-display text-charcoal dark:text-white mt-1">
              Community Pollution Reports
            </h1>
            <p className="text-xs text-slate mt-0.5">
              Citizen-reported local pollution hazards: open burning, construction dust, and traffic hotspots.
            </p>
          </div>

          <Button onClick={() => setShowModal(true)} className="bg-mint hover:bg-mint/90 text-white gap-2">
            <Plus className="w-4 h-4" />
            <span>Submit Observation</span>
          </Button>
        </div>

        {/* Community Reports Feed */}
        <div className="space-y-4">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="p-5 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    {rep.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-mint" />
                    {rep.approx_location_name}
                  </span>
                </div>
                <span className="text-xs text-slate">{new Date(rep.observed_at).toLocaleDateString()}</span>
              </div>

              <p className="text-sm text-charcoal dark:text-mist leading-relaxed">{rep.description}</p>

              <div className="pt-2 border-t border-border/80 dark:border-forest/30 flex items-center justify-between text-xs text-slate">
                <span className="text-[11px] bg-muted dark:bg-forest/20 px-2 py-0.5 rounded">
                  Status: Verified Citizen Report
                </span>
                <span className="text-[10px]">Geoprivacy Protected (~500m precision)</span>
              </div>
            </div>
          ))}
        </div>

        {/* Report Submission Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-charcoal rounded-2xl border border-border dark:border-forest/40 max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold font-display text-charcoal dark:text-white">
                Submit Local Environmental Observation
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Hazard Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border dark:border-forest/40 bg-white dark:bg-charcoal text-xs text-charcoal dark:text-white"
                  >
                    <option value="waste_burning">Waste / Plastic / Biomass Burning</option>
                    <option value="construction_dust">Uncovered Demolition & Construction Dust</option>
                    <option value="traffic_congestion">Severe Localized Traffic Fumes</option>
                    <option value="industrial_emissions">Industrial Stack Smoke</option>
                    <option value="other">Other Environmental Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Neighborhood / Area</label>
                  <Input value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. Anand Vihar Sector 4" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate uppercase mb-1">Observation Details</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you observed (time, smoke color, approximate landmark)..."
                    className="w-full px-3 py-2 rounded-lg border border-border dark:border-forest/40 bg-white dark:bg-charcoal text-xs text-charcoal dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="w-1/2">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="w-1/2 bg-mint hover:bg-mint/90 text-white">
                    {submitting ? 'Submitting...' : 'Post Report'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
