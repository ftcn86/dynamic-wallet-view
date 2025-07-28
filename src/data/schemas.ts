
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  emailNotifications: boolean;
  remindersEnabled?: boolean;
  reminderHoursBefore?: number;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string; // Pi Network user email
  walletAddress?: string; // Pi Network wallet address
  avatar: string; // Updated to match our implementation
  bio?: string; // Made optional
  balance: number; // Updated from totalBalance
  miningRate: number;
  teamSize?: number; // Added for team information
  isNodeOperator: boolean;
  nodeUptimePercentage?: number;
  kycStatus?: 'verified' | 'pending' | 'not_completed'; // Added KYC status
  joinDate?: string; // Added join date
  lastActive?: string; // Added last active
  balanceBreakdown?: {
    transferableToMainnet: number;
    totalUnverifiedPi: number;
    currentlyInLockups: number;
  };
  unverifiedPiDetails?: {
    fromReferralTeam: number;
    fromSecurityCircle: number;
    fromNodeRewards: number;
    fromOtherBonuses: number;
  };
  badges?: Badge[];
  userActiveMiningHours_LastWeek?: number;
  userActiveMiningHours_LastMonth?: number;
  activeMiningDays_LastWeek?: number;
  weeklyMiningDaysTarget?: number;
  activeMiningDays_LastMonth?: number;
  monthlyMiningDaysTarget?: number;
  termsAccepted?: boolean;
  settings: UserSettings;
  // Pi Network authentication fields
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earned: boolean;
  earnedDate?: string;
  dataAiHint?: string;
}

export type KycStatus = 'completed' | 'pending' | 'not_completed';

export interface TeamMember {
  id: string;
  name: string;
  avatarUrl: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'pending';
  unverifiedPiContribution: number;
  teamMemberActiveMiningHours_LastWeek?: number;
  teamMemberActiveMiningHours_LastMonth?: number;
  kycStatus?: KycStatus;
  dataAiHint?: string;
}

export type NodeStatus = 'online' | 'offline' | 'synchronizing';

export interface NodeData {
  nodeId: string;
  status: NodeStatus;
  lastSeen: string; // ISO 8601 string
  nodeSoftwareVersion: string;
  latestSoftwareVersion: string;
  country: string;
  countryFlag: string; // Emoji
  uptimePercentage: number;
  performanceScore: number;
  blocksProcessed: number;
  performanceHistory: Array<{ date: string; score: number }>;
}

export interface BalanceChartDataPoint {
  date: string;
  transferable: number;
  unverified: number;
}

export interface MockChartData {
  '3M': BalanceChartDataPoint[];
  '6M': BalanceChartDataPoint[];
  '12M': BalanceChartDataPoint[];
}

export interface LegalSection {
  title: string;
  content: string;
}

export type TransactionType = 'sent' | 'received' | 'mining_reward' | 'node_bonus';

export interface Transaction {
    id: string;
    date: string;
    type: TransactionType;
    amount: number;
    status: 'completed' | 'pending' | 'failed';
    from?: string;
    to?: string;
    description: string;
    blockExplorerUrl?: string;
    txid?: string; // Added for Pi Testnet explorer linking
}

export type NotificationType = 'badge_earned' | 'team_update' | 'node_update' | 'announcement' | 'team_message';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  date: string; // ISO 8601 string
  read: boolean;
  link?: string;
}
