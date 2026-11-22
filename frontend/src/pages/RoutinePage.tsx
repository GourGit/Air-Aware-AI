import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, Circle, Sparkles, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { routineService } from '@/services/features';

export default function RoutinePage() {
  const [routine, setRoutine] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoutine = async () => {
    setLoading(true);
    try {
      const data = await routineService.getToday();
      setRoutine(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutine();
  }, []);

  const toggleItem = (itemId: string) => {
    if (!routine) return;
    setRoutine({
      ...routine,
      items: routine.items.map((it: any) =>
        it.id === itemId ? { ...it, is_completed: !it.is_completed } : it
      ),
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border dark:border-forest/30">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-mint uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pollution-Aware Daily Routine</span>
            </div>
            <h1 className="text-2xl font-extrabold font-display text-charcoal dark:text-white mt-1">
              Personalized Lifestyle Schedule
            </h1>
          </div>

          <Button variant="outline" size="sm" onClick={fetchRoutine} className="gap-2 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Regenerate Routine
          </Button>
        </div>

        {routine && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-display text-charcoal dark:text-white">
                  {routine.headline}
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-mint/10 text-mint font-semibold">
                  Today's Active Plan
                </span>
              </div>
              <p className="text-xs text-slate mt-2 leading-relaxed">{routine.summary}</p>
            </div>

            {/* Schedule Timeline */}
            <div className="space-y-4">
              {routine.items.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                    item.is_completed
                      ? 'border-mint/40 bg-mint/5 dark:bg-mint/10'
                      : 'border-border dark:border-forest/40 bg-white dark:bg-charcoal shadow-sm hover:border-mint/60'
                  }`}
                >
                  <button className="mt-0.5 text-mint shrink-0">
                    {item.is_completed ? (
                      <CheckCircle2 className="w-5 h-5 fill-mint text-white" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate" />
                    )}
                  </button>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-mint tracking-wider">
                        {item.time_period}
                      </span>
                      <span className="text-xs text-slate font-medium">{item.title}</span>
                    </div>

                    <p
                      className={`text-sm ${
                        item.is_completed
                          ? 'line-through text-slate'
                          : 'text-charcoal dark:text-mist font-medium'
                      }`}
                    >
                      {item.recommendation}
                    </p>

                    <p className="text-xs text-slate">
                      <strong>Environmental Grounding:</strong> {item.environmental_reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
