import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createPresentationSession,
  getPresentationSessionByCode,
  getPresentationSessionsByPresenter,
  updateSessionCurrentDocument,
  updateSessionActiveStatus,
  updateSessionTitle,
  updateCollaboratorPermission,
  addDocumentToSession,
  getSessionDocuments,
  getDocument,
  deleteDocument,
  updateDocumentOrder,
  recordPresentationViewer,
  getSessionViewersCount,
  inviteCollaborator,
  getPresentationCollaborators,
  getSharedPresentations,
  removeCollaborator,
  updatePresenterCursor,
  getPresenterCursor,
  updateViewerCursor,
  getViewerCursors,
  createCommercialInvitation,
  getAllCommercialInvitations,
  sendChatMessage,
  getChatMessages,
  deleteAllChatMessages,
  getCommercialInvitationByToken,
  updateCommercialLinkLastUsed,
  revokeCommercialLink,
  deleteCommercialInvitation,
  getPresenterPin,
  updatePresenterPin,
} from "./db";
import { storagePut, storageGet } from "./storage";
import { TRPCError } from "@trpc/server";

// Utility to generate unique session codes
function generateSessionCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Utility to generate unique file keys
function generateFileKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Centralized file upload utility
 * Handles base64 conversion and storage upload
 * Use this for ALL file uploads (documents, chat, etc.)
 * @param fileData - Base64 encoded file data (with or without data URL prefix)
 * @param fileName - Original file name
 * @param mimeType - File MIME type
 * @param prefix - Storage path prefix (e.g., 'presentations/123', 'chat/456')
 * @returns Object with file key and public URL
 */
