import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["founder", "investor", "admin"]);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable(
  "users",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    email: varchar("email").unique(),
    firstName: varchar("first_name"),
    lastName: varchar("last_name"),
    profileImageUrl: varchar("profile_image_url"),
    role: userRoleEnum("role"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("IDX_users_role").on(table.role)]
);

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];

export const pitchDeckStatusEnum = pgEnum("pitch_deck_status", [
  "processing",
  "analyzed",
  "failed",
]);

export const pitchDecks = pgTable(
  "pitch_decks",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fileName: varchar("file_name").notNull(),
    extractedText: text("extracted_text"),
    status: pitchDeckStatusEnum("status").notNull().default("processing"),
    analysis: jsonb("analysis").$type<PitchDeckAnalysis>(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("IDX_pitch_decks_user").on(table.userId)]
);

export type PitchDeck = typeof pitchDecks.$inferSelect;
export type InsertPitchDeck = typeof pitchDecks.$inferInsert;

export type PitchDeckAnalysis = {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  categories: {
    name: string;
    score: number;
    feedback: string;
  }[];
  suggestedInvestorTypes: string[];
};

export const startupStageEnum = pgEnum("startup_stage", [
  "idea",
  "pre_seed",
  "seed",
  "series_a",
  "series_b_plus",
]);

export const founderProfiles = pgTable("founder_profiles", {
  userId: varchar("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("company_name").notNull(),
  industry: varchar("industry").notNull(),
  stage: startupStageEnum("stage").notNull(),
  fundingAsk: varchar("funding_ask"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type FounderProfile = typeof founderProfiles.$inferSelect;
export type InsertFounderProfile = typeof founderProfiles.$inferInsert;

export const investorProfiles = pgTable("investor_profiles", {
  userId: varchar("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  firmName: varchar("firm_name"),
  industries: text("industries").array().notNull().default(sql`'{}'::text[]`),
  stagePreferences: startupStageEnum("stage_preferences").array().notNull().default(sql`'{}'::startup_stage[]`),
  checkSizeMin: varchar("check_size_min"),
  checkSizeMax: varchar("check_size_max"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type InvestorProfile = typeof investorProfiles.$inferSelect;
export type InsertInvestorProfile = typeof investorProfiles.$inferInsert;

export const conversations = pgTable(
  "conversations",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    founderId: varchar("founder_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    investorId: varchar("investor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_conversations_founder").on(table.founderId),
    index("IDX_conversations_investor").on(table.investorId),
    index("IDX_conversations_pair").on(table.founderId, table.investorId),
  ]
);

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

export const messages = pgTable(
  "messages",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    conversationId: varchar("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: varchar("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("IDX_messages_conversation").on(table.conversationId)]
);

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export const startupStatusEnum = pgEnum("startup_status", ["draft", "published"]);

export type DetailedAnalysis = {
  investmentReadinessScore: number;
  recommendation: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  businessModelAnalysis: string;
  marketOpportunity: string;
  competitorAnalysis: string;
  riskAnalysis: string[];
  financialAnalysis: string;
  growthPotential: string;
};

export type ImprovementSuggestion = {
  area: string;
  issue: string;
  suggestion: string;
  example: string;
};

export const startups = pgTable(
  "startups",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    founderId: varchar("founder_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name").notNull(),
    tagline: varchar("tagline"),
    industry: varchar("industry").notNull(),
    description: text("description"),
    businessModel: text("business_model"),
    stage: startupStageEnum("stage").notNull().default("idea"),
    fundingRequired: varchar("funding_required"),
    location: varchar("location"),
    website: varchar("website"),
    foundingYear: varchar("founding_year"),
    teamSize: varchar("team_size"),
    revenue: varchar("revenue"),
    customers: varchar("customers"),
    logoUrl: text("logo_url"),
    pitchDeckId: varchar("pitch_deck_id").references(() => pitchDecks.id, { onDelete: "set null" }),
    status: startupStatusEnum("status").notNull().default("draft"),
    detailedAnalysis: jsonb("detailed_analysis").$type<DetailedAnalysis>(),
    improvementSuggestions: jsonb("improvement_suggestions").$type<ImprovementSuggestion[]>(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_startups_founder").on(table.founderId),
    index("IDX_startups_status").on(table.status),
  ]
);

export type Startup = typeof startups.$inferSelect;
export type InsertStartup = typeof startups.$inferInsert;

export const watchlist = pgTable(
  "watchlist",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    investorId: varchar("investor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startupId: varchar("startup_id")
      .notNull()
      .references(() => startups.id, { onDelete: "cascade" }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_watchlist_investor").on(table.investorId),
    index("IDX_watchlist_pair").on(table.investorId, table.startupId),
  ]
);

export type WatchlistItem = typeof watchlist.$inferSelect;
export type InsertWatchlistItem = typeof watchlist.$inferInsert;

export const meetingStatusEnum = pgEnum("meeting_status", [
  "pending",
  "confirmed",
  "declined",
  "cancelled",
  "completed",
]);

export const meetings = pgTable(
  "meetings",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    startupId: varchar("startup_id")
      .notNull()
      .references(() => startups.id, { onDelete: "cascade" }),
    founderId: varchar("founder_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    investorId: varchar("investor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scheduledAt: timestamp("scheduled_at").notNull(),
    durationMinutes: varchar("duration_minutes").notNull().default("30"),
    agenda: text("agenda"),
    status: meetingStatusEnum("status").notNull().default("pending"),
    meetingLink: text("meeting_link"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_meetings_founder").on(table.founderId),
    index("IDX_meetings_investor").on(table.investorId),
    index("IDX_meetings_startup").on(table.startupId),
  ]
);

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

export const notificationTypeEnum = pgEnum("notification_type", [
  "meeting_requested",
  "meeting_confirmed",
  "meeting_declined",
  "meeting_cancelled",
  "message_received",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title").notNull(),
    body: text("body"),
    link: varchar("link"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_notifications_user").on(table.userId),
    index("IDX_notifications_user_read").on(table.userId, table.isRead),
  ]
);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
