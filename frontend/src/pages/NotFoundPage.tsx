import { Link } from 'react-router-dom';
import { Wind, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-muted dark:bg-charcoal flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-mint/10 border border-mint/20 flex items-center justify-center text-mint mb-4">
        <Wind className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold font-display text-charcoal dark:text-white">404</h1>
      <p className="text-slate text-sm mt-2 mb-6 max-w-sm">
        The requested environmental page does not exist or has been relocated.
      </p>
      <Link to="/dashboard">
        <Button className="bg-mint hover:bg-mint/90 text-white gap-2">
          <Home className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Button>
      </Link>
    </div>
  );
}
