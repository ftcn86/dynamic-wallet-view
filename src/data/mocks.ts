
import type { User, TeamMember, NodeData, MockChartData, Badge, KycStatus, BalanceChartDataPoint, Transaction, Notification } from './schemas';
import { getDaysInMonth, subMonths, subDays, subHours } from 'date-fns';

const gamificationBadges: Badge[] = [
  { id: 'b_wmara', name: 'Weekly Mining Marathoner', description: 'You were a true marathoner, mining consistently last week!', iconUrl: 'https://placehold.co/128x128.png', earned: false, dataAiHint: 'runner clock', earnedDate: '2024-06-20T10:00:00Z' },
  { id: 'b_mmded', name: 'Monthly Mining Dedication', description: 'Your dedication to mining last month was outstanding!', iconUrl: 'https://placehold.co/128x128.png', earned: false, dataAiHint: 'calendar medal', earnedDate: '2024-05-31T10:00:00Z' },
  { id: 'b_twtm', name: 'Team\'s Weekly Top Miner', description: 'You led your team in mining activity last week! Awesome effort.', iconUrl: 'https://placehold.co/128x128.png', earned: false, dataAiHint: 'leader numberOne', earnedDate: '2024-06-20T10:00:00Z' },
  { id: 'b_tmmc', name: 'Team\'s Monthly Mining Champion', description: 'You were the mining champion of your team last month! Incredible!', iconUrl: 'https://placehold.co/128x128.png', earned: false, dataAiHint: 'trophy star', earnedDate: '2024-05-31T10:00:00Z' },
  { id: 'b_otp', name: 'Outpaced the Pack', description: 'You significantly outpaced your team\'s average mining activity!', iconUrl: 'https://placehold.co/128x128.png', earned: false, dataAiHint: 'person ahead', earnedDate: '2024-06-20T10:00:00Z' },
  { id: 'b_atl', name: 'Active Team Leader', description: 'Your team is highly active! Great job fostering a motivated mining community.', iconUrl: 'https://placehold.co/128x128.png', earned: false, dataAiHint: 'team spark', earnedDate: '2024-06-20T10:00:00Z' },
];

const unverifiedFromReferralTeam = 2000.50;
const unverifiedFromSecurityCircle = 1000.2890;
const unverifiedFromNodeRewards = 750.00;
const unverifiedFromOtherBonuses = 456.0000;
const totalUnverified = unverifiedFromReferralTeam + unverifiedFromSecurityCircle + unverifiedFromNodeRewards + unverifiedFromOtherBonuses;

const today = new Date();
const previousMonth = subMonths(today, 1);
const daysInPreviousMonth = getDaysInMonth(previousMonth);

export const mockNodeData: NodeData = {
  nodeId: 'nodeXYZ789',
  status: 'online',
  lastSeen: subDays(today, 0.01).toISOString(),
  nodeSoftwareVersion: '0.4.7',
  latestSoftwareVersion: '0.4.9',
  country: 'United States',
  countryFlag: '🇺🇸',
  uptimePercentage: 99.85,
  performanceScore: 920,
  blocksProcessed: 12850345,
  performanceHistory: [
    { date: '2024-03-01', score: 880 },
    { date: '2024-04-01', score: 900 },
    { date: '2024-05-01', score: 910 },
    { date: '2024-06-01', score: 920 },
  ],
};

