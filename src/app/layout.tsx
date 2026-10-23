import type { Metadata } from 'next';
import { Inter, Newsreader, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import '@/styles/fonts.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://parity.devprashant.com'),
  title: 'Parity — Make your documents agree before you submit',
  description: 'Evidence-first application packet verification that catches subtle clerical data mismatches before submission.',

  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Parity — Evidence-First Application Packet Verification',
    description:
      'Catch subtle data mismatches across scholarship and college application documents with deterministic verification and inspectable cited evidence.',
    url: 'https://parity.devprashant.com',
    siteName: 'Parity',
    images: [
      {
        url: '/samples/clean_form.png',
        width: 1200,
        height: 630,
        alt: 'Parity Application Verification Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parity — Evidence-First Application Packet Verification',
    description:
      'Catch subtle data mismatches across scholarship and college application documents with deterministic verification and inspectable cited evidence.',
    images: ['/samples/clean_form.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#F8FAFC] dark:bg-[#080A0F] text-[#0F172A] dark:text-[#F8FAFC] antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-white text-xs font-bold transition-all"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}

