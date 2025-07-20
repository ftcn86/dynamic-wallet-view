
"use client";

import LegalPageLayout from '@/components/layout/LegalPageLayout';
import { useTranslation } from '@/hooks/useTranslation';

export default function TermsPage() {
  const { t, getLegalSections } = useTranslation();
  const termsSections = getLegalSections('legal.termsSections');

  return (
    <LegalPageLayout
      pageTitle={t('legal.termsTitle')}
      sections={termsSections}
      displayMode="accordion"
    />
  );
}
