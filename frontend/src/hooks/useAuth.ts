import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth as useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';

export function useAuth(requiredRoles?: UserRole[]) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const requiredRolesKey = requiredRoles?.join('|') ?? '';

  useEffect(() => {
    if (loading) return;
    const roles = requiredRolesKey ? requiredRolesKey.split('|') as UserRole[] : undefined;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace('/dashboard');
    }
  }, [user, loading, router, requiredRolesKey]);

  return { user, loading, isAuthenticated: !!user };
}

export { useAuth as default };
