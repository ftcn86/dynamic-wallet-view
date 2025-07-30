import { PrismaClient } from '@prisma/client';
import type { User as UserType, Transaction as AppTransactionType, Notification as AppNotificationType, TeamMember as AppTeamMemberType, NodeData as AppNodeDataType } from '@/data/schemas';

import { KycStatus, TeamMemberStatus, NodeStatus, TransactionType as PrismaTransactionType, TransactionStatus as PrismaTransactionStatus, NotificationType as PrismaNotificationType } from '@prisma/client';
import type { Badge as PrismaBadge } from '@prisma/client';

function mapKycStatus(status: string | undefined): KycStatus | undefined {
  if (!status) return undefined;
  switch (status.toUpperCase()) {
    case 'COMPLETED':
    case 'VERIFIED':
      return KycStatus.COMPLETED;
    case 'PENDING':
      return KycStatus.PENDING;
    case 'NOT_COMPLETED':
    case 'NOTCOMPLETED':
    case 'NOT COMPLETED':
      return KycStatus.NOT_COMPLETED;
    default:
      return undefined;
  }
}
function mapTeamMemberStatus(status: string | undefined): TeamMemberStatus | undefined {
  if (!status) return undefined;
  switch (status.toUpperCase()) {
    case 'ACTIVE': return TeamMemberStatus.ACTIVE;
    case 'INACTIVE': return TeamMemberStatus.INACTIVE;
    case 'PENDING': return TeamMemberStatus.PENDING;
    default: return undefined;
  }
}
function mapNodeStatus(status: string | undefined): NodeStatus | undefined {
  if (!status) return undefined;
  switch (status.toUpperCase()) {
    case 'ONLINE': return NodeStatus.ONLINE;
    case 'OFFLINE': return NodeStatus.OFFLINE;
    case 'SYNCHRONIZING': return NodeStatus.SYNCHRONIZING;
    default: return undefined;
  }
}
function mapTransactionType(type: string | undefined): PrismaTransactionType | undefined {
  if (!type) return undefined;
  switch (type.toUpperCase()) {
    case 'SENT': return PrismaTransactionType.SENT;
    case 'RECEIVED': return PrismaTransactionType.RECEIVED;
    case 'MINING_REWARD':
    case 'MININGREWARD':
      return PrismaTransactionType.MINING_REWARD;
    case 'NODE_BONUS':
    case 'NODEBONUS':
      return PrismaTransactionType.NODE_BONUS;
    default: return undefined;
  }
}
function mapTransactionStatus(status: string | undefined): PrismaTransactionStatus | undefined {
  if (!status) return undefined;
  switch (status.toUpperCase()) {
    case 'COMPLETED': return PrismaTransactionStatus.COMPLETED;
    case 'PENDING': return PrismaTransactionStatus.PENDING;
    case 'FAILED': return PrismaTransactionStatus.FAILED;
    default: return undefined;
  }
}
function mapNotificationType(type: string | undefined): PrismaNotificationType | undefined {
  if (!type) return undefined;
  switch (type.toUpperCase()) {
    case 'BADGE_EARNED':
    case 'BADGE EARNED':
    case 'BADGE-EARNED':
    case 'BADGE_ACHIEVED':
      return PrismaNotificationType.BADGE_EARNED;
    case 'TEAM_UPDATE':
    case 'TEAM UPDATE':
      return PrismaNotificationType.TEAM_UPDATE;
    case 'NODE_UPDATE':
    case 'NODE UPDATE':
      return PrismaNotificationType.NODE_UPDATE;
    case 'ANNOUNCEMENT': return PrismaNotificationType.ANNOUNCEMENT;
    case 'TEAM_MESSAGE':
    case 'TEAM MESSAGE':
      return PrismaNotificationType.TEAM_MESSAGE;
    default: return undefined;
  }
}

// Use environment variable for database URL (with fallback for build time)
const databaseUrl = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

// Use unknown for now until Prisma types are properly generated
type User = unknown;
type Transaction = unknown;
type Notification = unknown;
type TeamMember = unknown;
type NodeData = unknown;
interface Badge {
  name: string;
  description: string;
  iconUrl: string;
  dataAiHint?: string;
}
interface UserBadgeResult {
  name: string;
  description: string;
  iconUrl: string;
  dataAiHint?: string;
  earned: boolean;
  earnedDate: string;
}
type UserBadge = unknown;

interface CreateBadgeInput {
  name: string;
  description: string;
  iconUrl: string;
  dataAiHint?: string;
}

