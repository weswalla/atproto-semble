import Dashboard from '@/components/navigation/dashboard/Dashboard';

interface Props {
  children: React.ReactNode;
}
export default function Layout(props: Props) {
  return <Dashboard>{props.children}</Dashboard>;
}
