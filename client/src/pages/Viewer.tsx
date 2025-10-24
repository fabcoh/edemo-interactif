"use client";

import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { ArrowLeft, Users, X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect } from "react";

/**
 * Viewer Page - Display presentation content in real-time (fullscreen)
 */
export default function Viewer() {
  const [match, params] = useRoute("/view/:code");
  const [sessionCode, setSessionCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [presenterZoom, setPresenterZoom] = useState(100);
  const [presenterCursorX, setPresenterCursorX] = useState(0);
  const [presenterCursorY, setPresenterCursorY] = useState(0);
  const [presenterCursorVisible, setPresenterCursorVisible] = useState(false);
  const [presenterPanOffsetX, setPresenterPanOffsetX] = useState(0);
  const [presenterPanOffsetY, setPresenterPanOffsetY] = useState(0);
  const [documentError, setDocumentError] = useState<string | null>(null);

  // Extract session code from URL if present
  useEffect(() => {
    // Check if we're on the /view/:code route
    if (match && params?.code) {
      setSessionCode(params.code);
      setEnteredCode(params.code);
      setIsJoined(true);
    } else {
      // Fallback to query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (code) {
        setSessionCode(code);
        setEnteredCode(code);
        setIsJoined(true);
      }
    }
  }, [match, params]);

  // Real-time query with polling
  const sessionQuery = trpc.presentation.getSessionByCode.useQuery(
    { sessionCode: enteredCode },
    { 
      enabled: isJoined && !!enteredCode,
      refetchInterval: 1000, // Poll every 1 second for real-time updates
    }
  );

  const joinSessionMutation = trpc.viewer.joinSession.useMutation({
    onSuccess: () => {
      setViewerCount((prev) => prev + 1);
    },
  });

  // Get presenter's cursor and zoom in real-time
  const cursorQuery = trpc.presentation.getCursorAndZoom.useQuery(
    { sessionCode: enteredCode },
    {
      enabled: isJoined && !!enteredCode,
      refetchInterval: 500, // Poll every 500ms for smooth cursor tracking
    }
  );

  // Update presenter zoom and cursor when data arrives
  useEffect(() => {
    if (cursorQuery.data) {
      setPresenterZoom(cursorQuery.data.zoomLevel);
      setPresenterCursorX(cursorQuery.data.cursorX);
      setPresenterCursorY(cursorQuery.data.cursorY);
      setPresenterCursorVisible(cursorQuery.data.cursorVisible);
      setPresenterPanOffsetX(cursorQuery.data.panOffsetX);
      setPresenterPanOffsetY(cursorQuery.data.panOffsetY);
    }
  }, [cursorQuery.data]);

  const session = sessionQuery.data;
  const currentDocument = session?.currentDocument;

  const handleJoinSession = () => {
    if (sessionCode.trim()) {
      setEnteredCode(sessionCode);
      setIsJoined(true);
      joinSessionMutation.mutate({ sessionCode });
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  const resetZoom = () => {
    setZoom(100);
    // Use presenter's zoom if available, otherwise reset to 100
    setZoom(presenterZoom);
  };

  // If joined and fullscreen, show only the document
  if (isJoined && isFullscreen && currentDocument) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        {/* Minimal Header - Very compact */}
        <div className="bg-gray-950 border-b border-gray-800 px-4 py-2 flex justify-between items-center h-12 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-xs font-bold text-white truncate">{session?.title || "Présentation"}</h1>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {session?.sessionCode}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Users className="w-3 h-3" />
              <span className="whitespace-nowrap">{viewerCount}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsFullscreen(false)}
              className="text-gray-400 hover:text-white h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Document Display - Fullscreen */}
        <div className="flex-1 bg-black flex flex-col items-center justify-center overflow-hidden relative">

          {/* Document Content */}
          <div className="w-full h-full flex items-center justify-center overflow-auto">
            {documentError && (
              <div className="text-center text-red-400 p-4">
                <p className="text-sm">Erreur lors du chargement du document</p>
                <p className="text-xs text-gray-400 mt-2">{documentError}</p>
              </div>
            )}

            {!documentError && currentDocument.type === "pdf" && (
              <iframe
                src={currentDocument.fileUrl}
                className="w-full h-full"
                title="PDF Document"
                onError={() => setDocumentError("Impossible de charger le PDF")}
              />
            )}

            {!documentError && currentDocument.type === "image" && (
              <div className="flex items-center justify-center w-full h-full p-4 relative">
                <img
                  src={currentDocument.fileUrl}
                  alt="Document"
                  style={{
                    transform: `scale(${presenterZoom / 100}) translate(${presenterPanOffsetX / (presenterZoom / 100)}px, ${presenterPanOffsetY / (presenterZoom / 100)}px)`,
                    transition: "transform 0.2s ease-out",
                  }}
                  className="object-contain max-w-full max-h-full"
                  onError={() => setDocumentError("Impossible de charger l'image")}
                />
                {/* Presenter cursor - Red for presenter, visible for viewers */}
                {presenterCursorVisible && presenterZoom > 100 && (
                  <div
                    className="absolute w-6 h-6 border-2 border-red-500 rounded-full pointer-events-none"
                    style={{
                      left: `${presenterCursorX}%`,
                      top: `${presenterCursorY}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="absolute inset-1 border-2 border-red-500 rounded-full opacity-50" />
                  </div>
                )}
              </div>
            )}

            {!documentError && currentDocument.type === "video" && (
              <video
                src={currentDocument.fileUrl}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain"
                onError={() => setDocumentError("Impossible de charger la vidéo")}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Normal view (not fullscreen)
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{session?.title || "Présentation"}</h1>
            <p className="text-sm text-gray-400">
              Code: {session?.sessionCode || "---"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" />
              <span>{viewerCount} spectateur(s)</span>
            </div>
            {!isJoined && (
              <Link href="/">
                <Button variant="outline">Retour</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!isJoined ? (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Rejoindre une Présentation</CardTitle>
                <CardDescription>
                  Entrez le code de session pour voir la présentation en direct
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Code de Session</Label>
                  <Input
                    placeholder="Ex: ABC12345"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === "Enter" && handleJoinSession()}
                    className="mt-2"
                  />
                </div>
                <Button onClick={handleJoinSession} className="w-full">
                  Rejoindre
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : sessionQuery.isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Chargement...</p>
          </div>
        ) : !session ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Présentation non trouvée</p>
            <Link href="/">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Document Display */}
            {currentDocument ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-0">
                  {currentDocument.type === "pdf" && (
                    <div className="bg-black p-4 rounded-lg">
                      <iframe
                        src={currentDocument.fileUrl}
                        className="w-full h-96 rounded"
                        title="PDF Document"
                      />
                    </div>
                  )}
                  {currentDocument.type === "image" && (
                    <div className="bg-black p-4 rounded-lg flex justify-center">
                      <img
                        src={currentDocument.fileUrl}
                        alt="Document"
                        className="max-w-full max-h-96 object-contain rounded"
                      />
                    </div>
                  )}
                  {currentDocument.type === "video" && (
                    <div className="bg-black p-4 rounded-lg">
                      <video
                        src={currentDocument.fileUrl}
                        controls
                        className="w-full h-96 rounded"
                        autoPlay
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center text-gray-400">
                  En attente du document...
                </CardContent>
              </Card>
            )}

            {/* Fullscreen Button */}
            {currentDocument && (
              <Button
                onClick={() => {
                  setZoom(100);
                  setDocumentError(null);
                  setIsFullscreen(true);
                }}
                className="w-full gap-2"
                size="lg"
              >
                Plein écran
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

