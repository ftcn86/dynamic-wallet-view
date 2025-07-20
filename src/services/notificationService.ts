import { Notification, NotificationType } from '@/data/schemas';

// In-memory storage for notifications (in production, this would be a database)
let notifications: Notification[] = [];

/**
 * Add a new notification
 */
export function addNotification(
  type: NotificationType,
  title: string,
  description: string,
  link?: string
): void {
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
export function notifyWalletAddressViewed(): void {
  addNotification(
    'announcement',
    'Wallet Address Accessed',
    'You viewed your Pi Network wallet address. Keep it safe and share it only with trusted sources.',
    '/dashboard?tab=portfolio'
  );
}

/**
 * Notify when payment is cancelled
 */
export function notifyPaymentCancelled(paymentId: string, amount: number): void {
  addNotification(
    'node_update',
    'Payment Cancelled',
    `Payment of ${amount} Pi has been cancelled successfully.`,
    '/dashboard/transactions'
  );
}

/**
 * Notify when native features are unavailable
 */
export function notifyNativeFeaturesUnavailable(missingFeatures: string[]): void {
  addNotification(
    'announcement',
    'Pi Browser Features Unavailable',
    `Some features are not available: ${missingFeatures.join(', ')}. Consider updating your Pi Browser.`,
    '/dashboard?tab=analysis'
  );
}

/**
 * Notify when user receives Pi reward
 */
export function notifyPiRewardReceived(amount: number, reason: string): void {
  addNotification(
    'badge_earned',
    'Pi Reward Received! 🎉',
    `You received ${amount} Pi for: ${reason}`,
    '/dashboard/transactions'
  );
}

/**
 * Notify when app is shared
 */
export function notifyAppShared(): void {
  addNotification(
    'team_message',
    'App Shared Successfully',
    'Thanks for sharing Dynamic Wallet View with your friends!',
  );
}

/**
 * Notify when ad reward is earned
 */
export function notifyAdRewardEarned(amount: number): void {
  addNotification(
    'badge_earned',
    'Ad Reward Earned! 🎬',
    `You earned ${amount} Pi for watching an ad. Keep watching to earn more!`,
    '/dashboard?tab=achievements'
  );
}

/**
 * Notify when daily ad limit is reached
 */
export function notifyDailyAdLimitReached(): void {
  addNotification(
    'announcement',
    'Daily Ad Limit Reached',
    'You\'ve reached your daily limit for watching ads. Come back tomorrow for more rewards!',
    '/dashboard?tab=achievements'
  );
}

/**
 * Notify when A2U payment is sent
 */
export function notifyA2UPaymentSent(amount: number, recipient: string): void {
  addNotification(
    'team_update',
    'Pi Payment Sent',
    `Successfully sent ${amount} Pi to ${recipient}`,
    '/dashboard/transactions'
  );
}

/**
 * Notify when A2U payment fails
 */
export function notifyA2UPaymentFailed(amount: number, recipient: string, error: string): void {
  addNotification(
    'node_update',
    'Payment Failed',
    `Failed to send ${amount} Pi to ${recipient}: ${error}`,
    '/dashboard/transactions'
  );
}

/**
 * Notify when share dialog fails
 */
export function notifyShareFailed(): void {
  addNotification(
    'announcement',
    'Share Failed',
    'Unable to share the app. Please try again or copy the link manually.',
  );
}

/**
 * Notify when ad is not available
 */
export function notifyAdNotAvailable(): void {
  addNotification(
    'announcement',
    'Ads Not Available',
    'Rewarded ads are not currently available. Please try again later.',
    '/dashboard?tab=achievements'
  );
}

/**
 * Notify when user reaches achievement milestone
 */
export function notifyAchievementMilestone(milestone: string): void {
  addNotification(
    'badge_earned',
    'Achievement Unlocked! 🏆',
    `Congratulations! You've reached: ${milestone}`,
    '/dashboard?tab=achievements'
  );
}

/**
 * Notify when Pi Browser update is recommended
 */
export function notifyPiBrowserUpdateRecommended(): void {
  addNotification(
    'announcement',
    'Pi Browser Update Recommended',
    'Some features work better with the latest version of Pi Browser. Consider updating for the best experience.',
  );
} 