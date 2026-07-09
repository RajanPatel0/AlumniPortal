import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axios-client';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  campus?: { id: string; name: string } | null;
  modules?: string[];
}

export function useAdminAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading: loading, refetch } = useQuery<AdminUser | null>({
    queryKey: ['admin-user'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/api/admin/me');
        return res.data.user;
      } catch {
        return null;
      }
    },
    staleTime: 15 * 60 * 1000, // cache for 15 minutes
  });

  const logout = async () => {
    try {
      await axiosClient.post('/api/admin/logout');
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      queryClient.setQueryData(['admin-user'], null);
      window.location.href = '/admin/auth/login';
    }
  };

  return { user: user || null, loading, logout, refetch };
}