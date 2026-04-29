import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, loading, profileLoading, isAdmin } = useAuth();

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-cream/50 text-sm tracking-widest uppercase">Loading…</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
