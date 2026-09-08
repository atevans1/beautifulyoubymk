import { redirect } from 'next/navigation';

export default function Page() {
  // Preserve the reviewed public HTML while the Next.js application layer is introduced.
  redirect('/index.html');
}
