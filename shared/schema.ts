import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  real,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  password_hash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bunk decisions table
export const bunkDecisions = pgTable("bunk_decisions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  attendancePercentage: integer("attendance_percentage").notNull(),
  mood: varchar("mood").notNull(), // tired, lazy, energetic
  daysUntilExam: integer("days_until_exam").notNull(),
  professorStrictness: varchar("professor_strictness").notNull(), // chill, moderate, strict
  weatherCondition: varchar("weather_condition"),
  weatherTemperature: real("weather_temperature"),
  bunkScore: integer("bunk_score").notNull(),
  decision: varchar("decision").notNull(), // bunk, risky, attend
  aiExcuse: text("ai_excuse"),
  aiAnalysis: text("ai_analysis"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Friend votes table
export const friendVotes = pgTable("friend_votes", {
  id: serial("id").primaryKey(),
  decisionId: integer("decision_id").notNull().references(() => bunkDecisions.id),
  voterName: varchar("voter_name").notNull(),
  vote: varchar("vote").notNull(), // bunk, risky, attend
  createdAt: timestamp("created_at").defaultNow(),
});

// Confessions table
export const confessions = pgTable("confessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Confession replies table
export const confessionReplies = pgTable("confession_replies", {
  id: serial("id").primaryKey(),
  confessionId: integer("confession_id").notNull().references(() => confessions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User badges table
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  badgeType: varchar("badge_type").notNull(), // serial_bunker, weather_warrior, social_butterfly, data_nerd
  earnedAt: timestamp("earned_at").defaultNow(),
}, (table) => [
  unique().on(table.userId, table.badgeType),
]);

// Attended classes table
export const attendedClasses = pgTable("attended_classes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  attendancePercentage: integer("attendance_percentage").notNull(),
  mood: varchar("mood").notNull(), // tired, lazy, energetic
  daysUntilExam: integer("days_until_exam").notNull(),
  professorStrictness: varchar("professor_strictness").notNull(), // chill, moderate, strict
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bunkDecisions: many(bunkDecisions),
  confessions: many(confessions),
  confessionReplies: many(confessionReplies),
  badges: many(userBadges),
}));

export const bunkDecisionsRelations = relations(bunkDecisions, ({ one, many }) => ({
  user: one(users, {
    fields: [bunkDecisions.userId],
    references: [users.id],
  }),
  friendVotes: many(friendVotes),
}));

export const friendVotesRelations = relations(friendVotes, ({ one }) => ({
  decision: one(bunkDecisions, {
    fields: [friendVotes.decisionId],
    references: [bunkDecisions.id],
  }),
}));

export const confessionsRelations = relations(confessions, ({ one, many }) => ({
  user: one(users, {
    fields: [confessions.userId],
    references: [users.id],
  }),
  replies: many(confessionReplies),
}));

export const confessionRepliesRelations = relations(confessionReplies, ({ one }) => ({
  confession: one(confessions, {
    fields: [confessionReplies.confessionId],
    references: [confessions.id],
  }),
  user: one(users, {
    fields: [confessionReplies.userId],
    references: [users.id],
  }),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertBunkDecisionSchema = createInsertSchema(bunkDecisions).omit({
  id: true,
  createdAt: true,
});

export const insertFriendVoteSchema = createInsertSchema(friendVotes).omit({
  id: true,
  createdAt: true,
});

export const insertConfessionSchema = createInsertSchema(confessions).omit({
  id: true,
  likes: true,
  createdAt: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});

export const insertAttendedClassSchema = createInsertSchema(attendedClasses).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type BunkDecision = typeof bunkDecisions.$inferSelect;
export type InsertBunkDecision = z.infer<typeof insertBunkDecisionSchema>;
export type FriendVote = typeof friendVotes.$inferSelect;
export type InsertFriendVote = z.infer<typeof insertFriendVoteSchema>;
export type Confession = typeof confessions.$inferSelect;
export type InsertConfession = z.infer<typeof insertConfessionSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type AttendedClass = typeof attendedClasses.$inferSelect;
export type InsertAttendedClass = z.infer<typeof insertAttendedClassSchema>;
