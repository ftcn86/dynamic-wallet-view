
"use client";

import LegalPageLayout from '@/components/layout/LegalPageLayout';

const helpContent = `
# Help & Support

## Getting Started

### 1. Pi Network Authentication
- You need a Pi Network account to use this application
- Click "Login with Pi Network" to authenticate
- Grant permissions for username, payments, and wallet address access
- You only need to authenticate once per session

### 2. Dashboard Overview
The dashboard provides a comprehensive view of your Pi Network activity:
- **Balance Breakdown:** View your total, transferable, and unverified Pi
- **Mining Focus:** Track your current mining rate and session status
- **Team Activity:** Monitor your security circle and referral team
- **Badges:** View your earned Pi Network badges and achievements

## Key Features

### Rewarded Ads
- Watch advertisements to earn Pi cryptocurrency
- Rewards are sent directly to your Pi Network wallet
- Rewards are available when ads are ready to watch
- Click "Watch Ad" to start earning

### Donations
- Support the application development by donating Pi
- Navigate to the Donate page to contribute
- All donations are processed through official Pi Network infrastructure
- Transaction fees may apply

### AI Analysis & Forecasting
- Get AI-powered insights about your Pi Network data
- View predictions about Pi value trends
- Analyze your mining performance
- **Note:** AI predictions are estimates and not financial advice

### Team Management
- View your security circle members
- Track team activity and contributions
- Monitor referral team performance
- Manage team communications

## Troubleshooting

### Authentication Issues
- **"Authentication failed"**: Try refreshing the page and logging in again
- **"Wallet address not available"**: Ensure you've granted wallet address permissions
- **"Payment permissions required"**: Grant payment permissions during authentication

### Mobile Display Issues
- **Desktop view on mobile**: The app should automatically detect mobile devices
- **Sidebar not visible**: Use the hamburger menu (☰) to access navigation
- **Text too small**: The app uses responsive design that adapts to screen size

### Payment Issues
- **"Payment failed"**: Check your Pi Network connection and try again
- **"Transaction pending"**: Pi Network transactions may take time to process
- **"Rewards unavailable"**: Try again later when ads are available

### Data Loading Issues
- **"Loading..." persists**: Check your internet connection
- **"Error fetching data"**: Try refreshing the page
- **"Balance not updating"**: Pi Network data may have delays

## Privacy & Security

### Data Collection
- We only collect data necessary for app functionality
- Pi Network authentication data is handled securely
- We do not store your private keys or sensitive information
- You can request data deletion at any time

### Security Best Practices
- Never share your Pi Network private keys
- Use a strong password for your Pi Network account
- Enable two-factor authentication if available
- Log out when using shared devices

## Contact & Support

### Getting Help
- Check this help page for common issues
- Review the Terms of Service for detailed information
- Contact us through the app's support channels

### Feature Requests
- We welcome feedback and feature suggestions
- Use the AI feedback card on the dashboard
- Report bugs through the support channels

### Updates
- The app is regularly updated with new features
- Check for updates in your app store
- Follow our announcements for new features

---

*For technical support, please contact us through the application's support channels.*
`;

export default function HelpPage() {
  return (
    <LegalPageLayout
      pageTitle="Help & Support"
      content={helpContent}
      displayMode="markdown"
    />
  );
}
