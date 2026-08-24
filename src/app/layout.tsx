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
    <html lang="en" className="dark">
      <body className="bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] antialiased transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
