import AppLayout from '../appLayout/AppLayout';

interface Props {
  children: React.ReactNode;
}

export default function Dashboard(props: Props) {
  return <AppLayout>{props.children}</AppLayout>;
}
