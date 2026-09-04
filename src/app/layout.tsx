import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Physics Quiz Application - PWA Assessment Portal',
  description: 'Online examination portal for Physics Quiz - Unit 1 and Unit 2. Interactive questions with secure evaluation.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Physics Quiz',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-icon.png" />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white min-h-screen">
        {children}

        {/* Service Worker Registration (Production Only) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(
                      function(registration) {
                        console.log('PWA ServiceWorker registered with scope: ', registration.scope);
                      },
                      function(err) {
                        console.log('PWA ServiceWorker registration failed: ', err);
                      }
                    );
                  });
                } else {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (let registration of registrations) {
                      registration.unregister();
                    }
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