// User Management
export class UserService {
  static async createUser(userData: Partial<UserType>): Promise<User> {
    return await prisma.user.create({
      data: {
        username: userData.username!,
        name: userData.name!,
        email: userData.email,
        walletAddress: userData.walletAddress,
        avatar: userData.avatar || '/default-avatar.png',
        bio: userData.bio,
        balance: userData.balance || 0,
        miningRate: userData.miningRate || 0,
        teamSize: userData.teamSize || 0,
        isNodeOperator: userData.isNodeOperator || false,
        nodeUptimePercentage: userData.nodeUptimePercentage,
        kycStatus: mapKycStatus(userData.kycStatus as string),
        joinDate: userData.joinDate ? new Date(userData.joinDate) : new Date(),
        termsAccepted: userData.termsAccepted || false,
        accessToken: userData.accessToken,
        refreshToken: userData.refreshToken,
        tokenExpiresAt: userData.tokenExpiresAt,
        settings: {
          create: {
            theme: userData.settings?.theme || 'system',
            language: userData.settings?.language || 'en',
            notifications: userData.settings?.notifications ?? true,
            emailNotifications: userData.settings?.emailNotifications ?? false,
            remindersEnabled: userData.settings?.remindersEnabled ?? false,
            reminderHoursBefore: userData.settings?.reminderHoursBefore || 1,
          }
        },
        balanceBreakdown: {
          create: {
            transferableToMainnet: userData.balanceBreakdown?.transferableToMainnet || 0,
            totalUnverifiedPi: userData.balanceBreakdown?.totalUnverifiedPi || 0,
            currentlyInLockups: userData.balanceBreakdown?.currentlyInLockups || 0,
          }
        },
        unverifiedPiDetails: {
          create: {
            fromReferralTeam: userData.unverifiedPiDetails?.fromReferralTeam || 0,
            fromSecurityCircle: userData.unverifiedPiDetails?.fromSecurityCircle || 0,
            fromNodeRewards: userData.unverifiedPiDetails?.fromNodeRewards || 0,
            fromOtherBonuses: userData.unverifiedPiDetails?.fromOtherBonuses || 0,
          }
        }
      },
      include: {
        settings: true,
        balanceBreakdown: true,
        unverifiedPiDetails: true,
        badges: {
          include: {
            badge: true
          }
        }
      }
    });
  }

  static async getUserById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        settings: true,
        balanceBreakdown: true,
        unverifiedPiDetails: true,
        badges: {
          include: {
            badge: true
          }
        },
        transactions: {
          orderBy: { date: 'desc' },
          take: 10
        },
        notifications: {
          where: { read: false },
          orderBy: { date: 'desc' },
          take: 10
        },
        teamMembers: true,
        nodeData: {
          include: {
            performanceHistory: {
              orderBy: { date: 'desc' },
              take: 30
            }
          }
        }
      }
    });
  }

  static async getUserByUsername(username: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { username },
      include: {
        settings: true,
        balanceBreakdown: true,
        unverifiedPiDetails: true,
        badges: {
          include: {
            badge: true
          }
        }
      }
    });
  }

  static async updateUser(id: string, userData: Partial<UserType>): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: {
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
        bio: userData.bio,
        balance: userData.balance,
        miningRate: userData.miningRate,
        teamSize: userData.teamSize,
        isNodeOperator: userData.isNodeOperator,
        nodeUptimePercentage: userData.nodeUptimePercentage,
        kycStatus: mapKycStatus(userData.kycStatus as string),
        lastActive: new Date(),
        termsAccepted: userData.termsAccepted,
        accessToken: userData.accessToken,
        refreshToken: userData.refreshToken,
        tokenExpiresAt: userData.tokenExpiresAt,
        settings: {
          update: {
            theme: userData.settings?.theme,
            language: userData.settings?.language,
            notifications: userData.settings?.notifications,
            emailNotifications: userData.settings?.emailNotifications,
            remindersEnabled: userData.settings?.remindersEnabled,
            reminderHoursBefore: userData.settings?.reminderHoursBefore,
          }
        },
        balanceBreakdown: {
          update: {
            transferableToMainnet: userData.balanceBreakdown?.transferableToMainnet,
            totalUnverifiedPi: userData.balanceBreakdown?.totalUnverifiedPi,
            currentlyInLockups: userData.balanceBreakdown?.currentlyInLockups,
          }
        },
        unverifiedPiDetails: {
          update: {
            fromReferralTeam: userData.unverifiedPiDetails?.fromReferralTeam,
            fromSecurityCircle: userData.unverifiedPiDetails?.fromSecurityCircle,
            fromNodeRewards: userData.unverifiedPiDetails?.fromNodeRewards,
            fromOtherBonuses: userData.unverifiedPiDetails?.fromOtherBonuses,
          }
        }
      },
      include: {
        settings: true,
        balanceBreakdown: true,
        unverifiedPiDetails: true,
        badges: {
          include: {
            badge: true
          }
        }
      }
    });
  }
}

