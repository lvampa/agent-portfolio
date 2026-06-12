import localFont from 'next/font/local';
import React from 'react';

import { EventBusProvider } from '@app/contexts/EventBusContext';
import { HistoryProvider } from '@app/contexts/HistoryContext';

import './globals.css';

const dosFont = localFont({
  src: '../public/fonts/PerfectDOSVGA437.ttf',
  variable: '--font-dos',
  display: 'swap',
  fallback: ['sans-serif'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dosFont.variable} font-sans antialiased bg-background`}>
        <EventBusProvider>
          <HistoryProvider>{children}</HistoryProvider>
        </EventBusProvider>
      </body>
    </html>
  );
}
