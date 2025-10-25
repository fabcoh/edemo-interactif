import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, presentationSessions, documents, presentationViewers, presentationCollaborators, presenterCursors, viewerCursors, commercialInvitations, PresentationSession, Document, PresenterCursor, ViewerCursor, CommercialInvitation, InsertCommercialInvitation } from "../drizzle/schema";
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

/**
 * Update presentation session title
 */
export async function updateSessionTitle(
  sessionId: number,
  title: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(presentationSessions)
    .set({
      title,
      updatedAt: new Date(),
    })
    .where(eq(presentationSessions.id, sessionId));
}

/**
 * Update collaborator permission
 */
export async function updateCollaboratorPermission(
  collaboratorId: number,
  sessionId: number,
  permission: "view" | "edit" | "control"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(presentationCollaborators)
    .set({
      permission,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(presentationCollaborators.id, collaboratorId),
        eq(presentationCollaborators.sessionId, sessionId)
      )
    );
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




/**
 * Invite a collaborator to a presentation
 */
export async function inviteCollaborator(
  sessionId: number,
  ownerId: number,
  collaboratorEmail: string,
  permission: "view" | "edit" | "control" = "control"
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Find the collaborator by email
  const collaborator = await db
    .select()
    .from(users)
    .where(eq(users.email, collaboratorEmail))
    .limit(1);

  if (collaborator.length === 0) {
    throw new Error("User not found with this email");
  }

  const collaboratorId = collaborator[0].id;

  // Check if already invited
  const existing = await db
    .select()
    .from(presentationCollaborators)
    .where(
      and(
        eq(presentationCollaborators.sessionId, sessionId),
        eq(presentationCollaborators.collaboratorId, collaboratorId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("This user is already invited to this presentation");
  }

  // Create invitation
  await db.insert(presentationCollaborators).values({
    sessionId,
    ownerId,
    collaboratorId,
    permission,
    status: "accepted", // Auto-accept for simplicity
  });
}

/**
 * Get collaborators for a presentation
 */
export async function getPresentationCollaborators(sessionId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: presentationCollaborators.id,
      collaboratorId: presentationCollaborators.collaboratorId,
      name: users.name,
      email: users.email,
      permission: presentationCollaborators.permission,
      status: presentationCollaborators.status,
    })
    .from(presentationCollaborators)
    .innerJoin(users, eq(presentationCollaborators.collaboratorId, users.id))
    .where(eq(presentationCollaborators.sessionId, sessionId));

  return result;
}

/**
 * Get presentations shared with a user
 */
export async function getSharedPresentations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: presentationSessions.id,
      title: presentationSessions.title,
      sessionCode: presentationSessions.sessionCode,
      isActive: presentationSessions.isActive,
      currentDocumentId: presentationSessions.currentDocumentId,
      currentOrientation: presentationSessions.currentOrientation,
      createdAt: presentationSessions.createdAt,
      permission: presentationCollaborators.permission,
      ownerName: users.name,
    })
    .from(presentationCollaborators)
    .innerJoin(presentationSessions, eq(presentationCollaborators.sessionId, presentationSessions.id))
    .innerJoin(users, eq(presentationSessions.presenterId, users.id))
    .where(
      and(
        eq(presentationCollaborators.collaboratorId, userId),
        eq(presentationCollaborators.status, "accepted")
      )
    );

  return result;
}

/**
 * Remove a collaborator from a presentation
 */
export async function removeCollaborator(sessionId: number, collaboratorId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .delete(presentationCollaborators)
    .where(
      and(
        eq(presentationCollaborators.sessionId, sessionId),
        eq(presentationCollaborators.collaboratorId, collaboratorId)
      )
    );
}




// ============ PRESENTER CURSOR & ZOOM QUERIES ============

/**
 * Update or create presenter cursor and zoom data for a session
 */
