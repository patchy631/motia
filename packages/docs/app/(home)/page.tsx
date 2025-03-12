'use client';

import HeroSection from '@/app/(home)/components/HeroSection';
import FeaturesSection from '@/app/(home)/components/FeaturesSection';
import WorkbenchSection from '@/app/(home)/components/WorkbenchSection';
import GetStartedSection from '@/app/(home)/components/GetStartedSection';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

export default function HomePage() {
  const { copied, copyToClipboard } = useCopyToClipboard("npx motia create -t default -n new-project");

  return (
    <div className="bg-gradient-to-b from-[#0E002D] to-[#2F0093]">
      <HeroSection copied={copied} onCopy={copyToClipboard} />
      <FeaturesSection />
      <WorkbenchSection />
      <GetStartedSection copied={copied} onCopy={copyToClipboard} />
    </div>
  );
}