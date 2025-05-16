import HeroSection from '@/app/(home)/components/HeroSection';
import FeaturesSection from '@/app/(home)/components/FeaturesSection';
import WorkbenchSection from '@/app/(home)/components/WorkbenchSection';
import GetStartedSection from '@/app/(home)/components/GetStartedSection';
import SignupSection from '@/app/(home)/components/SignupSection';
import CardSection from '@/app/(home)/components/CardSection';

export default function HomePage() {

  return (
    <div className="bg-linear-to-b from-[#0E002D] to-[#2F0093]">
      <HeroSection/>
      <FeaturesSection/>
      <WorkbenchSection/>
      <SignupSection/>
      <CardSection/>
      <GetStartedSection/>
    </div>
  );
}

export const metadata = {
  title: {
    template: '%s | motia',
    default: 'Motia - AI Agent Framework for Software Engineering Teams',
  },
  description:
    'Write in any language. Automate anything. From AI agents to backend automation, motia runs event-driven workflows with zero overhead.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Motia - AI Agent Framework for Software Engineering Teams',
    description:
      'Write in any language. Automate anything. From AI agents to backend automation, motia runs event-driven workflows with zero overhead.',
    url: 'https://motia.dev',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Motia - AI Agent Framework for Software Engineering Teams',
    description:
      'Write in any language. Automate anything. From AI agents to backend automation, motia runs event-driven workflows with zero overhead.',
  },
};