export const mockUser: User = {
  id: 'user123',
  username: 'pioneer1',
  name: 'Alex Pioneer',
  avatar: 'https://placehold.co/128x128.png',
  bio: 'Passionate Pi Network enthusiast and node operator. Exploring the future of digital currency.',
  balance: 12345.6789,
  miningRate: 0.2512,
  isNodeOperator: true,
  nodeUptimePercentage: mockNodeData.uptimePercentage,
  balanceBreakdown: {
    transferableToMainnet: 5678.1234,
    totalUnverifiedPi: totalUnverified,
    currentlyInLockups: 3210.7665,
  },
  unverifiedPiDetails: {
    fromReferralTeam: unverifiedFromReferralTeam,
    fromSecurityCircle: unverifiedFromSecurityCircle,
    fromNodeRewards: unverifiedFromNodeRewards,
    fromOtherBonuses: unverifiedFromOtherBonuses,
  },
  badges: [
    { id: 'b001', name: 'Early Adopter', description: 'Joined Pi Network in its early stages.', iconUrl: 'https://placehold.co/128x128.png', earned: true, earnedDate: '2020-05-15T10:00:00Z', dataAiHint: "award medal" },
    { id: 'b002', name: 'Node Runner', description: 'Successfully operates a Pi Node.', iconUrl: 'https://placehold.co/128x128.png', earned: true, earnedDate: '2021-11-01T10:00:00Z', dataAiHint: "server computer" },
    { id: 'b003', name: 'Team Builder', description: 'Invited 10+ active members to their team.', iconUrl: 'https://placehold.co/128x128.png', earned: true, dataAiHint: "team people", earnedDate: '2023-02-10T10:00:00Z' },
    { id: 'b004', name: 'KYC Verified', description: 'Successfully completed KYC verification.', iconUrl: 'https://placehold.co/128x128.png', earned: true, earnedDate: '2022-01-20T10:00:00Z', dataAiHint: "verified checkmark" },
    { ...gamificationBadges[0], earned: true }, // Weekly Mining Marathoner
    { ...gamificationBadges[2], earned: false }, // Team's Weekly Top Miner
    { ...gamificationBadges[5], earned: true, earnedDate: subDays(today, 1).toISOString() }, // Active Team Leader
    { ...gamificationBadges[1], earned: false }, // Monthly Mining Dedication
    { ...gamificationBadges[3], earned: false }, // Team's Monthly Mining Champion
    { ...gamificationBadges[4], earned: false }, // Outpaced the Pack
  ],
  userActiveMiningHours_LastWeek: 22,
  userActiveMiningHours_LastMonth: 85,
  activeMiningDays_LastWeek: 6,
  weeklyMiningDaysTarget: 7,
  activeMiningDays_LastMonth: Math.min(25, daysInPreviousMonth - 2),
  monthlyMiningDaysTarget: daysInPreviousMonth,
  termsAccepted: true, // Auto-accept terms for all users
  settings: {
    theme: 'system',
    language: 'en',
    notifications: true,
    emailNotifications: false,
    remindersEnabled: true,
    reminderHoursBefore: 1,
  },
};

