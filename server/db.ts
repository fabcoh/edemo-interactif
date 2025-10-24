import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, presentationSessions, documents, presentationViewers, PresentationSession, Document } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ PRESENTATION SESSION QUERIES ============

/**
 * Create a new presentation session
 */
export async function createPresentationSession(
  presenterId: number,
  title: string,
  sessionCode: string
): Promise<PresentationSession> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(presentationSessions).values({
    presenterId,
    title,
    sessionCode,
    isActive: true,
    currentOrientation: "portrait",
  });

  const sessions = await db
    .select()
    .from(presentationSessions)
    .where(eq(presentationSessions.sessionCode, sessionCode))
    .limit(1);

  if (sessions.length === 0) throw new Error("Failed to create session");
  return sessions[0];
}

/**
 * Get a presentation session by session code
 */
export async function getPresentationSessionByCode(
  sessionCode: string
): Promise<PresentationSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(presentationSessions)
    .where(eq(presentationSessions.sessionCode, sessionCode))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all presentation sessions for a presenter
 */
export async function getPresentationSessionsByPresenter(
  presenterId: number
): Promise<PresentationSession[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(presentationSessions)
    .where(eq(presentationSessions.presenterId, presenterId));
}

/**
 * Update current document and orientation for a session
 */
export async function updateSessionCurrentDocument(
  sessionId: number,
  documentId: number | null,
  orientation: "portrait" | "landscape"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(presentationSessions)
    .set({
      currentDocumentId: documentId,
      currentOrientation: orientation,
      updatedAt: new Date(),
    })
    .where(eq(presentationSessions.id, sessionId));
}

/**
 * Update session active status
 */
export async function updateSessionActiveStatus(
  sessionId: number,
  isActive: boolean
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(presentationSessions)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(presentationSessions.id, sessionId));
}

// ============ DOCUMENT QUERIES ============

/**
 * Add a document to a presentation session
 */
export async function addDocumentToSession(
  sessionId: number,
  title: string,
  type: "pdf" | "image" | "video",
  fileKey: string,
  fileUrl: string,
  mimeType: string,
  fileSize: number,
  displayOrder: number
): Promise<Document> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(documents).values({
    sessionId,
    title,
    type,
    fileKey,
    fileUrl,
    mimeType,
    fileSize,
    displayOrder,
  });

  const result = await db
    .select()
    .from(documents)
    .where(and(eq(documents.sessionId, sessionId), eq(documents.fileKey, fileKey)))
    .limit(1);

  if (result.length === 0) throw new Error("Failed to add document");
  return result[0];
}

/**
 * Get all documents for a session
 */
export async function getSessionDocuments(sessionId: number): Promise<Document[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(documents)
    .where(eq(documents.sessionId, sessionId));
}

/**
 * Get a specific document
 */
export async function getDocument(documentId: number): Promise<Document | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(documents).where(eq(documents.id, documentId));
}

/**
 * Update document display order
 */
export async function updateDocumentOrder(
  documentId: number,
  displayOrder: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(documents)
    .set({
      displayOrder,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId));
}

// ============ VIEWER TRACKING ============

/**
 * Record a viewer for a presentation session
 */
export async function recordPresentationViewer(
  sessionId: number,
  userId?: number,
  viewerIdentifier?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(presentationViewers).values({
    sessionId,
    userId,
    viewerIdentifier,
  });
}

/**
 * Update viewer's last activity
 */
export async function updateViewerActivity(viewerId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Implementation would update last activity timestamp
  // For now, we'll keep it simple
}

/**
 * Get active viewers count for a session
 */
export async function getSessionViewersCount(sessionId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(presentationViewers)
    .where(eq(presentationViewers.sessionId, sessionId));

  return result.length;
}

