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
     * Get all sessions for the current presenter
     */
    getSessions: protectedProcedure.query(async ({ ctx }) => {
      const sessions = await getPresentationSessionsByPresenter(ctx.user.id);
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
          input.cursorVisible
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
          };
        }

        return {
          zoomLevel: cursor.zoomLevel,
          cursorX: cursor.cursorX,
          cursorY: cursor.cursorY,
          cursorVisible: cursor.cursorVisible,
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
          // Convert base64 to buffer
          // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
          const base64Data = input.fileData.includes('base64,') 
            ? input.fileData.split('base64,')[1] 
            : input.fileData;
          const buffer = Buffer.from(base64Data, "base64");
          
          // Generate unique file key
          const fileKey = generateFileKey(`presentations/${input.sessionId}/${input.type}`);
          
          // Upload to S3
          const { url } = await storagePut(fileKey, buffer, input.mimeType);
          
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
            buffer.length,
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
});

export type AppRouter = typeof appRouter;




// Temporary: Add updateZoom and updateCursor mutations
// These will be added to the presentation router

