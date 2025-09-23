import { redirect } from 'next/navigation';

export default function Page() {
  // page is left empty, redirect to home if [handle] isn't provided
  redirect('/home');
}
