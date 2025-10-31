'use client';

import AppLayout from '../appLayout/AppLayout';
import GuestAppLayout from '../guestAppLayout/GuestAppLayout';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  children: React.ReactNode;
}

export default function Dashboard(props: Props) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated)
    return <GuestAppLayout>{props.children}</GuestAppLayout>;

  return <AppLayout>{props.children}</AppLayout>;
}
