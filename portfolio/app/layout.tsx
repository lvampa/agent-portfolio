import './globals.css';

import { HistoryProvider } from '@terminal/history/HistoryContext';
import { EventBusProvider } from '@terminal/repl/EventBusContext';
import { SessionProvider } from '@terminal/SessionContext';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import React from 'react';

const dosFont = localFont({
  src: '../public/fonts/PerfectDOSVGA437.ttf',
  variable: '--font-dos',
  display: 'swap',
  fallback: ['monospace'],
});

export const metadata: Metadata = {
  title: 'Command Prompt - Connor Abdelnoor',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dosFont.variable} bg-background font-sans antialiased`}>
        <EventBusProvider>
          <HistoryProvider>
            <SessionProvider>{children}</SessionProvider>
          </HistoryProvider>
        </EventBusProvider>
      </body>
    </html>
  );
}