export const mockTeam: TeamMember[] = [
  { id: 'team001', name: 'Bob Miner', avatarUrl: 'https://placehold.co/40x40.png', joinDate: '2022-03-10T10:00:00Z', status: 'active', unverifiedPiContribution: 120.5, teamMemberActiveMiningHours_LastWeek: 25, teamMemberActiveMiningHours_LastMonth: 90, kycStatus: 'completed', dataAiHint: 'man portrait' },
  { id: 'team002', name: 'Charlie User', avatarUrl: 'https://placehold.co/40x40.png', joinDate: '2022-08-20T10:00:00Z', status: 'active', unverifiedPiContribution: 55.0, teamMemberActiveMiningHours_LastWeek: 18, teamMemberActiveMiningHours_LastMonth: 70, kycStatus: 'pending', dataAiHint: 'man glasses' },
  { id: 'team003', name: 'Diana Node', avatarUrl: 'https://placehold.co/40x40.png', joinDate: '2023-01-05T10:00:00Z', status: 'active', unverifiedPiContribution: 0, teamMemberActiveMiningHours_LastWeek: 20, teamMemberActiveMiningHours_LastMonth: 75, kycStatus: 'completed', dataAiHint: 'woman portrait' },
  { id: 'team004', name: 'Edward Pi', avatarUrl: 'https://placehold.co/40x40.png', joinDate: '2021-12-15T10:00:00Z', status: 'active', unverifiedPiContribution: 250.75, teamMemberActiveMiningHours_LastWeek: 23, teamMemberActiveMiningHours_LastMonth: 88, kycStatus: 'not_completed', dataAiHint: 'person thinking' },
  { id: 'team005', name: 'Fiona Coin', avatarUrl: 'https://placehold.co/40x40.png', joinDate: '2023-02-01T10:00:00Z', status: 'active', unverifiedPiContribution: 90.0, teamMemberActiveMiningHours_LastWeek: 15, teamMemberActiveMiningHours_LastMonth: 60, kycStatus: 'completed', dataAiHint: 'woman smiling' },
  { id: 'team006', name: 'George Chain', avatarUrl: 'https://placehold.co/40x40.png', joinDate: '2023-03-15T10:00:00Z', status: 'inactive', unverifiedPiContribution: 30.0, teamMemberActiveMiningHours_LastWeek: 5, teamMemberActiveMiningHours_LastMonth: 20, kycStatus: 'pending', dataAiHint: 'man serious' },
  { id: 'team007', name: 'Hannah Block', avatarUrl: 'https://placehold.co/40x40.png', joinDate: '2023-04-01T10:00:00Z', status: 'active', unverifiedPiContribution: 150.25, teamMemberActiveMiningHours_LastWeek: 28, teamMemberActiveMiningHours_LastMonth: 100, kycStatus: 'completed', dataAiHint: 'woman nature' },
  { id: 'team008', name: 'Ian Crypto', avatarUrl: 'https://placehold.co/40x40.png', joinDate: '2023-05-10T10:00:00Z', status: 'pending', unverifiedPiContribution: 0, teamMemberActiveMiningHours_LastWeek: 0, teamMemberActiveMiningHours_LastMonth: 0, kycStatus: 'not_completed', dataAiHint: 'person silhouette' },
  { id: 'team009', name: 'Julia Token', avatarUrl: 'https://placehold.co/40x40.png', joinDate: '2023-06-20T10:00:00Z', status: 'active', unverifiedPiContribution: 75.5, teamMemberActiveMiningHours_LastWeek: 19, teamMemberActiveMiningHours_LastMonth: 65, kycStatus: 'pending', dataAiHint: 'woman colorful' },
  { id: 'team010', name: 'Kevin Ledger', avatarUrl: 'https://placehold.co/40x40.png', joinDate: '2023-07-01T10:00:00Z', status: 'active', unverifiedPiContribution: 110.0, teamMemberActiveMiningHours_LastWeek: 21, teamMemberActiveMiningHours_LastMonth: 80, kycStatus: 'completed', dataAiHint: 'man professional' },
  { id: 'team011', name: 'Laura Mine', avatarUrl: 'https://placehold.co/40x40.png', joinDate: '2023-08-15T10:00:00Z', status: 'active', unverifiedPiContribution: 40.0, teamMemberActiveMiningHours_LastWeek: 12, teamMemberActiveMiningHours_LastMonth: 50, kycStatus: 'not_completed', dataAiHint: 'woman technology' },
];

