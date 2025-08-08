
"use client";

import LegalPageLayout from '@/components/layout/LegalPageLayout';
import { useTranslation } from '@/hooks/useTranslation';

export default function PrivacyPage() {
  const { t, getLegalSections } = useTranslation();
  const privacySections = getLegalSections('legal.privacySections');

  return (
    <div className="relative flex min-h-screen flex-col items-center p-2 sm:p-4 py-4 sm:py-6 md:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_200px_at_0%_-10%,hsl(var(--primary)/0.08),transparent),radial-gradient(900px_200px_at_100%_110%,hsl(var(--accent)/0.07),transparent)]" />
      <div className="relative z-10 w-full max-w-3xl">
        <LegalPageLayout
          pageTitle={t('legal.privacyTitle')}
          sections={privacySections}
          displayMode="accordion"
        />
      </div>
    </div>
  );
}
