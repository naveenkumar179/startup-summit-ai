import { sql } from "drizzle-orm";
import { index, jsonb, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

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
