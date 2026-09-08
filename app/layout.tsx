import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Beautiful You By M.K.',
  description: 'Safety, dignity and new beginnings.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
