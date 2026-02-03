import type { Metadata } from 'next';
import { Analytics } from "@vercel/analytics/next"
import './globals.css';

export const metadata: Metadata = {
  title: 'SOP Scanner | Master the Trench',
  description: 'Automated 7-point security validation for Solana meme coins. Stop getting rugged.',
  keywords: ['solana', 'meme coin', 'trading', 'crypto', 'alerts', 'security', 'scanner'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
      </head>
      <body className="antialiased">
       <Analytics/>
        {children}
      </body>
    </html>
  );
}