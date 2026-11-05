import './globals.css';

import { HistoryProvider } from '@terminal/history/HistoryContext';
import { EventBusProvider } from '@terminal/repl/EventBusContext';
import { SessionProvider } from '@terminal/SessionContext';
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import React from 'react';

import {
  EXAMPLE_QUESTIONS,
  PERSON_JSON_LD,
  SHARE_TITLE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  STATIC_PORTFOLIO_URL,
} from './constants';

const dosFont = localFont({
  src: './fonts/PerfectDOSVGA437.woff2',
  variable: '--font-dos',
  display: 'swap',
  fallback: ['monospace'],
  // A metric-matched fallback would be a proportional font, so the swap goes straight to monospace.
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'profile',
    title: SHARE_TITLE,
    description: SITE_DESCRIPTION,
    url: '/',
    siteName: SITE_NAME,
  },
  twitter: { card: 'summary_large_image', title: SHARE_TITLE, description: SITE_DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: '#212121',
  colorScheme: 'dark',
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
          <div className="text-terminal m-8">
            <p>
              Connor&apos;s AI Agent answers questions about Connor Abdelnoor, a software engineer
              who builds enterprise software from user interfaces to infrastructure. It runs in a
              90s command prompt and needs JavaScript. Without it, see the static portfolio at{' '}
              <a href={STATIC_PORTFOLIO_URL} className="underline">
                connorabdelnoor.github.io
              </a>
              .
            </p>
            <p className="mt-4">Example questions:</p>
            <ul>
              {EXAMPLE_QUESTIONS.map((question) => (
                <li key={question}>- {question}</li>
              ))}
            </ul>
          </div>
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
