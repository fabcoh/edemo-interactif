import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Hook for real-time session synchronization
 * Polls the server for updates to the current document being displayed
 */
export function useRealtimeSession(sessionCode: string, enabled: boolean = true) {
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Query to get session data
  const sessionQuery = trpc.presentation.getSessionByCode.useQuery(
    { sessionCode },
    { 
      enabled: enabled && !!sessionCode,
      refetchInterval: 1000, // Poll every 1 second for real-time updates
    }
  );

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    session: sessionQuery.data,
    isLoading: sessionQuery.isLoading,
    isError: sessionQuery.isError,
    refetch: sessionQuery.refetch,
  };
}

/**
 * Hook for presenter to manage the current document display
 */
export function usePresenterControl(sessionId: number) {
  const updateDocumentMutation = trpc.presentation.updateCurrentDocument.useMutation();
  const viewerCountQuery = trpc.presentation.getViewerCount.useQuery(
    { sessionId },
    { refetchInterval: 2000 } // Check viewer count every 2 seconds
  );

  const displayDocument = async (
    documentId: number | null,
    orientation: "portrait" | "landscape" = "portrait"
  ) => {
    return updateDocumentMutation.mutateAsync({
      sessionId,
      documentId,
      orientation,
    });
  };

  return {
    displayDocument,
    isUpdating: updateDocumentMutation.isPending,
    viewerCount: viewerCountQuery.data?.count || 0,
    isLoadingViewerCount: viewerCountQuery.isLoading,
    refetchViewerCount: viewerCountQuery.refetch,
  };
}

