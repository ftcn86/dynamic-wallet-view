
import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Inter } from 'next/font/google';
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ViewportProvider } from "@/contexts/ViewportContext";
import { Toaster } from "@/components/ui/toaster";
import PiSDKInitializer from "@/components/PiSDKInitializer";

export const metadata: Metadata = {
  title: "Dynamic Wallet View",
  description: "A comprehensive dashboard for Pi Network users",
};
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Pi Network SDK - Load from CDN */}
        <script 
          src="https://sdk.minepi.com/pi-sdk.js" 
          async 
        />
      </head>
      <body
        className={`${inter.variable} ${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ViewportProvider>
              <PiSDKInitializer />
              {children}
              <Toaster />
            </ViewportProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
