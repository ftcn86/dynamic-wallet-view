
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/login');
  // The redirect function throws an error to stop rendering,
  // so nothing further is executed and no explicit return is typically needed.
}