export const mockTransactions: Transaction[] = [
  { id: 'tx001', date: subDays(today, 2).toISOString(), type: 'received', amount: 150.75, status: 'completed', from: 'Fiona Coin', description: 'Project collaboration', blockExplorerUrl: 'https://api.minepi.com/blockchain/transactions/7a7ed20d3d72c365b9019baf8dc4c4e3cce4c08114d866e47ae157e3a796e9e7' },
  { id: 'tx002', date: subDays(today, 3).toISOString(), type: 'sent', amount: 50.00, status: 'completed', to: 'Bob Miner', description: 'Team bonus', blockExplorerUrl: 'https://api.minepi.com/blockchain/transactions/8b8fe21e4e83d476c0120cbf9ed5d5f4ddf5d19225e977f58bf268f4b8a7fa8' },
  { id: 'tx003', date: subDays(today, 5).toISOString(), type: 'mining_reward', amount: 6.0288, status: 'completed', description: 'Daily mining reward', blockExplorerUrl: 'https://api.minepi.com/blockchain/transactions/9c9fg32f5f94e587d1231dcg0fe6e6g5eef6e2a336f088g69cg379g5b9b8gb9' },
  { id: 'tx004', date: subDays(today, 7).toISOString(), type: 'node_bonus', amount: 12.5, status: 'completed', description: 'Weekly node operation bonus', blockExplorerUrl: 'https://api.minepi.com/blockchain/transactions/0d0gh43g6g05f698e2342edh1gf7f7h6ffg7f3b447g99h7dh480h6c0c9hc0' },
  { id: 'tx005', date: subDays(today, 10).toISOString(), type: 'sent', amount: 10.00, status: 'completed', to: 'Support Fund', description: 'Donation', blockExplorerUrl: 'https://api.minepi.com/blockchain/transactions/1e1hi54h7h16g709f3453fei2hg8g8i7ggh8g4c558h00i8ei591i7d1d0id1' },
  { id: 'tx006', date: subDays(today, 12).toISOString(), type: 'received', amount: 200.00, status: 'completed', from: 'Hannah Block', description: 'Marketplace sale', blockExplorerUrl: 'https://api.minepi.com/blockchain/transactions/2f2ij65i8i27h810g4564gfj3ih9h9j8hhi9h5d669i11jfj602j8e2e1je2' },
  { id: 'tx007', date: subDays(today, 15).toISOString(), type: 'mining_reward', amount: 6.0288, status: 'completed', description: 'Daily mining reward', blockExplorerUrl: 'https://api.minepi.com/blockchain/transactions/3g3jk76j9j38i921h5675hgk4ji0i0k9iij0i6e770j22kgkg713k9f3f2kf3' },
  { id: 'tx008', date: subDays(today, 18).toISOString(), type: 'sent', amount: 5.00, status: 'failed', to: 'InvalidUser', description: 'Test transaction', blockExplorerUrl: 'https://api.minepi.com/blockchain/transactions/4h4kl87k0k49j032i6786ihl5kj1j1l0jjk1j7f881k33lhlh824l0g4g3lg4' },
  { id: 'tx009', date: subDays(today, 20).toISOString(), type: 'received', amount: 1.00, status: 'pending', from: 'Charlie User', description: 'Coffee', blockExplorerUrl: 'https://api.minepi.com/blockchain/transactions/5i5lm98l1l50k143j7897jim6lk2k2m1kkl2k8g992l44mimi935m1h5h4mh5' },
  { id: 'tx010', date: subDays(today, 22).toISOString(), type: 'node_bonus', amount: 12.5, status: 'completed', description: 'Weekly node operation bonus', blockExplorerUrl: 'https://api.minepi.com/blockchain/transactions/6j6mn09m2m61l254k8908kjn7ml3l3n2llm3l9h003m55njnj046n2i6i5ni6' },
  { id: 'tx011', date: subDays(today, 25).toISOString(), type: 'mining_reward', amount: 6.0288, status: 'completed', description: 'Daily mining reward', blockExplorerUrl: 'https://api.minepi.com/blockchain/transactions/7k7no10n3n72m365l9019lko8nm4m4o3mmn4m0i114n66okok157o3j7j6oj7' },
  { id: 'tx012', date: subDays(today, 30).toISOString(), type: 'sent', amount: 100.00, status: 'completed', to: 'Julia Token', description: 'Pi App purchase', blockExplorerUrl: 'https://api.minepi.com/blockchain/transactions/8l8op21o4o83n476m0120mlp9on5n5p4nno5n1j225o77plpl268p4k8k7pk8' },
];


