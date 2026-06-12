import './globals.css';

import { EventBusProvider } from '@app/contexts/EventBusContext';
import { HistoryProvider } from '@app/contexts/HistoryContext';
import localFont from 'next/font/local';
import React from 'react';

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
      <body className={`${dosFont.variable} bg-background font-sans antialiased`}>
        <EventBusProvider>
          <HistoryProvider>{children}</HistoryProvider>
        </EventBusProvider>
      </body>
    </html>
  );
}
