import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Presentation sessions table
 * Stores information about each presentation session created by a presenter
 */
export const presentationSessions = mysqlTable("presentation_sessions", {
  id: int("id").autoincrement().primaryKey(),
  /** The user ID of the presenter who created this session */
  presenterId: int("presenterId").notNull(),
  /** Unique session code for sharing via WhatsApp link */
  sessionCode: varchar("sessionCode", { length: 32 }).notNull().unique(),
  /** Session title/name */
  title: varchar("title", { length: 255 }).notNull(),
  /** Is the session currently active/live */
  isActive: boolean("isActive").default(true).notNull(),
  /** Current document being displayed (document ID) */
  currentDocumentId: int("currentDocumentId"),
  /** Current orientation of the displayed document (portrait or landscape) */
  currentOrientation: mysqlEnum("currentOrientation", ["portrait", "landscape"]).default("portrait").notNull(),
  /** Timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PresentationSession = typeof presentationSessions.$inferSelect;
export type InsertPresentationSession = typeof presentationSessions.$inferInsert;

/**
 * Documents table
 * Stores metadata about documents uploaded for presentations
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  /** The session this document belongs to */
  sessionId: int("sessionId").notNull(),
  /** Document title */
  title: varchar("title", { length: 255 }).notNull(),
  /** Document type: pdf, image, video */
  type: mysqlEnum("type", ["pdf", "image", "video"]).notNull(),
  /** S3 storage key for the file */
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  /** Public URL to access the document */
  fileUrl: text("fileUrl").notNull(),
  /** MIME type of the file */
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  /** File size in bytes */
  fileSize: int("fileSize").notNull(),
  /** Display order in the presentation */
  displayOrder: int("displayOrder").notNull(),
  /** Timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Presentation viewers table
 * Tracks which users are viewing a presentation session
 */
export const presentationViewers = mysqlTable("presentation_viewers", {
  id: int("id").autoincrement().primaryKey(),
  /** The session being viewed */
  sessionId: int("sessionId").notNull(),
  /** The user viewing (null for anonymous viewers) */
  userId: int("userId"),
  /** Anonymous viewer identifier (for non-authenticated viewers) */
  viewerIdentifier: varchar("viewerIdentifier", { length: 64 }),
  /** Last activity timestamp */
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
  /** Timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PresentationViewer = typeof presentationViewers.$inferSelect;
export type InsertPresentationViewer = typeof presentationViewers.$inferInsert;



/**
 * Presentation folders/categories table
 * Allows organizing presentations by theme/category
 */
export const presentationFolders = mysqlTable("presentation_folders", {
  id: int("id").autoincrement().primaryKey(),
  /** The user who owns this folder */
  userId: int("userId").notNull(),
  /** Folder name/theme */
  name: varchar("name", { length: 255 }).notNull(),
  /** Folder description */
  description: text("description"),
  /** Folder color for UI display */
  color: varchar("color", { length: 20 }).default("#3B82F6").notNull(),
  /** Timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PresentationFolder = typeof presentationFolders.$inferSelect;
export type InsertPresentationFolder = typeof presentationFolders.$inferInsert;

/**
 * Presenter cursor/pointer tracking table
 * Tracks the presenter's mouse position for viewers to see
 */
export const presenterCursors = mysqlTable("presenter_cursors", {
  id: int("id").autoincrement().primaryKey(),
  /** The session this cursor belongs to */
  sessionId: int("sessionId").notNull(),
  /** X coordinate of the cursor (0-100 percentage) */
  cursorX: int("cursorX").notNull(),
  /** Y coordinate of the cursor (0-100 percentage) */
  cursorY: int("cursorY").notNull(),
  /** Current zoom level */
  zoomLevel: int("zoomLevel").default(100).notNull(),
  /** Pan X offset */
  panX: int("panX").default(0).notNull(),
  /** Pan Y offset */
  panY: int("panY").default(0).notNull(),
  /** Timestamps */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PresenterCursor = typeof presenterCursors.$inferSelect;
export type InsertPresenterCursor = typeof presenterCursors.$inferInsert;