async function uploadFileToStorage(
  fileData: string,
  fileName: string,
  mimeType: string,
  prefix: string
): Promise<{ key: string; url: string; size: number }> {
  // Convert base64 to buffer
  // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
  const base64Data = fileData.includes('base64,') 
    ? fileData.split('base64,')[1] 
    : fileData;
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Generate unique file key
  const fileKey = generateFileKey(`${prefix}/${fileName}`);
  
  // Upload to storage (S3)
  const { url } = await storagePut(fileKey, buffer, mimeType);
  
  return { key: fileKey, url, size: buffer.length };
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    /**
     * Get presenter PIN code (public access for login)
     */
    getPresenterPin: publicProcedure
      .query(async () => {
        const pin = await getPresenterPin();
        return { pin };
      }),
  }),

  // ============ PRESENTATION SESSION ROUTES ============

  presentation: router({
    /**
     * Create a new presentation session
     * Only authenticated users can create sessions
     */
    createSession: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
      }))
      .mutation(async ({ ctx, input }) => {
        const sessionCode = generateSessionCode();
        const session = await createPresentationSession(
          ctx.user.id,
          input.title,
          sessionCode
        );
        return {
          id: session.id,
          sessionCode: session.sessionCode,
          title: session.title,
          isActive: session.isActive,
        };
      }),

    /**
     * Get all sessions for the current presenter or specified user
     */
    getSessions: protectedProcedure
      .input(z.object({
        userId: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        // Use specified userId or current user's ID
        const targetUserId = input?.userId || ctx.user.id;
        const sessions = await getPresentationSessionsByPresenter(targetUserId);
        return sessions.map(s => ({
          id: s.id,
          title: s.title,
          sessionCode: s.sessionCode,
          isActive: s.isActive,
          currentDocumentId: s.currentDocumentId,
          currentOrientation: s.currentOrientation,
          createdAt: s.createdAt,
        }));
      }),

    /**
     * Get a specific session by code (for viewers)
     * Public access - anyone with the code can view
     */
    getSessionByCode: publicProcedure
      .input(z.object({
        sessionCode: z.string(),
      }))
      .query(async ({ input }) => {
        const session = await getPresentationSessionByCode(input.sessionCode);
        if (!session || !session.isActive) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found or inactive",
          });
        }

        // Get current document if one is selected
        let currentDocument = null;
        if (session.currentDocumentId) {
          currentDocument = await getDocument(session.currentDocumentId);
        }

        return {
          id: session.id,
          title: session.title,
          sessionCode: session.sessionCode,
          currentDocument: currentDocument ? {
            id: currentDocument.id,
            title: currentDocument.title,
            type: currentDocument.type,
            fileUrl: currentDocument.fileUrl,
            mimeType: currentDocument.mimeType,
          } : null,
          currentOrientation: session.currentOrientation,
        };
      }),

    /**
     * Update current document being displayed
     * Only the presenter can update
     */
    updateCurrentDocument: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        documentId: z.number().nullable(),
        orientation: z.enum(["portrait", "landscape"]),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify the user owns this session
        const sessions = await getPresentationSessionsByPresenter(ctx.user.id);
        const sessionExists = sessions.some(s => s.id === input.sessionId);
        
        if (!sessionExists) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to update this session",
          });
        }

        await updateSessionCurrentDocument(
          input.sessionId,
          input.documentId,
          input.orientation
        );

        return { success: true };
      }),

    /**
     * End a presentation session
     */
    endSession: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const sessions = await getPresentationSessionsByPresenter(ctx.user.id);
        const sessionExists = sessions.some(s => s.id === input.sessionId);
        
        if (!sessionExists) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to end this session",
          });
        }

        await updateSessionActiveStatus(input.sessionId, false);
        return { success: true };
      }),

    /**
     * Toggle session active status
     */
    toggleSessionActive: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const sessions = await getPresentationSessionsByPresenter(ctx.user.id);
        const session = sessions.find(s => s.id === input.sessionId);
        
        if (!session) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to update this session",
          });
        }

        // Toggle the current status
        const newStatus = !session.isActive;
        await updateSessionActiveStatus(input.sessionId, newStatus);
        
        return { 
          success: true,
          isActive: newStatus,
        };
      }),

    /**
     * Get viewer count for a session
     */
    getViewerCount: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const sessions = await getPresentationSessionsByPresenter(ctx.user.id);
        const sessionExists = sessions.some(s => s.id === input.sessionId);
        
        if (!sessionExists) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to view this session",
          });
        }

        const count = await getSessionViewersCount(input.sessionId);
        return { count };
      }),

    updateZoomAndCursor: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        zoomLevel: z.number().min(50).max(200),
        cursorX: z.number(),
        cursorY: z.number(),
        cursorVisible: z.boolean(),
        panOffsetX: z.number(),
        panOffsetY: z.number(),
        rectangleX: z.number().optional(),
        rectangleY: z.number().optional(),
        rectangleWidth: z.number().optional(),
        rectangleHeight: z.number().optional(),
        rectangleVisible: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const sessions = await getPresentationSessionsByPresenter(ctx.user.id);
        const sessionExists = sessions.some(s => s.id === input.sessionId);
        
        if (!sessionExists) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to update this session",
          });
        }

        const cursor = await updatePresenterCursor(
          input.sessionId,
          input.zoomLevel,
          input.cursorX,
          input.cursorY,
          input.cursorVisible,
          input.panOffsetX,
          input.panOffsetY,
          input.rectangleX,
          input.rectangleY,
          input.rectangleWidth,
          input.rectangleHeight,
          input.rectangleVisible
        );

        return { success: true };
      }),

    getCursorAndZoom: publicProcedure
      .input(z.object({
        sessionCode: z.string(),
      }))
      .query(async ({ input }) => {
        const session = await getPresentationSessionByCode(input.sessionCode);
        if (!session) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found",
          });
        }

        const cursor = await getPresenterCursor(session.id);
        if (!cursor) {
          return {
            zoomLevel: 100,
            cursorX: 0,
            cursorY: 0,
            cursorVisible: false,
            panOffsetX: 0,
            panOffsetY: 0,
            rectangleX: 0,
            rectangleY: 0,
            rectangleWidth: 0,
            rectangleHeight: 0,
            rectangleVisible: false,
          };
        }

        return {
          zoomLevel: cursor.zoomLevel,
          cursorX: cursor.cursorX,
          cursorY: cursor.cursorY,
          cursorVisible: cursor.cursorVisible,
          panOffsetX: cursor.panOffsetX,
          panOffsetY: cursor.panOffsetY,
          rectangleX: cursor.rectangleX || 0,
          rectangleY: cursor.rectangleY || 0,
          rectangleWidth: cursor.rectangleWidth || 0,
          rectangleHeight: cursor.rectangleHeight || 0,
          rectangleVisible: cursor.rectangleVisible || false,
        };
      }),
  }),

  // ============ DOCUMENT ROUTES ============

  documents: router({
    /**
     * Upload a document to a session
     * Supports PDF, images, and videos
     */
    uploadDocument: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        title: z.string().min(1).max(255),
        type: z.enum(["pdf", "image", "video"]),
        fileData: z.string(), // base64 encoded file data
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify the user owns this session
        const sessions = await getPresentationSessionsByPresenter(ctx.user.id);
        const sessionExists = sessions.some(s => s.id === input.sessionId);
        
        if (!sessionExists) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to upload to this session",
          });
        }

        try {
          // Upload file using centralized utility
          const { key: fileKey, url, size } = await uploadFileToStorage(
            input.fileData,
            input.fileName,
            input.mimeType,
            `presentations/${input.sessionId}/${input.type}`
          );
          
          // Get existing documents count to determine display order
          const existingDocs = await getSessionDocuments(input.sessionId);
          const displayOrder = existingDocs.length;
          
          // Add to database
          const document = await addDocumentToSession(
            input.sessionId,
            input.title,
            input.type,
            fileKey,
            url,
            input.mimeType,
            size,
            displayOrder
          );

          return {
            id: document.id,
            title: document.title,
            type: document.type,
            fileUrl: document.fileUrl,
            displayOrder: document.displayOrder,
          };
        } catch (error) {
          console.error("Document upload error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to upload document",
          });
        }
      }),

    /**
     * Get all documents for a session
     */
    getSessionDocuments: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const sessions = await getPresentationSessionsByPresenter(ctx.user.id);
        const sessionExists = sessions.some(s => s.id === input.sessionId);
        
        if (!sessionExists) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to view this session",
          });
        }

        const docs = await getSessionDocuments(input.sessionId);
        return docs.map(d => ({
          id: d.id,
          title: d.title,
          type: d.type,
          fileUrl: d.fileUrl,
          mimeType: d.mimeType,
          displayOrder: d.displayOrder,
        }));
      }),

    /**
     * Delete a document
     */
    deleteDocument: protectedProcedure
      .input(z.object({
        documentId: z.number(),
        sessionId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const sessions = await getPresentationSessionsByPresenter(ctx.user.id);
        const sessionExists = sessions.some(s => s.id === input.sessionId);
        
        if (!sessionExists) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to delete from this session",
          });
        }

        const doc = await getDocument(input.documentId);
        if (!doc || doc.sessionId !== input.sessionId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Document not found",
          });
        }

        await deleteDocument(input.documentId);
        return { success: true };
      }),

    /**
     * Reorder documents in a session
     */
    reorderDocuments: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        documentIds: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        const sessions = await getPresentationSessionsByPresenter(ctx.user.id);
        const sessionExists = sessions.some(s => s.id === input.sessionId);
        
        if (!sessionExists) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to reorder documents in this session",
          });
        }

        // Update display order for each document
        for (let i = 0; i < input.documentIds.length; i++) {
          await updateDocumentOrder(input.documentIds[i], i);
        }

        return { success: true };
      }),
  }),

  // ============ VIEWER ROUTES ============

  viewer: router({
    /**
     * Record that a user is viewing a presentation
     * Public access - anyone can join with a session code
     */
    joinSession: publicProcedure
      .input(z.object({
        sessionCode: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await getPresentationSessionByCode(input.sessionCode);
        if (!session || !session.isActive) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found or inactive",
          });
        }

        // Record the viewer
        const viewerIdentifier = `viewer-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        await recordPresentationViewer(
          session.id,
          ctx.user?.id,
          viewerIdentifier
        );

        return {
          sessionId: session.id,
          viewerIdentifier,
        };
      }),

    /**
     * Update viewer cursor position
     * Public access - viewers can update their cursor
     */
    updateCursor: publicProcedure
      .input(z.object({
        sessionCode: z.string(),
        viewerIdentifier: z.string(),
        cursorX: z.number(),
        cursorY: z.number(),
        cursorVisible: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        const session = await getPresentationSessionByCode(input.sessionCode);
        if (!session) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found",
          });
        }

        await updateViewerCursor(
          session.id,
          input.viewerIdentifier,
          input.cursorX,
          input.cursorY,
          input.cursorVisible
        );

        return { success: true };
      }),

    /**
     * Set current document from viewer (spectateur peut changer le document affiché)
     * Public access - viewers can change the displayed document
     */
    setCurrentDocument: publicProcedure
      .input(z.object({
        sessionCode: z.string(),
        documentUrl: z.string(),
        documentName: z.string(),
        documentType: z.enum(["image", "pdf", "video"]),
      }))
      .mutation(async ({ input }) => {
        const session = await getPresentationSessionByCode(input.sessionCode);
        if (!session) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found",
          });
        }

        // Trouver le document dans la session par son URL
        const documents = await getSessionDocuments(session.id);
        let doc = documents.find(d => d.fileUrl === input.documentUrl);
        
        // Si le document n'existe pas, le créer temporairement
        if (!doc) {
          const newDoc = await addDocumentToSession(
            session.id,
            input.documentName,
            input.documentType,
            "chat-upload", // fileKey
            input.documentUrl,
            input.documentType === 'pdf' ? 'application/pdf' : input.documentType === 'video' ? 'video/mp4' : 'image/jpeg', // mimeType
            0, // fileSize (inconnu)
            documents.length // displayOrder
          );
          doc = newDoc;
        }
        
        // Mettre à jour le document actuel de la session
        await updateSessionCurrentDocument(
          session.id,
          doc.id,
          "portrait" // Orientation par défaut
        );

        return { success: true };
      }),

    /**
     * Get all viewer cursors for a session (for presenter)
     * Public access - anyone can see viewer cursors
     */
    getCursors: publicProcedure
      .input(z.object({
        sessionCode: z.string(),
      }))
      .query(async ({ input }) => {
        const session = await getPresentationSessionByCode(input.sessionCode);
        if (!session) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found",
          });
        }

        const cursors = await getViewerCursors(session.id);
        return cursors.map(c => ({
          viewerIdentifier: c.viewerIdentifier,
          cursorX: c.cursorX,
          cursorY: c.cursorY,
          cursorVisible: c.cursorVisible,
        }));
      }),
  }),

  // ============ COLLABORATION ROUTES ============

  collaboration: router({
    /**
     * Invite a collaborator to a presentation
     */
    inviteCollaborator: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        collaboratorEmail: z.string().email(),
        permission: z.enum(["view", "edit", "control"]).default("control"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify the user owns the presentation
        const sessions = await getPresentationSessionsByPresenter(ctx.user.id);
        const sessionExists = sessions.some(s => s.id === input.sessionId);
        
        if (!sessionExists) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to share this presentation",
          });
        }

        await inviteCollaborator(
          input.sessionId,
          ctx.user.id,
          input.collaboratorEmail,
          input.permission
        );

        return { success: true };
      }),

    /**
     * Get collaborators for a presentation
     */
    getCollaborators: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        // Verify the user owns the presentation
        const sessions = await getPresentationSessionsByPresenter(ctx.user.id);
        const sessionExists = sessions.some(s => s.id === input.sessionId);
        
        if (!sessionExists) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to view collaborators",
          });
        }

        return await getPresentationCollaborators(input.sessionId);
      }),

    /**
     * Get presentations shared with the current user
     */
    getSharedPresentations: protectedProcedure
      .query(async ({ ctx }) => {
        return await getSharedPresentations(ctx.user.id);
      }),

    /**
     * Remove a collaborator from a presentation
     */
    removeCollaborator: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        collaboratorId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify the user owns the presentation
        const sessions = await getPresentationSessionsByPresenter(ctx.user.id);
        const sessionExists = sessions.some(s => s.id === input.sessionId);
        
        if (!sessionExists) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to remove collaborators",
          });
        }

        await removeCollaborator(input.sessionId, input.collaboratorId);
        return { success: true };
      }),

    /**
     * Update collaborator permission
     */
    updateCollaboratorPermission: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        collaboratorId: z.number(),
        permission: z.enum(["view", "edit", "control"]),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify the user owns the presentation
        const sessions = await getPresentationSessionsByPresenter(ctx.user.id);
        const sessionExists = sessions.some(s => s.id === input.sessionId);
        
        if (!sessionExists) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to update collaborator permissions",
          });
        }

        await updateCollaboratorPermission(input.collaboratorId, input.sessionId, input.permission);
        return { success: true };
      }),
  }),

  // ============ ADMIN ROUTES ============

  admin: router({
    /**
     * Create a commercial invitation (admin only)
     */
    createCommercialInvitation: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        firstName: z.string().optional(),
        photoUrl: z.string().url().optional().or(z.literal("")),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can create commercial links",
          });
        }

        const link = await createCommercialInvitation(
          input.name,
          ctx.user.id,
          input.firstName,
          input.photoUrl,
          input.phone,
          input.email
        );

        return {
          id: link.id,
          token: link.token,
          name: link.name,
          accessLink: `${process.env.VITE_APP_URL || "https://3000-ih44u8onzba9v1o4wiete-6d7b15e5.manusvm.computer"}/commercial/${link.token}`,
        };
      }),

    /**
     * Get all commercial invitations (admin only)
     */
    getCommercialInvitations: protectedProcedure
      .query(async ({ ctx }) => {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can view commercial invitations",
          });
        }

        return await getAllCommercialInvitations();
      }),

    /**
     * Delete a commercial invitation (admin only)
     */
    deleteCommercialInvitation: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can delete commercial invitations",
          });
        }

        await deleteCommercialInvitation(input.id);
        return { success: true };
      }),

    /**
     * Get presenter PIN code (admin only)
     */
    getPresenterPin: protectedProcedure
      .query(async ({ ctx }) => {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can view PIN settings",
          });
        }

        const { getPresenterPin } = await import("./db");
        const pin = await getPresenterPin();
        return { pin };
      }),

    /**
     * Update presenter PIN code (admin only)
     */
    updatePresenterPin: protectedProcedure
      .input(z.object({
        pin: z.string().min(4).max(20),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can update PIN settings",
          });
        }

        const { updatePresenterPin } = await import("./db");
        await updatePresenterPin(input.pin);
        return { success: true };
      }),
  }),

  // ============ INVITATION ROUTES ============

  invitation: router({
    /**
     * Verify commercial access link (public)
     */
    verifyCommercialLink: publicProcedure
      .input(z.object({
        token: z.string(),
      }))
      .query(async ({ input }) => {
        const link = await getCommercialInvitationByToken(input.token);
        
        if (!link) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Lien d'accès non trouvé",
          });
        }

        if (link.revoked) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Ce lien d'accès a été révoqué",
          });
        }

        // Update last used timestamp
        await updateCommercialLinkLastUsed(input.token);

        return {
          name: link.name,
          createdBy: link.createdBy,
          valid: true,
        };
      }),
  }),

  presentationSettings: router({
    /**
     * Update presentation title
     */
    updateTitle: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        title: z.string().min(1).max(255),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify the user owns the presentation
        const sessions = await getPresentationSessionsByPresenter(ctx.user.id);
        const sessionExists = sessions.some(s => s.id === input.sessionId);
        
        if (!sessionExists) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to update this presentation",
          });
        }

        await updateSessionTitle(input.sessionId, input.title);
        return { success: true };
      }),
  }),

  chat: router({
    /**
     * Get all messages for a session
     */
    getMessages: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        return await getChatMessages(input.sessionId);
      }),

    /**
     * Send a message
     */
    sendMessage: publicProcedure
      .input(z.object({
        sessionId: z.number(),
        senderType: z.enum(["presenter", "viewer"]),
        senderName: z.string(),
        message: z.string(),
        videoUrl: z.string().optional(),
        fileType: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await sendChatMessage(input);
        return { success: true };
      }),

    /**
     * Delete all messages for a session
     */
    deleteAllMessages: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteAllChatMessages(input.sessionId);
        return { success: true };
      }),

    /**
     * Upload a file for chat
     */
    uploadFile: publicProcedure
      .input(z.object({
        sessionId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // base64
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Upload file using centralized utility
        const { key: fileKey, url } = await uploadFileToStorage(
          input.fileData,
          input.fileName,
          input.mimeType,
          `chat/${input.sessionId}`
        );
        
        return { url, key: fileKey };
      }),
  }),

  /**
   * Viewer uploads management
   */
  viewerUploads: router({
    /**
     * Toggle viewer uploads for a session (presenter only)
     */
    toggleViewerUploads: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        allow: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Verify user owns this session
        const sessions = await getPresentationSessionsByPresenter(ctx.user.id);
        const session = sessions.find(s => s.id === input.sessionId);

        if (!session) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to modify this session",
          });
        }

        const { presentationSessions } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        // Update the session
        await db
          .update(presentationSessions)
          .set({ allowViewerUploads: input.allow })
          .where(eq(presentationSessions.id, input.sessionId));

        return { success: true, allow: input.allow };
      }),

    /**
     * Get viewer uploads status for a session
     */
    getViewerUploadsStatus: publicProcedure
      .input(z.object({
        sessionCode: z.string(),
      }))
      .query(async ({ input }) => {
        const session = await getPresentationSessionByCode(input.sessionCode);
        if (!session) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        }

        return { allow: session.allowViewerUploads || false };
      }),
  }),
});

export type AppRouter = typeof appRouter;




// Temporary: Add updateZoom and updateCursor mutations
// These will be added to the presentation router

