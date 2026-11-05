import './globals.css';

import { HistoryProvider } from '@terminal/history/HistoryContext';
import { EventBusProvider } from '@terminal/repl/EventBusContext';
import { SessionProvider } from '@terminal/SessionContext';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import React from 'react';

import {
  PERSON_JSON_LD,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  STATIC_PORTFOLIO_URL,
} from './constants';

const dosFont = localFont({
  src: '../public/fonts/PerfectDOSVGA437.ttf',
  variable: '--font-dos',
  display: 'swap',
  fallback: ['monospace'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'profile',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: '/',
    siteName: SITE_NAME,
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dosFont.variable} bg-background font-sans antialiased`}>
        <script
          type="application/ld+json"
          // JSON.stringify of our own constant, so there is no untrusted input to escape.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_JSON_LD) }}
        />
        <noscript>
          <p className="text-terminal m-8">
            An agent that describes Connor Abdelnoor, in a 90s command prompt. For the static
            portfolio, see{' '}
            <a href={STATIC_PORTFOLIO_URL} className="underline">
              connorabdelnoor.github.io
            </a>
            .
          </p>
        </noscript>
        <EventBusProvider>
          <HistoryProvider>
            <SessionProvider>{children}</SessionProvider>
          </HistoryProvider>
        </EventBusProvider>
      </body>
    </html>
  );
}