// Transaction Management
export class TransactionService {
  static async createTransaction(userId: string, transactionData: Omit<AppTransactionType, 'id' | 'date'>): Promise<Transaction> {
    return await prisma.transaction.create({
      data: {
        userId,
        date: new Date(),
        type: mapTransactionType(transactionData.type as string) ?? PrismaTransactionType.SENT,
        amount: transactionData.amount,
        status: mapTransactionStatus(transactionData.status as string) ?? PrismaTransactionStatus.PENDING,
        from: transactionData.from,
        to: transactionData.to,
        description: transactionData.description,
        blockExplorerUrl: transactionData.blockExplorerUrl,
      }
    });
  }

  static async getUserTransactions(userId: string, page: number = 1, limit: number = 20): Promise<{ transactions: Transaction[], total: number }> {
    const skip = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({
        where: { userId }
      })
    ]);

    return { transactions, total };
  }

  static async getTransactionById(id: string): Promise<Transaction | null> {
    return await prisma.transaction.findUnique({
      where: { id }
    });
  }
}

// Notification Management
export class NotificationService {
  static async createNotification(userId: string, notificationData: Omit<AppNotificationType, 'id' | 'date' | 'read'>): Promise<Notification> {
    return await prisma.notification.create({
      data: {
        userId,
        type: mapNotificationType(notificationData.type as string) ?? PrismaNotificationType.ANNOUNCEMENT,
        title: notificationData.title,
        description: notificationData.description,
        link: notificationData.link,
      }
    });
  }

  static async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    return await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { read: false })
      },
      orderBy: { date: 'desc' }
    });
  }

  static async markAsRead(id: string): Promise<Notification> {
    return await prisma.notification.update({
      where: { id },
      data: { read: true }
    });
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: { userId, read: false }
    });
  }
}

// Team Management
export class TeamService {
  static async createTeamMember(userId: string, memberData: Omit<AppTeamMemberType, 'id'>): Promise<TeamMember> {
    return await prisma.teamMember.create({
      data: {
        userId,
        name: memberData.name,
        avatarUrl: memberData.avatarUrl,
        joinDate: new Date(memberData.joinDate),
        status: mapTeamMemberStatus(memberData.status as string),
        unverifiedPiContribution: memberData.unverifiedPiContribution,
        teamMemberActiveMiningHours_LastWeek: memberData.teamMemberActiveMiningHours_LastWeek || 0,
        teamMemberActiveMiningHours_LastMonth: memberData.teamMemberActiveMiningHours_LastMonth || 0,
        kycStatus: mapKycStatus(memberData.kycStatus as string),
        dataAiHint: memberData.dataAiHint,
      }
    });
  }

  static async getUserTeamMembers(userId: string): Promise<TeamMember[]> {
    return await prisma.teamMember.findMany({
      where: { userId },
      orderBy: { joinDate: 'desc' }
    });
  }

  static async updateTeamMember(id: string, memberData: Partial<AppTeamMemberType>): Promise<TeamMember> {
    return await prisma.teamMember.update({
      where: { id },
      data: {
        name: memberData.name,
        avatarUrl: memberData.avatarUrl,
        status: mapTeamMemberStatus(memberData.status as string),
        unverifiedPiContribution: memberData.unverifiedPiContribution,
        teamMemberActiveMiningHours_LastWeek: memberData.teamMemberActiveMiningHours_LastWeek,
        teamMemberActiveMiningHours_LastMonth: memberData.teamMemberActiveMiningHours_LastMonth,
        kycStatus: mapKycStatus(memberData.kycStatus as string),
        dataAiHint: memberData.dataAiHint,
      }
    });
  }
}

