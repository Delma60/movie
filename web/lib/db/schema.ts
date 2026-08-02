import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ==========================================================
   ENUMS
   ========================================================== */
export const userRoleEnum = pgEnum("user_role", ["user", "editor", "admin"]);
export const titleStatusEnum = pgEnum("title_status", ["draft", "published"]);
export const titleTypeEnum = pgEnum("title_type", ["movie", "series"]);
export const videoStatusEnum = pgEnum("video_status", [
  "processing",
  "ready",
  "failed",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "canceled",
  "trialing",
]);

/* ==========================================================
   USERS
   ========================================================== */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  passwordHash: text("password_hash"), // null if OAuth-only
  displayName: text("display_name").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  uniqueIndex("users_email_idx").on(t.email),
]);

/* ==========================================================
   TITLES  (movies + series)
   ========================================================== */
export const titles = pgTable("titles", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  synopsis: text("synopsis"),
  type: titleTypeEnum("type").notNull().default("movie"),
  genre: text("genre").notNull(),
  year: integer("year"),
  durationMinutes: integer("duration_minutes"), // movies only; null for series
  rating: text("rating"), // e.g. "16+"
  posterUrl: text("poster_url"),
  backdropUrl: text("backdrop_url"),
  trailerUrl: text("trailer_url"),
  isOriginal: boolean("is_original").notNull().default(false),
  status: titleStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  uniqueIndex("titles_slug_idx").on(t.slug),
  index("titles_status_idx").on(t.status),
]);

/* ==========================================================
   EPISODES  (series only)
   ========================================================== */
export const episodes = pgTable("episodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  titleId: uuid("title_id")
    .notNull()
    .references(() => titles.id, { onDelete: "cascade" }),
  season: integer("season").notNull().default(1),
  episodeNumber: integer("episode_number").notNull(),
  name: text("name").notNull(),
  synopsis: text("synopsis"),
  durationMinutes: integer("duration_minutes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  index("episodes_title_idx").on(t.titleId),
  uniqueIndex("episodes_title_season_ep_idx").on(
    t.titleId,
    t.season,
    t.episodeNumber
  ),
]);

/* ==========================================================
   VIDEO ASSETS  (playable source, attached to a title OR an episode)
   ========================================================== */
export const videoAssets = pgTable("video_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  titleId: uuid("title_id").references(() => titles.id, {
    onDelete: "cascade",
  }),
  episodeId: uuid("episode_id").references(() => episodes.id, {
    onDelete: "cascade",
  }),
  sourceUrl: text("source_url").notNull(),
  status: videoStatusEnum("status").notNull().default("processing"),
  durationSeconds: integer("duration_seconds"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  index("video_assets_title_idx").on(t.titleId),
  index("video_assets_episode_idx").on(t.episodeId),
]);

/* ==========================================================
   WATCH PROGRESS  ("Continue Watching")
   ========================================================== */
export const watchProgress = pgTable("watch_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  titleId: uuid("title_id").references(() => titles.id, {
    onDelete: "cascade",
  }),
  episodeId: uuid("episode_id").references(() => episodes.id, {
    onDelete: "cascade",
  }),
  secondsWatched: integer("seconds_watched").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  index("watch_progress_user_idx").on(t.userId),
  uniqueIndex("watch_progress_user_title_idx").on(t.userId, t.titleId),
  uniqueIndex("watch_progress_user_episode_idx").on(t.userId, t.episodeId),
]);

/*
  STORAGE
*/


export const storageBuckets = pgTable(
  "vert_storage_buckets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull(),
    name: text("name").notNull(),
    public: boolean("public").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("storage_buckets_project_name_idx").on(t.projectId, t.name),
    index("storage_buckets_project_idx").on(t.projectId),
  ],
);

/* ==========================================================
   MY LIST
   ========================================================== */
export const myList = pgTable("my_list", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  titleId: uuid("title_id")
    .notNull()
    .references(() => titles.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.titleId] }),
]);

/* ==========================================================
   SUBSCRIPTIONS
   ========================================================== */
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull(),
  status: subscriptionStatusEnum("status").notNull().default("trialing"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  index("subscriptions_user_idx").on(t.userId),
]);

/* ==========================================================
   RELATIONS
   ========================================================== */
export const usersRelations = relations(users, ({ many }) => ({
  watchProgress: many(watchProgress),
  myList: many(myList),
  subscriptions: many(subscriptions),
}));

export const titlesRelations = relations(titles, ({ many }) => ({
  episodes: many(episodes),
  videoAssets: many(videoAssets),
}));

export const episodesRelations = relations(episodes, ({ one, many }) => ({
  title: one(titles, {
    fields: [episodes.titleId],
    references: [titles.id],
  }),
  videoAssets: many(videoAssets),
}));

export const videoAssetsRelations = relations(videoAssets, ({ one }) => ({
  title: one(titles, {
    fields: [videoAssets.titleId],
    references: [titles.id],
  }),
  episode: one(episodes, {
    fields: [videoAssets.episodeId],
    references: [episodes.id],
  }),
}));

export const watchProgressRelations = relations(watchProgress, ({ one }) => ({
  user: one(users, {
    fields: [watchProgress.userId],
    references: [users.id],
  }),
  title: one(titles, {
    fields: [watchProgress.titleId],
    references: [titles.id],
  }),
  episode: one(episodes, {
    fields: [watchProgress.episodeId],
    references: [episodes.id],
  }),
}));

export const myListRelations = relations(myList, ({ one }) => ({
  user: one(users, { fields: [myList.userId], references: [users.id] }),
  title: one(titles, { fields: [myList.titleId], references: [titles.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));


export type StorageBucket = typeof storageBuckets.$inferSelect;
export type Title = typeof titles.$inferSelect;