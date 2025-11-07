
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'institution')[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar imediatamente se user for null, mesmo durante loading
    // Isso garante redirecionamento rápido após logout
    if (!user) {
      if (import.meta.env.DEV) {
        console.log("[PROTECTED_ROUTE]", "User is null, redirecting to login", {
          loading,
          hasProfile: !!profile,
          currentPath: window.location.pathname,
          timestamp: new Date().toISOString()
        });
      }
      navigate('/login', { replace: true });
      return;
    }

    if (!loading) {
      if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        if (import.meta.env.DEV) {
          console.log("[PROTECTED_ROUTE]", "User role not allowed, redirecting to home", {
            userRole: profile.role,
            allowedRoles,
            timestamp: new Date().toISOString()
          });
        }
        navigate('/', { replace: true });
        return;
      }
    }
  }, [user, profile, loading, navigate, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