// Node Data Management
export class NodeService {
  static async createNodeData(userId: string, nodeData: Omit<AppNodeDataType, 'id'>): Promise<NodeData> {
    return await prisma.nodeData.create({
      data: {
        userId,
        nodeId: nodeData.nodeId,
        status: NodeStatus.ONLINE,
        lastSeen: new Date(nodeData.lastSeen),
        nodeSoftwareVersion: nodeData.nodeSoftwareVersion,
        latestSoftwareVersion: nodeData.latestSoftwareVersion,
        country: nodeData.country,
        countryFlag: nodeData.countryFlag,
        uptimePercentage: nodeData.uptimePercentage,
        performanceScore: nodeData.performanceScore,
        blocksProcessed: nodeData.blocksProcessed,
        performanceHistory: {
          create: nodeData.performanceHistory.map(history => ({
            date: new Date(history.date),
            score: history.score,
          }))
        }
      },
      include: {
        performanceHistory: {
          orderBy: { date: 'desc' }
        }
      }
    });
  }

  static async getUserNodeData(userId: string): Promise<NodeData | null> {
    return await prisma.nodeData.findUnique({
      where: { userId },
      include: {
        performanceHistory: {
          orderBy: { date: 'desc' },
          take: 30
        }
      }
    });
  }

  static async updateNodeData(userId: string, nodeData: Partial<AppNodeDataType>): Promise<NodeData> {
    return await prisma.nodeData.update({
      where: { userId },
      data: {
        status: NodeStatus.ONLINE,
        lastSeen: nodeData.lastSeen ? new Date(nodeData.lastSeen) : new Date(),
        nodeSoftwareVersion: nodeData.nodeSoftwareVersion,
        latestSoftwareVersion: nodeData.latestSoftwareVersion,
        country: nodeData.country,
        countryFlag: nodeData.countryFlag,
        uptimePercentage: nodeData.uptimePercentage,
        performanceScore: nodeData.performanceScore,
        blocksProcessed: nodeData.blocksProcessed,
      },
      include: {
        performanceHistory: {
          orderBy: { date: 'desc' }
        }
      }
    });
  }
}

// Badge Management
export class BadgeService {
  static async createBadge(badgeData: Record<string, unknown>): Promise<PrismaBadge> {
    if (typeof badgeData.name !== 'string') throw new Error('Invalid badge name');
    if (typeof badgeData.description !== 'string') throw new Error('Invalid badge description');
    if (typeof badgeData.iconUrl !== 'string') throw new Error('Invalid badge iconUrl');
    if (badgeData.dataAiHint !== undefined && typeof badgeData.dataAiHint !== 'string') throw new Error('Invalid badge dataAiHint');
    return await prisma.badge.create({
      data: {
        name: badgeData.name,
        description: badgeData.description,
        iconUrl: badgeData.iconUrl,
        dataAiHint: badgeData.dataAiHint as string | undefined,
      }
    });
  }

  static async assignBadgeToUser(userId: string, badgeId: string): Promise<void> {
    await prisma.userBadge.create({
      data: {
        userId,
        badgeId,
        earned: true,
        earnedDate: new Date(),
      }
    });
  }

  static async getUserBadges(userId: string): Promise<UserBadgeResult[]> {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true
      }
    });
    
    return userBadges.map((ub: unknown): UserBadgeResult => {
      if (
        typeof ub === 'object' &&
        ub !== null &&
        'badge' in ub &&
        typeof (ub as { badge?: unknown }).badge === 'object'
      ) {
        const badgeObj = (ub as { badge: Record<string, unknown> }).badge;
        const { name, description, iconUrl, dataAiHint } = badgeObj;
        return {
          name: name as string,
          description: description as string,
          iconUrl: iconUrl as string,
          dataAiHint: dataAiHint as string | undefined,
          earned: (ub as { earned?: boolean }).earned ?? false,
          earnedDate: (ub as { earnedDate?: string }).earnedDate ?? '',
        };
      }
      return {
        name: '',
        description: '',
        iconUrl: '',
        dataAiHint: undefined,
        earned: false,
        earnedDate: '',
      };
    });
  }
}

// Balance History Management
export class BalanceHistoryService {
  static async addBalanceHistory(userId: string, transferable: number, unverified: number): Promise<void> {
    await prisma.balanceHistory.create({
      data: {
        userId,
        date: new Date(),
        transferable,
        unverified,
      }
    });
  }

  static async getBalanceHistory(userId: string, period: '3M' | '6M' | '12M' = '6M'): Promise<unknown[]> {
    const months = period === '3M' ? 3 : period === '6M' ? 6 : 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return await prisma.balanceHistory.findMany({
      where: {
        userId,
        date: {
          gte: startDate
        }
      },
      orderBy: { date: 'asc' }
    });
  }
} 