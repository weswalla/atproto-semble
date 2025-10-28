'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Dashboard from '@/components/navigation/dashboard/Dashboard';

interface Props {
  children: React.ReactNode;
}
export default function Layout(props: Props) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (!isAuthenticated) {
    return null; // Redirecting
  }

  return <Dashboard>{props.children}</Dashboard>;
}
