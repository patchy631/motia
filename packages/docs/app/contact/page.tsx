import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/app/layout.config';
import { PAGE_CONTENT } from './constants';
import type { Metadata } from 'next'

// Components
import { PageHeader } from './components/PageHeader';
import { ContactContainer } from './components/ContactContainer';
import { ContactMethods } from './components/ContactMethods';
import { Footer } from './components/Footer';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <HomeLayout 
        {...baseOptions} 
        className="flex-1 pb-4 lg:pt-32 sm:pt-20 bg-linear-to-b from-[#0E002D] to-[#2F0093]"
      >
          <div className="container mx-auto px-4 py-16 max-w-5xl">
            <PageHeader 
              title={PAGE_CONTENT.TITLE}
              description={PAGE_CONTENT.DESCRIPTION}
            />

            <ContactContainer />

            <ContactMethods />
          </div>

          <Footer />
      </HomeLayout>
    </div>
  );
}

export const metadata: Metadata = {
  title: {
    template: '%s | motia',
    default: 'Contact Motia – Get in Touch with Our Team',
  },
  description:
    "Have questions about Motia's AI Agent Framework? Reach out through our contact form or join our community – we're here to help.",
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact Motia – Get in Touch with Our Team',
    description:
      "Have questions about Motia's AI Agent Framework? Reach out through our contact form or join our community – we're here to help.",
    url: 'https://motia.dev/contact',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Motia – Get in Touch with Our Team',
    description:
      "Have questions about Motia's AI Agent Framework? Reach out through our contact form or join our community – we're here to help.",
  },
} 