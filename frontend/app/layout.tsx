import type { Metadata } from 'next';
import './globals.css';
import AuthGuard from '@/components/AuthGuard';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Eagle Box Cricket - AI Booking Assistant | Vijayawada',
  description: 'Book your cricket, football, or badminton slot instantly with our AI-powered booking assistant. Eagle Box Cricket - Vijayawada\'s premier sports venue. Open 6 AM - 11 PM daily.',
  keywords: 'box cricket Vijayawada, sports venue booking, cricket ground Vijayawada, Eagle Box Cricket, football turf Vijayawada',
  openGraph: {
    title: 'Eagle Box Cricket - AI Booking Assistant',
    description: 'Vijayawada\'s Premier Sports Venue. Book slots, check availability, and get instant answers 24/7.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <AuthProvider>
          <AuthGuard>{children}</AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
