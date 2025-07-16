import {
  users,
  bunkDecisions,
  friendVotes,
  confessions,
  confessionReplies,
  userBadges,
  type User,
  type UpsertUser,
  type BunkDecision,
  type InsertBunkDecision,
  type FriendVote,
  type InsertFriendVote,
  type Confession,
  type InsertConfession,
  type UserBadge,
  type InsertUserBadge,
  attendedClasses,
  type InsertAttendedClass,
  type AttendedClass,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sum, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Bunk decision operations
  createBunkDecision(decision: InsertBunkDecision): Promise<BunkDecision>;
  getBunkDecisionsByUser(userId: string): Promise<BunkDecision[]>;
  getBunkDecisionWithVotes(id: number): Promise<BunkDecision & { friendVotes: FriendVote[] } | undefined>;
  
  // Friend vote operations
  createFriendVote(vote: InsertFriendVote): Promise<FriendVote>;
  getFriendVotesByDecision(decisionId: number): Promise<FriendVote[]>;
  
  // Confession operations
  createConfession(confession: InsertConfession): Promise<Confession>;
  getConfessions(limit: number, offset: number): Promise<Confession[]>;
  likeConfession(confessionId: number): Promise<void>;
  
  // Badge operations
  createUserBadge(badge: InsertUserBadge): Promise<UserBadge>;
  getUserBadges(userId: string): Promise<UserBadge[]>;
  
  // Analytics operations
  getUserAnalytics(userId: string): Promise<{
    totalBunks: number;
    attendanceRate: number;
    reasonBreakdown: Array<{ reason: string; percentage: number }>;
    weeklyPattern: number[];
  }>;

  // Attended class operations
  createAttendedClass(attended: InsertAttendedClass): Promise<AttendedClass>;
  getAttendedClassesByUser(userId: string): Promise<AttendedClass[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Bunk decision operations
  async createBunkDecision(decision: InsertBunkDecision): Promise<BunkDecision> {
    const [bunkDecision] = await db
      .insert(bunkDecisions)
      .values(decision)
      .returning();
    return bunkDecision;
  }

  async getBunkDecisionsByUser(userId: string): Promise<BunkDecision[]> {
    return await db
      .select()
      .from(bunkDecisions)
      .where(eq(bunkDecisions.userId, userId))
      .orderBy(desc(bunkDecisions.createdAt));
  }

  async getBunkDecisionWithVotes(id: number): Promise<BunkDecision & { friendVotes: FriendVote[] } | undefined> {
    const [decision] = await db
      .select()
      .from(bunkDecisions)
      .where(eq(bunkDecisions.id, id));
    
    if (!decision) return undefined;

    const votes = await db
      .select()
      .from(friendVotes)
      .where(eq(friendVotes.decisionId, id));

    return { ...decision, friendVotes: votes };
  }

  // Friend vote operations
  async createFriendVote(vote: InsertFriendVote): Promise<FriendVote> {
    const [friendVote] = await db
      .insert(friendVotes)
      .values(vote)
      .returning();
    return friendVote;
  }

  async getFriendVotesByDecision(decisionId: number): Promise<FriendVote[]> {
    return await db
      .select()
      .from(friendVotes)
      .where(eq(friendVotes.decisionId, decisionId))
      .orderBy(desc(friendVotes.createdAt));
  }

  // Confession operations
  async createConfession(confession: InsertConfession): Promise<Confession> {
    const [newConfession] = await db
      .insert(confessions)
      .values(confession)
      .returning();
    return newConfession;
  }

  async getConfessions(limit: number, offset: number): Promise<Confession[]> {
    return await db
      .select()
      .from(confessions)
      .orderBy(desc(confessions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async likeConfession(confessionId: number): Promise<void> {
    await db
      .update(confessions)
      .set({ 
        likes: sql`${confessions.likes} + 1`
      })
      .where(eq(confessions.id, confessionId));
  }

  // Badge operations
  async createUserBadge(badge: InsertUserBadge): Promise<UserBadge> {
    const [userBadge] = await db
      .insert(userBadges)
      .values(badge)
      .returning();
    return userBadge;
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));
  }

  // Analytics operations
  async getUserAnalytics(userId: string): Promise<{
    totalBunks: number;
    attendanceRate: number;
    reasonBreakdown: Array<{ reason: string; percentage: number }>;
    weeklyPattern: number[];
  }> {
    const decisions = await db
      .select()
      .from(bunkDecisions)
      .where(eq(bunkDecisions.userId, userId));

    const totalDecisions = decisions.length;
    const totalBunks = decisions.filter(d => d.decision === 'bunk').length;
    const attendanceRate = totalDecisions > 0 ? Math.round(((totalDecisions - totalBunks) / totalDecisions) * 100) : 100;

    // Calculate reason breakdown
    const reasonCounts = decisions.reduce((acc, decision) => {
      let reason = 'Other';
      if (decision.weatherCondition && decision.weatherCondition.includes('rain')) {
        reason = 'Weather';
      } else if (decision.mood === 'lazy') {
        reason = 'Lazy mood';
      } else if (decision.attendancePercentage > 80) {
        reason = 'High attendance';
      }
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const reasonBreakdown = Object.entries(reasonCounts).map(([reason, count]) => ({
      reason,
      percentage: Math.round((count / totalDecisions) * 100),
    }));

    // Calculate weekly pattern (bunks per day of week)
    const weeklyPattern = new Array(7).fill(0);
    decisions.forEach(decision => {
      if (decision.createdAt && decision.decision === 'bunk') {
        const dayOfWeek = new Date(decision.createdAt).getDay();
        weeklyPattern[dayOfWeek]++;
      }
    });

    return {
      totalBunks,
      attendanceRate,
      reasonBreakdown,
      weeklyPattern,
    };
  }

  // Attended class operations
  async createAttendedClass(attended: InsertAttendedClass): Promise<AttendedClass> {
    const [attendedClass] = await db
      .insert(attendedClasses)
      .values(attended)
      .returning();
    return attendedClass;
  }

  async getAttendedClassesByUser(userId: string): Promise<AttendedClass[]> {
    return await db
      .select()
      .from(attendedClasses)
      .where(eq(attendedClasses.userId, userId))
      .orderBy(desc(attendedClasses.createdAt));
  }
}

export const storage = new DatabaseStorage();
