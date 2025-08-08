import prisma from '@/lib/db';
import type { User as UserType, Transaction as AppTransactionType, Notification as AppNotificationType, TeamMember as AppTeamMemberType, NodeData as AppNodeDataType } from '@/data/schemas';

// Use Prisma singleton

// Type mappings for Prisma enums
type KycStatus = 'COMPLETED' | 'PENDING' | 'NOT_COMPLETED';
type TeamMemberStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';
type NodeStatus = 'ONLINE' | 'OFFLINE' | 'SYNCHRONIZING';
type PrismaTransactionType = 'SENT' | 'RECEIVED' | 'MINING_REWARD' | 'NODE_BONUS';
type PrismaTransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED';
type PrismaNotificationType = 'BADGE_EARNED' | 'TEAM_UPDATE' | 'NODE_UPDATE' | 'ANNOUNCEMENT' | 'TEAM_MESSAGE';

// Helper functions for mapping between app and Prisma types
function mapKycStatus(status: string | undefined): KycStatus | undefined {
  if (!status) return undefined;
  switch (status.toLowerCase()) {
    case 'completed': return 'COMPLETED';
    case 'pending': return 'PENDING';
    case 'not_completed': return 'NOT_COMPLETED';
    default: return undefined;
  }
}

function mapTeamMemberStatus(status: string | undefined): TeamMemberStatus | undefined {
  if (!status) return undefined;
  switch (status.toLowerCase()) {
    case 'active': return 'ACTIVE';
    case 'inactive': return 'INACTIVE';
    case 'pending': return 'PENDING';
    default: return undefined;
  }
}

function mapNodeStatus(status: string | undefined): NodeStatus | undefined {
  if (!status) return undefined;
  switch (status.toLowerCase()) {
    case 'online': return 'ONLINE';
    case 'offline': return 'OFFLINE';
    case 'synchronizing': return 'SYNCHRONIZING';
    default: return undefined;
  }
}

function mapTransactionType(type: string | undefined): PrismaTransactionType | undefined {
  if (!type) return undefined;
  switch (type.toLowerCase()) {
    case 'sent': return 'SENT';
    case 'received': return 'RECEIVED';
    case 'mining_reward': return 'MINING_REWARD';
    case 'node_bonus': return 'NODE_BONUS';
    default: return undefined;
  }
}

function mapTransactionStatus(status: string | undefined): PrismaTransactionStatus | undefined {
  if (!status) return undefined;
  switch (status.toLowerCase()) {
    case 'completed': return 'COMPLETED';
    case 'pending': return 'PENDING';
    case 'failed': return 'FAILED';
    default: return undefined;
  }
}

function mapNotificationType(type: string | undefined): PrismaNotificationType | undefined {
  if (!type) return undefined;
  switch (type.toLowerCase()) {
    case 'badge_earned': return 'BADGE_EARNED';
    case 'team_update': return 'TEAM_UPDATE';
    case 'node_update': return 'NODE_UPDATE';
    case 'announcement': return 'ANNOUNCEMENT';
    case 'team_message': return 'TEAM_MESSAGE';
    default: return undefined;
  }
}

// Type definitions for Prisma results
type User = unknown;
type Transaction = unknown;
type Notification = unknown;
type TeamMember = unknown;
type NodeData = unknown;
interface Badge {
  name: string;
  description: string;
  iconUrl: string;
  dataAiHint?: string | null;
}
interface UserBadgeResult {
  name: string;
  description: string;
  iconUrl: string;
  dataAiHint?: string | null;
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
        uid: userData.username!, // Use username as uid
        username: userData.username!,
        accessToken: userData.accessToken,
      }
    });
  }

  static async getUserById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id }
    });
  }

  static async getUserByUsername(username: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { username }
    });
  }

  static async getUserByUid(uid: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { uid }
    });
  }

  static async getUserByAccessToken(accessToken: string): Promise<User | null> {
    return await prisma.user.findFirst({
      where: { accessToken }
    });
  }

  static async updateUser(id: string, userData: Partial<UserType>): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: {
        username: userData.username,
        accessToken: userData.accessToken,
      }
    });
  }

  static async deleteUser(id: string): Promise<User> {
    return await prisma.user.delete({
      where: { id }
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
        type: mapTransactionType(transactionData.type) || 'SENT',
        amount: transactionData.amount,
        status: mapTransactionStatus(transactionData.status) || 'PENDING',
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
      prisma.transaction.count({ where: { userId } })
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
        type: mapNotificationType(notificationData.type) || 'ANNOUNCEMENT',
        title: notificationData.title,
        description: notificationData.description,
        date: new Date(),
        read: false,
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

// Feedback Management
export class FeedbackService {
  static async createFeedback(userId: string | null, data: { type: string; message: string; pagePath?: string; userAgent?: string; appVersion?: string }) {
    const record = await prisma.feedback.create({
      data: {
        userId: userId || null,
        type: data.type,
        message: data.message,
        pagePath: data.pagePath,
        userAgent: data.userAgent,
        appVersion: data.appVersion,
      }
    });
    return record;
  }

  static async listFeedback(status?: string) {
    return prisma.feedback.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' }
    });
  }

  static async reply(feedbackId: string, adminId: string, message: string) {
    const reply = await prisma.feedbackReply.create({ data: { feedbackId, adminId, message } });
    return reply;
  }

  static async setStatus(feedbackId: string, status: string) {
    return prisma.feedback.update({ where: { id: feedbackId }, data: { status } });
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
        status: mapTeamMemberStatus(memberData.status) || 'PENDING',
        unverifiedPiContribution: memberData.unverifiedPiContribution,
        teamMemberActiveMiningHours_LastWeek: memberData.teamMemberActiveMiningHours_LastWeek,
        teamMemberActiveMiningHours_LastMonth: memberData.teamMemberActiveMiningHours_LastMonth,
        kycStatus: mapKycStatus(memberData.kycStatus) || 'NOT_COMPLETED',
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
        status: memberData.status ? mapTeamMemberStatus(memberData.status) : undefined,
        unverifiedPiContribution: memberData.unverifiedPiContribution,
        teamMemberActiveMiningHours_LastWeek: memberData.teamMemberActiveMiningHours_LastWeek,
        teamMemberActiveMiningHours_LastMonth: memberData.teamMemberActiveMiningHours_LastMonth,
        kycStatus: memberData.kycStatus ? mapKycStatus(memberData.kycStatus) : undefined,
        dataAiHint: memberData.dataAiHint,
      }
    });
  }
}

