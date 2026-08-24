import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CosmicTantra — Technology-Assisted Jyotish Operations',
  description: 'Vedic Jyotish calculation engine, practitioner onboarding, and consultation operations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#030108] text-[#E2D9F3] antialiased">
        {children}
      </body>
    </html>
  );
}
