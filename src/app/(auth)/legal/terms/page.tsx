
"use client";

import LegalPageLayout from '@/components/layout/LegalPageLayout';

const termsContent = `
# Terms of Service

## 1. Acceptance of Terms
By accessing and using this Pi Network application, you accept and agree to be bound by the terms and provision of this agreement.

## 2. Pi Network Integration
This application integrates with the Pi Network blockchain and requires Pi Network authentication to access features.

- You must have a valid Pi Network account to use this application
- Authentication requires permissions for username, payments, and wallet address access
- All Pi Network transactions are subject to Pi Network's own terms and conditions
- We do not store your Pi Network private keys or sensitive authentication data

## 3. Payment and Rewarded Ads Features
This application includes features that may involve Pi cryptocurrency transactions.

- **Rewarded Ads:** You may earn Pi by watching advertisements. Rewards are subject to app balance availability
- **Donations:** You can donate Pi to support the application development
- **App-to-User Payments:** The app may send Pi to users for various activities
- **Payment Processing:** All payments are processed through official Pi Network infrastructure
- **Transaction Fees:** Pi Network transaction fees may apply to all transactions

## 4. AI and Analytics Features
This application includes AI-powered features for analysis and forecasting.

- **AI Analysis:** Machine learning algorithms analyze your Pi Network data
- **Forecasting:** Predictions about Pi value and mining rates are estimates only
- **Data Usage:** Your data is used to provide personalized insights
- **Accuracy:** AI predictions are not financial advice and may be inaccurate

## 5. User Responsibilities
- You are responsible for maintaining the security of your Pi Network account
- You must not use the application for any illegal or unauthorized purpose
- You must not attempt to gain unauthorized access to any part of the application
- You are responsible for all activities that occur under your account
- You must comply with all applicable laws and regulations

## 6. Privacy and Data
Your privacy is important to us. Please review our Privacy Policy for details about data collection and usage.

- We collect only necessary data for application functionality
- Pi Network authentication data is handled securely
- We do not sell or share your personal information with third parties
- You can request deletion of your data at any time

## 7. Disclaimers
- The application is provided "as is" without warranties of any kind
- We are not responsible for any losses related to Pi Network transactions
- AI predictions and forecasts are not financial advice
- Pi Network availability and functionality are outside our control

## 8. Limitation of Liability
In no event shall we be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.

## 9. Changes to Terms
We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the application constitutes acceptance of the modified terms.

## 10. Contact Information
If you have any questions about these Terms of Service, please contact us through the application's support channels.

---

*Last updated: ${new Date().toLocaleDateString()}*
`;

export default function TermsPage() {
  return (
    <LegalPageLayout
      pageTitle="Terms of Service"
      content={termsContent}
      displayMode="markdown"
    />
  );
}