export const mockChartData: MockChartData = {
  '3M': [
    { date: '2024-04-01', transferable: 5200, unverified: 4500 },
    { date: '2024-05-01', transferable: 5500, unverified: 4300 },
    { date: '2024-06-01', transferable: mockUser.balanceBreakdown?.transferableToMainnet || 0, unverified: mockUser.balanceBreakdown?.totalUnverifiedPi || 0 },
  ],
  '6M': [
    { date: '2024-01-01', transferable: 4800, unverified: 4800 },
    { date: '2024-02-01', transferable: 5000, unverified: 4700 },
    { date: '2024-03-01', transferable: 5100, unverified: 4600 },
    { date: '2024-04-01', transferable: 5200, unverified: 4500 },
    { date: '2024-05-01', transferable: 5500, unverified: 4300 },
    { date: '2024-06-01', transferable: mockUser.balanceBreakdown?.transferableToMainnet || 0, unverified: mockUser.balanceBreakdown?.totalUnverifiedPi || 0 },
  ],
  '12M': [
    { date: '2023-07-01', transferable: 3000, unverified: 5500 },
    { date: '2023-08-01', transferable: 3200, unverified: 5400 },
    { date: '2023-09-01', transferable: 3500, unverified: 5300 },
    { date: '2023-10-01', transferable: 3800, unverified: 5200 },
    { date: '2023-11-01', transferable: 4200, unverified: 5000 },
    { date: '2023-12-01', transferable: 4500, unverified: 4900 },
    { date: '2024-01-01', transferable: 4800, unverified: 4800 },
    { date: '2024-02-01', transferable: 5000, unverified: 4700 },
    { date: '2024-03-01', transferable: 5100, unverified: 4600 },
    { date: '2024-04-01', transferable: 5200, unverified: 4500 },
    { date: '2024-05-01', transferable: 5500, unverified: 4300 },
    { date: '2024-06-01', transferable: mockUser.balanceBreakdown?.transferableToMainnet || 0, unverified: mockUser.balanceBreakdown?.totalUnverifiedPi || 0 },
  ],
};

export const GAMIFICATION_BADGE_IDS = gamificationBadges.map(b => b.id);
export const ALL_MOCK_BADGES = [
  ...mockUser.badges?.filter(b => !GAMIFICATION_BADGE_IDS.includes(b.id)) || [],
  ...gamificationBadges
];

export const mockNotifications: Notification[] = [
    {
        id: 'notif_001',
        type: 'node_update',
        title: 'Software Update Available',
        description: `Your node is running v${mockNodeData.nodeSoftwareVersion}, but v${mockNodeData.latestSoftwareVersion} is available.`,
        date: subHours(today, 2).toISOString(),
        read: true,
        link: '/dashboard/node'
    },
    {
        id: 'notif_002',
        type: 'badge_earned',
        title: 'New Badge Earned!',
        description: 'You\'ve earned the "Active Team Leader" badge. Great leadership!',
        date: subDays(today, 1).toISOString(),
        read: true,
        link: '/dashboard?tab=achievements'
    },
    {
        id: 'notif_003',
        type: 'team_update',
        title: 'Team Member KYC Verified',
        description: 'Your team member, Bob Miner, has completed their KYC verification.',
        date: subDays(today, 3).toISOString(),
        read: true,
        link: '/dashboard/team'
    },
     {
        id: 'notif_004',
        type: 'announcement',
        title: 'Community Donation Goal Met!',
        description: 'Thanks to your support, we\'ve reached our monthly server cost goal.',
        date: subDays(today, 5).toISOString(),
        read: true,
        link: '/dashboard/donate'
    },
    {
        id: 'notif_005',
        type: 'team_message',
        title: 'Message from your Team Leader',
        description: 'Great work this week everyone! Let\'s keep up the momentum.',
        date: subHours(today, 26).toISOString(),
        read: true,
        link: '/dashboard/team'
    },
];

export const MOCK_DONATION_GOAL = 250;
export const MOCK_CURRENT_DONATIONS = 185;

export const MOCK_RECENT_DONATIONS = [
  { name: 'Pioneer123', amount: 5 },
  { name: 'CryptoCat', amount: 10 },
  { name: 'AlexP', amount: 1 },
  { name: 'NodeRunner', amount: 20 },
  { name: 'PiFuture', amount: 5 },
];
