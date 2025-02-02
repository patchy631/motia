import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | motia',
    default: 'motia - code-first framework for intelligent workflows',
  },
  description: 'Write in any language. Automate anything. From AI agents to backend automation, motia runs event-driven workflows with zero overhead.',
  metadataBase: new URL('https://motia.dev'),

  // Standard OpenGraph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://motia.dev',
    siteName: 'motia',
    title: 'motia - code-first framework for intelligent workflows',
    description: 'Write in any language. Automate anything. From AI agents to backend automation, motia runs event-driven workflows with zero overhead.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'motia - code-first framework for intelligent workflows',
      }
    ],
  },

  // Twitter/X
  twitter: {
    card: 'summary_large_image',
    site: '@motiadev',
    creator: '@motiadev',
    title: 'motia - code-first framework for intelligent workflows',
    description: 'Write in any language. Automate anything. From AI agents to backend automation, motia runs event-driven workflows with zero overhead.',
    images: ['/og-image.png'],
  },

  // Icons and PWA
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#18181b',
      },
    ],
  },

  // Additional metadata
  other: {
    // Twitter alt text
    'twitter:image:alt': 'motia - code-first framework for intelligent workflows',

    // Instagram
    'instagram:card': 'summary_large_image',
    'instagram:title': 'motia - code-first framework for intelligent workflows',
    'instagram:description': 'Write in any language. Automate anything. From AI agents to backend automation, motia runs event-driven workflows with zero overhead.',
    'instagram:image': 'https://motia.dev/og-image.png',

    // Reddit
    'reddit:title': 'motia - code-first framework for intelligent workflows',
    'reddit:description': 'Write in any language. Automate anything. From AI agents to backend automation, motia runs event-driven workflows with zero overhead.',
    'reddit:image': 'https://motia.dev/og-image.png',

    // LinkedIn
    'linkedin:card': 'summary_large_image',
    'linkedin:title': 'motia - code-first framework for intelligent workflows',
    'linkedin:description': 'Write in any language. Automate anything. From AI agents to backend automation, motia runs event-driven workflows with zero overhead.',
    'linkedin:image': 'https://motia.dev/og-image.png',

    // Slack
    'slack-app-id': 'YOUR_SLACK_APP_ID', // If you have a Slack app

    // PWA related
    'theme-color': '#18181b',
    'application-name': 'motia',
    'apple-mobile-web-app-title': 'motia',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#18181b',
    'msapplication-config': '/browserconfig.xml',
    'format-detection': 'telephone=no',

    // Search Engine
    'google-site-verification': 'YOUR_GOOGLE_VERIFICATION', // If you have Google Search Console
    'yandex-verification': 'YOUR_YANDEX_VERIFICATION', // If you target Yandex
    'bing-verification': 'YOUR_BING_VERIFICATION', // If you target Bing

    // Canonical URL (important for SEO)
    'canonical': 'https://motia.dev',
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification for webmaster tools
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION',
  },
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col h-full min-h-dvh w-dvw landscape:min-h-screen landscape:h-full landscape:w-full p-0 m-0 gap-0" suppressHydrationWarning>
        <RootProvider>
          {children}
          <Analytics />
        </RootProvider>
      </body>
    </html>
  );
}