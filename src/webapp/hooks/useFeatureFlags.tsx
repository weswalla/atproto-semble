import { useAuth } from './useAuth';

const APPROVED_HANDLES = ['wesleyfinck.org', 'ronentk.me', 'pouriade.com'];

export const useFeatureFlags = () => {
  const { user } = useAuth();

  const isApprovedUser = user?.handle && APPROVED_HANDLES.includes(user.handle);

  return {
    similarCards: isApprovedUser || process.env.VERCEL_ENV !== 'production',
  };
};
