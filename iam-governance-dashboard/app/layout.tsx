import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});
export const metadata: Metadata = {
  title: 'IAM Governance Dashboard',
  description: 'Interactive dashboard for IAM Governance team',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" className="light" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light" />
      </head>
      <body className={`${inter.className} light-mode`} suppressHydrationWarning>
        <Providers fontFamily={inter.style.fontFamily}>
          {children}
        </Providers>
      </body>
    </html>
  );
} 