
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'institution')[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, profile, session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // CRITICAL: Wait for loading to complete before making any decisions
    // During refresh (F5), loading will be true while getSession() is checking
    // We must not redirect during this time
    if (loading) {
      if (import.meta.env.DEV) {
        console.log("[PROTECTED_ROUTE]", "Still loading, waiting...", {
          hasUser: !!user,
          hasSession: !!session,
          hasProfile: !!profile,
          currentPath: window.location.pathname,
          timestamp: new Date().toISOString()
        });
      }
      return;
    }

    // After loading is complete, check authentication
    if (!user || !session) {
      if (import.meta.env.DEV) {
        console.log("[PROTECTED_ROUTE]", "No user or session after loading, redirecting to login", {
          hasUser: !!user,
          hasSession: !!session,
          hasProfile: !!profile,
          currentPath: window.location.pathname,
          timestamp: new Date().toISOString()
        });
      }
      navigate('/login', { replace: true });
      return;
    }

    // Check role permissions if specified
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

    if (import.meta.env.DEV) {
      console.log("[PROTECTED_ROUTE]", "Access granted", {
        hasUser: !!user,
        hasSession: !!session,
        hasProfile: !!profile,
        userRole: profile?.role,
        allowedRoles,
        currentPath: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    }
  }, [user, profile, session, loading, navigate, allowedRoles]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // After loading, check if user is authenticated
  if (!user || !session) {
    return null;
  }

  // If allowedRoles is specified, we need profile to check permissions
  // Show loading if profile is still null (might be loading asynchronously)
  if (allowedRoles && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check role permissions
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
