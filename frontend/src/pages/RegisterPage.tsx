import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);

    const newUser = {
      id: 'usr-new-1234',
      email,
      displayName,
      role: 'user',
      isActive: true,
    };
    setAuth(newUser, 'mock-jwt-token', 'mock-refresh-token');
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-muted dark:bg-charcoal flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center text-white font-bold text-lg shadow-sm">
            AA
          </div>
          <span className="font-display font-bold text-2xl text-charcoal dark:text-white">
            AirAware AI
          </span>
        </Link>
        <h2 className="text-2xl font-bold font-display text-charcoal dark:text-white">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-slate">
          Personalize air quality alerts and lifestyle planning
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-charcoal/90 py-8 px-6 sm:px-10 rounded-2xl border border-border dark:border-forest/40 shadow-xl space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate absolute left-3 top-3" />
                <Input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Aarav Sharma"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate absolute left-3 top-3" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate absolute left-3 top-3" />
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-mint hover:bg-mint/90 text-white">
              {loading ? 'Creating account...' : 'Continue to Onboarding'}
            </Button>
          </form>

          <p className="text-center text-xs text-slate">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-mint hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
