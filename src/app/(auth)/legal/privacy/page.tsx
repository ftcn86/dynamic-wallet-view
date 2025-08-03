
"use client";

import LegalPageLayout from '@/components/layout/LegalPageLayout';
import { useTranslation } from '@/hooks/useTranslation';

export default function PrivacyPage() {
  const { t, getLegalSections } = useTranslation();
  const privacySections = getLegalSections('legal.privacySections');

  return (
    <div className="flex min-h-screen flex-col items-center bg-background p-2 sm:p-4 py-4 sm:py-6 md:py-8">
        <div className="w-full max-w-2xl">
            <LegalPageLayout
              pageTitle={t('legal.privacyTitle')}
              sections={privacySections}
              displayMode="accordion"
            />
        </div>
    </div>
  );
}
