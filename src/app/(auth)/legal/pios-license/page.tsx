"use client";

import LegalPageLayout from '@/components/layout/LegalPageLayout';
import { useTranslation } from '@/hooks/useTranslation';

const licenseContent = "The Pi Open Source (PiOS) License allows Pi Community Developers to create Pi Apps and tools for the Pi Ecosystem. Developers are free to use the license to build on top of others' work, and to get their creations used and built upon by others within the Pi Ecosystem.\n\nThe PiOS license grants unrestricted use of the software only within the Pi Ecosystem. Selling the software, or any software that incorporates PiOS-licensed software or its derivatives, for fiat currency is prohibited. Selling for Pi cryptocurrency is permitted. The license also explicitly prohibits use of the software to create any product that might be deemed to compete with Pi Network. \n\nRead the full license [here](https://github.com/pi-apps/PiOS/blob/main/LICENSE.md).";

export default function PiosLicensePage() {
  const { t } = useTranslation();

  const piosLicenseSections = [
    {
      title: t('legal.piosLicenseTitle'),
      content: licenseContent,
      displayMode: 'markdown',
    },
  ];

  return (
    <div className="relative flex min-h-screen flex-col items-center p-2 sm:p-4 py-4 sm:py-6 md:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_200px_at_0%_-10%,hsl(var(--primary)/0.08),transparent),radial-gradient(900px_200px_at_100%_110%,hsl(var(--accent)/0.07),transparent)]" />
      <div className="relative z-10 w-full max-w-3xl">
        <LegalPageLayout
          pageTitle={t('legal.piosLicenseTitle')}
          sections={piosLicenseSections}
          displayMode="markdown"
        />
      </div>
    </div>
  );
}
