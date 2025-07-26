import { PrismaClient } from '@prisma/client';
import { User as UserType, Transaction as TransactionType, Notification as NotificationType, TeamMember as TeamMemberType, NodeData as NodeDataType } from '@/data/schemas';

// Use environment variable for database URL (with fallback for build time)
const databaseUrl = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

// Use any for now until Prisma types are properly generated
type User = any;
type Transaction = any;
type Notification = any;
type TeamMember = any;
type NodeData = any;
type Badge = any;
type UserBadge = any;

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
        kycStatus: userData.kycStatus,
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
        kycStatus: userData.kycStatus,
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
  static async createTransaction(userId: string, transactionData: Omit<TransactionType, 'id' | 'date'>): Promise<Transaction> {
    return await prisma.transaction.create({
      data: {
        userId,
        date: new Date(),
        type: transactionData.type,
        amount: transactionData.amount,
        status: transactionData.status,
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
  static async createNotification(userId: string, notificationData: Omit<NotificationType, 'id' | 'date' | 'read'>): Promise<Notification> {
    return await prisma.notification.create({
      data: {
        userId,
        type: notificationData.type,
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
  static async createTeamMember(userId: string, memberData: Omit<TeamMemberType, 'id'>): Promise<TeamMember> {
    return await prisma.teamMember.create({
      data: {
        userId,
        name: memberData.name,
        avatarUrl: memberData.avatarUrl,
        joinDate: new Date(memberData.joinDate),
        status: memberData.status,
        unverifiedPiContribution: memberData.unverifiedPiContribution,
        teamMemberActiveMiningHours_LastWeek: memberData.teamMemberActiveMiningHours_LastWeek || 0,
        teamMemberActiveMiningHours_LastMonth: memberData.teamMemberActiveMiningHours_LastMonth || 0,
        kycStatus: memberData.kycStatus,
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

  static async updateTeamMember(id: string, memberData: Partial<TeamMemberType>): Promise<TeamMember> {
    return await prisma.teamMember.update({
      where: { id },
      data: {
        name: memberData.name,
        avatarUrl: memberData.avatarUrl,
        status: memberData.status,
        unverifiedPiContribution: memberData.unverifiedPiContribution,
        teamMemberActiveMiningHours_LastWeek: memberData.teamMemberActiveMiningHours_LastWeek,
        teamMemberActiveMiningHours_LastMonth: memberData.teamMemberActiveMiningHours_LastMonth,
        kycStatus: memberData.kycStatus,
        dataAiHint: memberData.dataAiHint,
      }
    });
  }
}

// Node Data Management
export class NodeService {
  static async createNodeData(userId: string, nodeData: Omit<NodeDataType, 'id'>): Promise<NodeData> {
    return await prisma.nodeData.create({
      data: {
        userId,
        nodeId: nodeData.nodeId,
        status: nodeData.status,
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

  static async updateNodeData(userId: string, nodeData: Partial<NodeDataType>): Promise<NodeData> {
    return await prisma.nodeData.update({
      where: { userId },
      data: {
        status: nodeData.status,
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
  static async createBadge(badgeData: Omit<Badge, 'id' | 'createdAt'>): Promise<Badge> {
    return await prisma.badge.create({
      data: {
        name: badgeData.name,
        description: badgeData.description,
        iconUrl: badgeData.iconUrl,
        dataAiHint: badgeData.dataAiHint,
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

  static async getUserBadges(userId: string): Promise<Badge[]> {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true
      }
    });
    
    return userBadges.map((ub: any) => ({
      ...ub.badge,
      earned: ub.earned,
      earnedDate: ub.earnedDate?.toISOString(),
    }));
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

  static async getBalanceHistory(userId: string, period: '3M' | '6M' | '12M' = '6M'): Promise<any[]> {
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