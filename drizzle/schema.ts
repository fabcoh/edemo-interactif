import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, float } from "drizzle-orm/mysql-core";

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
  role: mysqlEnum("role", ["user", "admin", "commercial"]).default("user").notNull(),
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
 * Presentation collaborators table
 * Allows sharing presentations with other users
 */
export const presentationCollaborators = mysqlTable("presentation_collaborators", {
  id: int("id").autoincrement().primaryKey(),
  /** The presentation being shared */
  sessionId: int("sessionId").notNull(),
  /** The user who owns/created the presentation */
  ownerId: int("ownerId").notNull(),
  /** The user being invited to collaborate */
  collaboratorId: int("collaboratorId").notNull(),
  /** Permission level: view (read-only), edit (can modify documents), control (can control presentation) */
  permission: mysqlEnum("permission", ["view", "edit", "control"]).default("control").notNull(),
  /** Status of the invitation: pending, accepted, rejected */
  status: mysqlEnum("status", ["pending", "accepted", "rejected"]).default("pending").notNull(),
  /** Timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PresentationCollaborator = typeof presentationCollaborators.$inferSelect;
export type InsertPresentationCollaborator = typeof presentationCollaborators.$inferInsert;

/**
 * Presenter Cursor and Zoom table
 * Tracks the presenter's cursor position and zoom level for real-time synchronization with viewers
 */
export const presenterCursors = mysqlTable("presenter_cursors", {
  id: int("id").autoincrement().primaryKey(),
  /** The session this cursor data belongs to */
  sessionId: int("sessionId").notNull(),
  /** Current zoom level (50-200) */
  zoomLevel: int("zoomLevel").default(100).notNull(),
  /** Cursor X position as percentage (0-100) relative to the document width */
  cursorX: float("cursorX").default(0).notNull(),
  /** Cursor Y position as percentage (0-100) relative to the document height */
  cursorY: float("cursorY").default(0).notNull(),
  /** Whether the cursor should be visible */
  cursorVisible: boolean("cursorVisible").default(false).notNull(),
  /** Pan offset X in pixels */
  panOffsetX: float("panOffsetX").default(0).notNull(),
  /** Pan offset Y in pixels */
  panOffsetY: float("panOffsetY").default(0).notNull(),
  /** Timestamps */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PresenterCursor = typeof presenterCursors.$inferSelect;
export type InsertPresenterCursor = typeof presenterCursors.$inferInsert;

/**
 * Viewer Cursors table
 * Tracks viewer cursor positions for real-time display to the presenter
 */
export const viewerCursors = mysqlTable("viewer_cursors", {
  id: int("id").autoincrement().primaryKey(),
  /** The session this cursor data belongs to */
  sessionId: int("sessionId").notNull(),
  /** Unique identifier for the viewer */
  viewerIdentifier: varchar("viewerIdentifier", { length: 64 }).notNull(),
  /** Cursor X position as percentage (0-100) relative to the document width */
  cursorX: float("cursorX").default(0).notNull(),
  /** Cursor Y position as percentage (0-100) relative to the document height */
  cursorY: float("cursorY").default(0).notNull(),
  /** Whether the cursor should be visible */
  cursorVisible: boolean("cursorVisible").default(false).notNull(),
  /** Timestamps */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ViewerCursor = typeof viewerCursors.$inferSelect;
export type InsertViewerCursor = typeof viewerCursors.$inferInsert;


/**
 * Commercial Invitations table
 * Stores invitation tokens for commercial users
 */
export const commercialInvitations = mysqlTable("commercial_invitations", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique invitation token */
  token: varchar("token", { length: 64 }).notNull().unique(),
  /** Email address of the invited commercial */
  email: varchar("email", { length: 320 }).notNull(),
  /** Name of the commercial (optional) */
  name: text("name"),
  /** Whether the invitation has been used */
  used: boolean("used").default(false).notNull(),
  /** User ID if the invitation has been used */
  userId: int("userId"),
  /** Admin who created the invitation */
  createdBy: int("createdBy").notNull(),
  /** Timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  usedAt: timestamp("usedAt"),
});

export type CommercialInvitation = typeof commercialInvitations.$inferSelect;
export type InsertCommercialInvitation = typeof commercialInvitations.$inferInsert;


/**
 * Chat Messages table
 * Stores chat messages for each presentation session
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  /** The session this message belongs to */
  sessionId: int("sessionId").notNull(),
  /** User ID of the sender (presenter) */
  senderId: int("senderId").notNull(),
  /** Message type: text, document, or video_link */
  messageType: mysqlEnum("messageType", ["text", "document", "video_link"]).default("text").notNull(),
  /** Text content of the message */
  content: text("content"),
  /** File URL for document messages */
  fileUrl: text("fileUrl"),
  /** File name for document messages */
  fileName: varchar("fileName", { length: 255 }),
  /** MIME type for document messages */
  mimeType: varchar("mimeType", { length: 100 }),
  /** Timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

