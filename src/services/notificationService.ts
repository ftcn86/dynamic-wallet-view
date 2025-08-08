import { Notification, NotificationType } from '@/data/schemas';
import { sendPiNotification } from './piNotificationService';

// In-memory storage for notifications (in production, this would be a database)
let notifications: Notification[] = [];

/**
 * Add a new notification
 * Now uses Pi Network's native notification system for Pi Browser compatibility
 */
export async function addNotification(
  type: NotificationType,
  title: string,
  description: string,
  link?: string
): Promise<void> {
  const notification: Notification = {
    id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    description,
    date: new Date().toISOString(),
    read: false,
    link,
  };

  notifications.unshift(notification); // Add to beginning
  console.log('📢 New notification added:', notification);

  // Send native Pi Network notification for Pi Browser compatibility
  try {
    await sendPiNotification({
      title,
      description,
      link,
      type: type === 'badge_earned' ? 'success' : 
            type === 'node_update' ? 'warning' : 
            type === 'announcement' ? 'info' : 'info'
    });
  } catch (error) {
    console.error('❌ Failed to send Pi Network notification:', error);
  }
}

/**
 * Get all notifications
 */
export function getNotifications(): Notification[] {
  return [...notifications];
}

/**
 * Mark notification as read
 */
export function markNotificationAsRead(notificationId: string): void {
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    console.log('✅ Notification marked as read:', notificationId);
  }
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead(): void {
  notifications.forEach(n => n.read = true);
  console.log('✅ All notifications marked as read');
}

/**
 * Clear all notifications
 */
export function clearAllNotifications(): void {
  notifications = [];
  console.log('🗑️ All notifications cleared');
}

// Feature-specific notification functions

/**
 * Notify when wallet address is viewed
 */
export async function notifyWalletAddressViewed(): Promise<void> {
  await addNotification(
    'announcement',
    'Wallet Address Accessed',
    'You viewed your Pi Network wallet address. Keep it safe and share it only with trusted sources.',
  '/dashboard?tab=portfolio'
  );
}

/**
 * Notify when payment is cancelled
 */
export async function notifyPaymentCancelled(paymentId: string, amount: number): Promise<void> {
  await addNotification(
    'node_update',
    'Payment Cancelled',
    `Payment of ${amount} Pi has been cancelled successfully.`,
  '/dashboard/transactions'
  );
}

/**
 * Notify when native features are unavailable
 */
export async function notifyNativeFeaturesUnavailable(missingFeatures: string[]): Promise<void> {
  await addNotification(
    'announcement',
    'Pi Browser Features Unavailable',
    `Some features are not available: ${missingFeatures.join(', ')}. Consider updating your Pi Browser.`,
  '/dashboard?tab=analysis'
  );
}

/**
 * Notify when user receives Pi reward
 */
export async function notifyPiRewardReceived(amount: number, reason: string): Promise<void> {
  await addNotification(
    'badge_earned',
    'Pi Reward Received! 🎉',
    `You received ${amount} Pi for: ${reason}`,
  '/dashboard/transactions'
  );
}

/**
 * Notify when app is shared
 */
export async function notifyAppShared(): Promise<void> {
  await addNotification(
    'team_message',
    'App Shared Successfully',
    'Thanks for sharing Dynamic Wallet View with your friends!',
  );
}

/**
 * Notify when ad reward is earned
 */
export async function notifyAdRewardEarned(amount: number): Promise<void> {
  await addNotification(
    'badge_earned',
    'Ad Reward Earned! 🎬',
    `You earned ${amount} Pi for watching an ad. Keep watching to earn more!`,
  '/dashboard?tab=achievements'
  );
}

/**
 * Notify when daily ad limit is reached
 */
export async function notifyDailyAdLimitReached(): Promise<void> {
  await addNotification(
    'announcement',
    'Daily Ad Limit Reached',
    'You\'ve reached your daily limit for watching ads. Come back tomorrow for more rewards!',
  '/dashboard?tab=achievements'
  );
}

/**
 * Notify when A2U payment is sent
 */
export async function notifyA2UPaymentSent(amount: number, recipient: string): Promise<void> {
  await addNotification(
    'team_update',
    'Pi Payment Sent',
    `Successfully sent ${amount} Pi to ${recipient}`,
  '/dashboard/transactions'
  );
}

/**
 * Notify when A2U payment fails
 */
export async function notifyA2UPaymentFailed(amount: number, recipient: string, error: string): Promise<void> {
  await addNotification(
    'node_update',
    'Payment Failed',
    `Failed to send ${amount} Pi to ${recipient}: ${error}`,
  '/dashboard/transactions'
  );
}

/**
 * Notify when share dialog fails
 */
export async function notifyShareFailed(): Promise<void> {
  await addNotification(
    'announcement',
    'Share Failed',
    'Unable to share the app. Please try again or copy the link manually.',
  );
}

/**
 * Notify when ad is not available
 */
export async function notifyAdNotAvailable(): Promise<void> {
  await addNotification(
    'announcement',
    'Ads Not Available',
    'Rewarded ads are not currently available. Please try again later.',
  '/dashboard?tab=achievements'
  );
}

/**
 * Notify when user reaches achievement milestone
 */
export async function notifyAchievementMilestone(milestone: string): Promise<void> {
  await addNotification(
    'badge_earned',
    'Achievement Unlocked! 🏆',
    `Congratulations! You've reached: ${milestone}`,
  '/dashboard?tab=achievements'
  );
}

/**
 * Notify when Pi Browser update is recommended
 */
export async function notifyPiBrowserUpdateRecommended(): Promise<void> {
  await addNotification(
    'announcement',
    'Pi Browser Update Recommended',
    'Some features work better with the latest version of Pi Browser. Consider updating for the best experience.',
  );
} 