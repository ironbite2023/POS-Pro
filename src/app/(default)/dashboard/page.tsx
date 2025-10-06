import { redirect } from 'next/navigation';

export default function DashboardRedirect() {
  redirect('/dashboard/hq-dashboard');
}
