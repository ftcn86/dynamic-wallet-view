
"use client";

import LegalPageLayout from '@/components/layout/LegalPageLayout';
import { useTranslation } from '@/hooks/useTranslation';

export default function PrivacyPage() {
  const { t, getLegalSections } = useTranslation();
  const privacySections = getLegalSections('legal.privacySections');

  return (
    <LegalPageLayout
      pageTitle={t('legal.privacyTitle')}
      sections={privacySections}
      displayMode="accordion"
    />
  );
}