export async function updatePresenterCursor(
  sessionId: number,
  zoomLevel: number,
  cursorX: number,
  cursorY: number,
  cursorVisible: boolean,
  panOffsetX: number,
  panOffsetY: number
): Promise<PresenterCursor> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Check if cursor data exists for this session
  const existing = await db
    .select()
    .from(presenterCursors)
    .where(eq(presenterCursors.sessionId, sessionId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing record
    await db
      .update(presenterCursors)
      .set({
        zoomLevel,
        cursorX,
        cursorY,
        cursorVisible,
        panOffsetX,
        panOffsetY,
        updatedAt: new Date(),
      })
      .where(eq(presenterCursors.sessionId, sessionId));

    return {
      ...existing[0],
      zoomLevel,
      cursorX,
      cursorY,
      cursorVisible,
      panOffsetX,
      panOffsetY,
      updatedAt: new Date(),
    };
  } else {
    // Create new record
    await db.insert(presenterCursors).values({
      sessionId,
      zoomLevel,
      cursorX,
      cursorY,
      cursorVisible,
      panOffsetX,
      panOffsetY,
    });

    const result = await db
      .select()
      .from(presenterCursors)
      .where(eq(presenterCursors.sessionId, sessionId))
      .limit(1);

    return result[0];
  }
}

/**
 * Get presenter cursor and zoom data for a session
 */
export async function getPresenterCursor(sessionId: number): Promise<PresenterCursor | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(presenterCursors)
    .where(eq(presenterCursors.sessionId, sessionId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}



/**
 * Update or create a viewer cursor position
 */
export async function updateViewerCursor(
  sessionId: number,
  viewerIdentifier: string,
  cursorX: number,
  cursorY: number,
  cursorVisible: boolean
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Check if cursor exists
  const existing = await db
    .select()
    .from(viewerCursors)
    .where(
      and(
        eq(viewerCursors.sessionId, sessionId),
        eq(viewerCursors.viewerIdentifier, viewerIdentifier)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing cursor
    await db
      .update(viewerCursors)
      .set({
        cursorX,
        cursorY,
        cursorVisible,
        updatedAt: new Date(),
      })
      .where(eq(viewerCursors.id, existing[0].id));
  } else {
    // Insert new cursor
    await db.insert(viewerCursors).values({
      sessionId,
      viewerIdentifier,
      cursorX,
      cursorY,
      cursorVisible,
    });
  }
}

/**
 * Get all viewer cursors for a session
 */
export async function getViewerCursors(sessionId: number): Promise<ViewerCursor[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(viewerCursors)
    .where(eq(viewerCursors.sessionId, sessionId));

  return result;
}



/**
 * Create a commercial access link
 */
export async function createCommercialInvitation(
  name: string,
  createdBy: number
): Promise<CommercialInvitation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate a unique token
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

  const [invitation] = await db.insert(commercialInvitations).values({
    token,
    name,
    createdBy,
    revoked: false,
  });

  const [created] = await db
    .select()
    .from(commercialInvitations)
    .where(eq(commercialInvitations.id, Number(invitation.insertId)));

  return created;
}

/**
 * Get all commercial invitations (admin only)
 */
export async function getAllCommercialInvitations(): Promise<CommercialInvitation[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(commercialInvitations);
}

/**
 * Get a commercial invitation by token
 */
export async function getCommercialInvitationByToken(token: string): Promise<CommercialInvitation | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [invitation] = await db
    .select()
    .from(commercialInvitations)
    .where(eq(commercialInvitations.token, token));

  return invitation || null;
}

/**
 * Update last used timestamp for commercial link
 */
export async function updateCommercialLinkLastUsed(token: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(commercialInvitations)
    .set({ lastUsedAt: new Date() })
    .where(eq(commercialInvitations.token, token));
}

/**
 * Revoke a commercial access link
 */
export async function revokeCommercialLink(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(commercialInvitations)
    .set({ revoked: true })
    .where(eq(commercialInvitations.id, id));
}

/**
 * Delete a commercial invitation
 */
export async function deleteCommercialInvitation(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(commercialInvitations).where(eq(commercialInvitations.id, id));
}

