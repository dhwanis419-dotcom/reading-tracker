import type { Metadata } from 'next';
import { Fraunces, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import Nav from '@/components/Nav';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600'],
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  weight: ['400', '500', '600'],
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'The Ledger — Reading Tracker',
  description: 'A personal reading archive and diary.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${sourceSerif.variable} ${plexMono.variable}`}>
      <body className="font-body min-h-screen">
        <Nav />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
