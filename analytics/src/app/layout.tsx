import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import '@/components/table/table.css';

// Self-hosted (no Google Fonts). Plus Jakarta Sans is a variable font covering
// the 200–800 weight range; it drives both the heading and body type. The
// --font-grotesk / --font-instrument / --font-mono CSS vars used across the app
// are mapped in globals.css.
const jakarta = localFont({
  src: './fonts/PlusJakartaSans.woff2',
  variable: '--font-jakarta',
  weight: '200 800',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Analytics — Visión consolidada del negocio',
  description: 'Dashboard de análisis consolidado de las webapps del sistema',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es" className={`${jakarta.variable} h-full`} data-theme="dark">
        <body
          style={{ fontFamily: 'var(--font-jakarta), sans-serif', background: 'var(--bg)', color: 'var(--text)', margin: 0, padding: 0, height: '100%' }}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