// Node Management
export class NodeService {
  static async createNodeData(userId: string, nodeData: Omit<AppNodeDataType, 'id'>): Promise<NodeData> {
    return await prisma.nodeData.create({
      data: {
        userId,
        nodeId: nodeData.nodeId,
        status: mapNodeStatus(nodeData.status) || 'OFFLINE',
        lastSeen: new Date(nodeData.lastSeen),
        nodeSoftwareVersion: nodeData.nodeSoftwareVersion,
        latestSoftwareVersion: nodeData.latestSoftwareVersion,
        country: nodeData.country,
        countryFlag: nodeData.countryFlag,
        uptimePercentage: nodeData.uptimePercentage,
        performanceScore: nodeData.performanceScore,
        blocksProcessed: nodeData.blocksProcessed,
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
        nodeId: nodeData.nodeId,
        status: nodeData.status ? mapNodeStatus(nodeData.status) : undefined,
        lastSeen: nodeData.lastSeen ? new Date(nodeData.lastSeen) : undefined,
        nodeSoftwareVersion: nodeData.nodeSoftwareVersion,
        latestSoftwareVersion: nodeData.latestSoftwareVersion,
        country: nodeData.country,
        countryFlag: nodeData.countryFlag,
        uptimePercentage: nodeData.uptimePercentage,
        performanceScore: nodeData.performanceScore,
        blocksProcessed: nodeData.blocksProcessed,
      }
    });
  }
}

// Badge Management
export class BadgeService {
  static async createBadge(badgeData: Record<string, unknown>): Promise<Badge> {
    return await prisma.badge.create({
      data: {
        name: badgeData.name as string,
        description: badgeData.description as string,
        iconUrl: badgeData.iconUrl as string,
        dataAiHint: badgeData.dataAiHint as string,
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

    return userBadges.map(ub => ({
      name: (ub.badge as Badge).name,
      description: (ub.badge as Badge).description,
      iconUrl: (ub.badge as Badge).iconUrl,
      dataAiHint: (ub.badge as Badge).dataAiHint,
      earned: ub.earned,
      earnedDate: ub.earnedDate?.toISOString() || '',
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

  static async getBalanceHistory(userId: string, period: '3M' | '6M' | '12M' = '6M'): Promise<unknown[]> {
    const months = period === '3M' ? 3 : period === '6M' ? 6 : 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return await prisma.balanceHistory.findMany({
      where: {
        userId,
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    });
  }
}

// Session Management
export class SessionService {
  static async createSession(sessionData: {
    userId: string;
    sessionToken: string;
    expiresAt: Date;
  }): Promise<unknown> {
    return await prisma.userSession.create({
      data: {
        userId: sessionData.userId,
        sessionToken: sessionData.sessionToken,
        expiresAt: sessionData.expiresAt,
        isActive: true,
      }
    });
  }

  static async getSessionByToken(sessionToken: string): Promise<unknown> {
    return await prisma.userSession.findFirst({
      where: { 
        sessionToken,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });
  }

  static async invalidateSession(sessionToken: string): Promise<void> {
    await prisma.userSession.updateMany({
      where: { 
        sessionToken,
        isActive: true
      },
      data: { 
        isActive: false,
        updatedAt: new Date()
      }
    });
  }

  static async invalidateAllUserSessions(userId: string): Promise<void> {
    await prisma.userSession.updateMany({
      where: { 
        userId,
        isActive: true
      },
      data: { 
        isActive: false,
        updatedAt: new Date()
      }
    });
  }

  static async getActiveUserSessions(userId: string): Promise<unknown[]> {
    return await prisma.userSession.findMany({
      where: { 
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });
  }

  static async cleanupExpiredSessions(): Promise<void> {
    await prisma.userSession.updateMany({
      where: { 
        expiresAt: { lt: new Date() },
        isActive: true
      },
      data: { 
        isActive: false,
        updatedAt: new Date()
      }
    });
  }
} 