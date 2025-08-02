import type { Notification, NotificationType } from '@/data/schemas';

/**
 * Pi Network Native Notification Service
 * 
 * This service uses the Pi Network SDK's native notification system
 * to ensure notifications appear in Pi Browser and other Pi Network apps.
 */

interface PiNotificationOptions {
  title: string;
  description: string;
  link?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

/**
 * Send a native Pi Network notification
 * Note: Pi.notify method doesn't exist in the official SDK
 * Using console logging as fallback
 */
export async function sendPiNotification(options: PiNotificationOptions): Promise<void> {
  try {
    // Check if Pi SDK is available
    if (typeof window === 'undefined' || !(window as any).Pi) {
      console.log('⚠️ Pi SDK not available, using console log');
      console.log('📢 Notification:', options);
      return;
    }

    // Pi.notify method doesn't exist in the official SDK
    // Using console logging as the primary method
    console.log('📢 Pi Network Notification:', {
      title: options.title,
      description: options.description,
      link: options.link || window.location.href,
      type: options.type || 'info'
    });

    console.log('✅ Notification logged successfully');
  } catch (error) {
    console.error('❌ Failed to log notification:', error);
    
    // Fallback to console log
    console.log('📢 Notification (fallback):', options);
  }
}

/**
 * Send notification for payment events
 */
export async function notifyPaymentEvent(
  event: 'sent' | 'received' | 'cancelled' | 'failed',
  amount: number,
  recipient?: string,
  sender?: string
): Promise<void> {
  let title: string;
  let description: string;
  let type: 'success' | 'error' | 'info' | 'warning' = 'info';

  switch (event) {
    case 'sent':
      title = 'Payment Sent';
      description = `Successfully sent ${amount}π to ${recipient || 'recipient'}`;
      type = 'success';
      break;
    case 'received':
      title = 'Payment Received';
      description = `Received ${amount}π from ${sender || 'sender'}`;
      type = 'success';
      break;
    case 'cancelled':
      title = 'Payment Cancelled';
      description = `Payment of ${amount}π has been cancelled`;
      type = 'warning';
      break;
    case 'failed':
      title = 'Payment Failed';
      description = `Failed to send ${amount}π to ${recipient || 'recipient'}`;
      type = 'error';
      break;
  }

  await sendPiNotification({
    title,
    description,
    link: '/dashboard/transactions',
    type
  });
}

/**
 * Send notification for mining rewards
 */
export async function notifyMiningReward(amount: number): Promise<void> {
  await sendPiNotification({
    title: 'Mining Reward Earned! 🎉',
    description: `You earned ${amount}π from mining. Keep up the great work!`,
    link: '/dashboard?tab=portfolio',
    type: 'success'
  });
}

/**
 * Send notification for node updates
 */
export async function notifyNodeUpdate(currentVersion: string, latestVersion: string): Promise<void> {
  await sendPiNotification({
    title: 'Node Update Available',
    description: `Your node is running v${currentVersion}, but v${latestVersion} is available.`,
    link: '/dashboard?tab=node',
    type: 'info'
  });
}

/**
 * Send notification for team events
 */
export async function notifyTeamEvent(
  event: 'member_joined' | 'member_kyc_verified' | 'leader_message',
  memberName?: string,
  message?: string
): Promise<void> {
  let title: string;
  let description: string;

  switch (event) {
    case 'member_joined':
      title = 'New Team Member';
      description = `${memberName || 'A new member'} has joined your team!`;
      break;
    case 'member_kyc_verified':
      title = 'Team Member KYC Verified';
      description = `${memberName || 'A team member'} has completed KYC verification.`;
      break;
    case 'leader_message':
      title = 'Message from Team Leader';
      description = message || 'You have a new message from your team leader.';
      break;
  }

  await sendPiNotification({
    title,
    description,
    link: '/dashboard/team',
    type: 'info'
  });
}

/**
 * Send notification for achievement milestones
 */
export async function notifyAchievement(badgeName: string, description?: string): Promise<void> {
  await sendPiNotification({
    title: `Achievement Unlocked! 🏆`,
    description: description || `Congratulations! You've earned the "${badgeName}" badge.`,
    link: '/dashboard?tab=achievements',
    type: 'success'
  });
}

/**
 * Send notification for ad rewards
 */
export async function notifyAdReward(amount: number): Promise<void> {
  await sendPiNotification({
    title: 'Ad Reward Earned! 🎬',
    description: `You earned ${amount}π for watching an ad. Keep watching to earn more!`,
    link: '/dashboard?tab=achievements',
    type: 'success'
  });
}

/**
 * Send notification for app sharing
 */
export async function notifyAppShared(): Promise<void> {
  await sendPiNotification({
    title: 'App Shared Successfully',
    description: 'Thanks for sharing Dynamic Wallet View with your friends!',
    type: 'success'
  });
}

/**
 * Send notification for errors
 */
export async function notifyError(title: string, description: string): Promise<void> {
  await sendPiNotification({
    title,
    description,
    type: 'error'
  });
}

/**
 * Send notification for warnings
 */
export async function notifyWarning(title: string, description: string): Promise<void> {
  await sendPiNotification({
    title,
    description,
    type: 'warning'
  });
}

/**
 * Send notification for general info
 */
export async function notifyInfo(title: string, description: string, link?: string): Promise<void> {
  await sendPiNotification({
    title,
    description,
    link,
    type: 'info'
  });
} 