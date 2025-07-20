
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/theme-provider';
import { PiSDKInitializer } from '@/components/PiSDKInitializer';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Dynamic Wallet View',
  description: 'A comprehensive dashboard for Pi Network users.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Pi Network SDK Scripts */}
        <script src="https://sdk.minepi.com/pi-sdk.js" async></script>
      </head>
      <body className={cn("font-sans antialiased", GeistSans.variable, GeistMono.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <PiSDKInitializer />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
