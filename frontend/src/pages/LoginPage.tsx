import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wind, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Demo authentication that enables immediate interactive evaluation
      const mockUser = {
        id: 'usr-demo-1234',
        email: email || 'user@airaware.ai',
        displayName: 'Aarav Sharma',
        role: 'user',
        isActive: true,
      };
      setAuth(mockUser, 'mock-jwt-access-token', 'mock-jwt-refresh-token');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('aarav.sharma@example.com');
    setPassword('AirAware2026!');
    const mockUser = {
      id: 'usr-demo-1234',
      email: 'aarav.sharma@example.com',
      displayName: 'Aarav Sharma',
      role: 'user',
      isActive: true,
    };
    setAuth(mockUser, 'mock-jwt-access-token', 'mock-jwt-refresh-token');
    navigate('/dashboard');
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
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-slate">
          Access your personal air intelligence workspace
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
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border dark:border-forest/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-charcoal px-2 text-slate">Quick Evaluation</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleDemoLogin}
            className="w-full border-mint/40 text-mint hover:bg-mint/10"
          >
            Launch Interactive Demo Mode
          </Button>

          <p className="text-center text-xs text-slate">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-mint hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
