"use client";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, Link } from "wouter";
import { ArrowLeft, Users, Copy, Share2, Upload, X, ZoomIn, ZoomOut, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import ChatPanelViewer from "@/components/ChatPanelViewer";

/**
 * Presenter Control Page - Control document display during presentation
 * Layout: Zoom controls on top, thumbnails below, centered preview, controls on right
 */
export default function PresenterControl() {
  const { isAuthenticated } = useAuth();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [displayedDocumentId, setDisplayedDocumentId] = useState<number | null>(null);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [zoom, setZoom] = useState(100);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const [showMouseCursor, setShowMouseCursor] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState(100);

  const sessionIdNum = sessionId ? parseInt(sessionId) : 0;

  // Queries
  const sessionsQuery = trpc.presentation.getSessions.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const documentsQuery = trpc.documents.getSessionDocuments.useQuery(
    { sessionId: sessionIdNum },
    { enabled: !!sessionIdNum && isAuthenticated }
  );

  const viewerCountQuery = trpc.presentation.getViewerCount.useQuery(
    { sessionId: sessionIdNum },
    { 
      enabled: !!sessionIdNum && isAuthenticated,
      refetchInterval: 2000,
    }
  );

  // Mutations
  const updateDocumentMutation = trpc.presentation.updateCurrentDocument.useMutation({
    onSuccess: () => {
      setZoom(100);
      setShowMouseCursor(false);
    },
  });

  const endSessionMutation = trpc.presentation.endSession.useMutation({
    onSuccess: () => {
      // Session ended
    },
  });

  const uploadDocumentMutation = trpc.documents.uploadDocument.useMutation({
    onSuccess: () => {
      documentsQuery.refetch();
      const fileInput = document.getElementById('document-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    },
  });

  const deleteDocumentMutation = trpc.documents.deleteDocument.useMutation({
    onSuccess: () => {
      documentsQuery.refetch();
      setSelectedDocumentId(null);
      if (displayedDocumentId === selectedDocumentId) {
        setDisplayedDocumentId(null);
      }
    },
  });

  const updateZoomAndCursorMutation = trpc.presentation.updateZoomAndCursor.useMutation();

  const handleUploadDocument = async (file: File) => {
    if (!file) return;

    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'video/mp4'];
    if (!validTypes.includes(file.type)) {
      alert('Format de fichier non supporté. Veuillez utiliser PDF, PNG, JPG ou MP4.');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      alert('Le fichier est trop volumineux. Maximum 100MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const fileType = file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'video';
      
      await uploadDocumentMutation.mutateAsync({
        sessionId: sessionIdNum,
        type: fileType as 'pdf' | 'image' | 'video',
        fileData: base64,
        fileName: file.name,
        title: file.name.split("/").pop() || "Document",
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès Refusé</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Retour à l'accueil</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sessions = sessionsQuery.data || [];
  const currentSession = sessions.find(s => s.id === sessionIdNum);
  const documents = documentsQuery.data || [];
  const viewerCount = viewerCountQuery.data?.count || 0;
  const selectedDocument = documents.find(d => d.id === selectedDocumentId);
  const displayedDocument = documents.find(d => d.id === displayedDocumentId);

  const handleDisplayDocument = async (docId: number) => {
    // Send zoom with the document
    await updateDocumentMutation.mutateAsync({
      sessionId: sessionIdNum,
      documentId: docId,
      orientation,
    });
    setDisplayedDocumentId(docId);
    setSelectedDocumentId(docId);
    setZoom(100); // Reset zoom when displaying new document
    setPanOffset({ x: 0, y: 0 }); // Reset pan offset
  };

  const handleClearDisplay = async () => {
    await updateDocumentMutation.mutateAsync({
      sessionId: sessionIdNum,
      documentId: null,
      orientation,
    });
    setDisplayedDocumentId(null);
  };

  const handleEndSession = async () => {
    if (confirm("Êtes-vous sûr de vouloir terminer cette présentation?")) {
      await endSessionMutation.mutateAsync({ sessionId: sessionIdNum });
      setTimeout(() => {
        window.location.href = "/presenter";
      }, 1000);
    }
  };

  const getShareLink = (sessionCode: string) => {
    return `${window.location.origin}/view/${sessionCode}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copié dans le presse-papiers!");
  };

  const generateWhatsAppLink = (sessionCode: string) => {
    const shareLink = getShareLink(sessionCode);
    const message = `Rejoignez ma présentation en direct! ${shareLink}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const containerRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;
    setMousePos({ x, y });

    if (displayedDocumentId && currentSession && imageRef.current) {
      // Get image dimensions and position
      const imageRect = imageRef.current.getBoundingClientRect();
      const imageX = e.clientX - imageRect.left;
      const imageY = e.clientY - imageRect.top;
      
      // Convert pixel coordinates to percentage (0-100) relative to image
      const xPercent = (imageX / imageRect.width) * 100;
      const yPercent = (imageY / imageRect.height) * 100;
      
      updateZoomAndCursorMutation.mutate({
        sessionId: sessionIdNum,
        zoomLevel: zoom,
        cursorX: xPercent,
        cursorY: yPercent,
        cursorVisible: showMouseCursor && zoom > 100,
        panOffsetX: panOffset.x,
        panOffsetY: panOffset.y,
      });
    }
  };

  // Calculate distance between two touch points for pinch-to-zoom
  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  if (!currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Présentation Non Trouvée</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/presenter">
              <Button className="w-full">Retour au Tableau de Bord</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-black shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/presenter">
              <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{currentSession.title}</h1>
              <p className="text-xs text-gray-400">Code: {currentSession.sessionCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-900 rounded-lg">
              <Users className="w-4 h-4" />
              <span className="font-semibold text-sm">{viewerCount} spectateur{viewerCount !== 1 ? "s" : ""}</span>
            </div>
            <Button
              onClick={handleEndSession}
              variant="destructive"
              size="sm"
            >
              Terminer
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col gap-4 overflow-hidden">
        {/* Zoom Controls - Top with Slider */}
        {displayedDocument?.type === "image" && (
          <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg border border-gray-700">
            <span className="text-xs text-gray-400 whitespace-nowrap">Zoom:</span>
            <Button
              onClick={() => {
                const newZoom = Math.max(50, zoom - 10);
                setZoom(newZoom);
                if (currentSession) {
                  updateZoomAndCursorMutation.mutate({
                    sessionId: sessionIdNum,
                    zoomLevel: newZoom,
                    cursorX: mousePos.x,
                    cursorY: mousePos.y,
                    cursorVisible: showMouseCursor && newZoom > 100,
                    panOffsetX: panOffset.x,
                    panOffsetY: panOffset.y,
                  });
                }
              }}
              variant="outline"
              size="sm"
              className="bg-gray-700 border-gray-600 hover:bg-gray-600 h-8 w-8 p-0"
            >
              <ZoomOut className="w-3 h-3" />
            </Button>
            <input
              type="range"
              min="50"
              max="200"
              step="5"
              value={zoom}
              onChange={(e) => {
                const newZoom = parseInt(e.target.value);
                setZoom(newZoom);
                if (currentSession) {
                  updateZoomAndCursorMutation.mutate({
                    sessionId: sessionIdNum,
                    zoomLevel: newZoom,
                    cursorX: mousePos.x,
                    cursorY: mousePos.y,
                    cursorVisible: showMouseCursor && newZoom > 100,
                    panOffsetX: panOffset.x,
                    panOffsetY: panOffset.y,
                  });
                }
              }}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((zoom - 50) / 150) * 100}%, #374151 ${((zoom - 50) / 150) * 100}%, #374151 100%)`
              }}
            />
            <div className="text-xs font-semibold text-white w-12 text-center">
              {zoom}%
            </div>
            <Button
              onClick={() => {
                const newZoom = Math.min(200, zoom + 10);
                setZoom(newZoom);
                if (currentSession) {
                  updateZoomAndCursorMutation.mutate({
                    sessionId: sessionIdNum,
                    zoomLevel: newZoom,
                    cursorX: mousePos.x,
                    cursorY: mousePos.y,
                    cursorVisible: showMouseCursor && newZoom > 100,
                    panOffsetX: panOffset.x,
                    panOffsetY: panOffset.y,
                  });
                }
              }}
              variant="outline"
              size="sm"
              className="bg-gray-700 border-gray-600 hover:bg-gray-600 h-8 w-8 p-0"
            >
              <ZoomIn className="w-3 h-3" />
            </Button>
            <Button
              onClick={() => {
                setZoom(100);
                if (currentSession) {
                  updateZoomAndCursorMutation.mutate({
                    sessionId: sessionIdNum,
                    zoomLevel: 100,
                    cursorX: mousePos.x,
                    cursorY: mousePos.y,
                    cursorVisible: false,
                    panOffsetX: panOffset.x,
                    panOffsetY: panOffset.y,
                  });
                }
              }}
              variant="outline"
              size="sm"
              className="bg-gray-700 border-gray-600 hover:bg-gray-600 h-8 text-xs px-2"
            >
              Réinit
            </Button>
          </div>
        )}

        {/* Thumbnails Bar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold">Documents ({documents.length})</h2>
            <input
              id="document-upload"
              type="file"
              accept=".pdf,image/png,image/jpeg,image/jpg,.mp4"
              capture="environment"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleUploadDocument(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <Button
              onClick={() => document.getElementById('document-upload')?.click()}
              size="default"
              className="bg-blue-600 hover:bg-blue-700 h-10 text-sm font-semibold px-4 touch-manipulation"
            >
              <Upload className="w-4 h-4 mr-2" />
              Ajouter Document
            </Button>
          </div>

          {/* Thumbnails Container */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {documents.map((doc, idx) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDocumentId(doc.id)}
                onDoubleClick={() => handleDisplayDocument(doc.id)}
                className={`flex-shrink-0 w-24 h-24 rounded-lg border-2 cursor-pointer transition-all group relative overflow-hidden ${
                  selectedDocumentId === doc.id
                    ? "border-blue-500 bg-blue-900 bg-opacity-30"
                    : "border-gray-600 hover:border-gray-500"
                }`}
              >
                {doc.type === "image" && (
                  <>
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, hsl(${(doc.id * 60) % 360}, 70%, 40%), hsl(${(doc.id * 60 + 60) % 360}, 70%, 40%))`
                      }}
                    />
                    <img
                      src={doc.fileUrl}
                      alt={doc.title}
                      className="w-full h-full object-cover pointer-events-none relative z-10"
                    />
                    <div className="absolute inset-0 flex flex-col items-end justify-end text-white pointer-events-none z-20 p-1">
                      <div className="text-xs text-center font-semibold line-clamp-1 bg-black bg-opacity-60 px-1 rounded">{doc.title}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
                          deleteDocumentMutation.mutate({ documentId: doc.id, sessionId: sessionIdNum });
                        }
                      }}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 z-30 transition-colors"
                      title="Supprimer ce document"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                )}
                {doc.type === "pdf" && (
                  <div className="text-center flex flex-col items-center justify-center z-10 relative">
                    <div className="text-2xl mb-1">📄</div>
                    <div className="text-xs text-white font-semibold text-center px-2 line-clamp-2">{doc.title}</div>
                  </div>
                )}
                {doc.type === "video" && (
                  <div className="text-center flex flex-col items-center justify-center z-10 relative">
                    <div className="text-2xl mb-1">🎬</div>
                    <div className="text-xs text-white font-semibold text-center px-2 line-clamp-2">{doc.title}</div>
                  </div>
                )}

                {/* Checkmark if Displayed */}
                {displayedDocumentId === doc.id && (
                  <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full p-1">
                    <Check className="w-3 h-3" />
                  </div>
                )}

                {/* Double-click Hint */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all rounded-lg">
                  <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs font-bold">2x</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
          {/* Center - Preview Area */}
          <div className="lg:col-span-3 flex flex-col gap-2 overflow-hidden">
            <Card className="bg-gray-800 border-gray-700 flex-1 flex flex-col overflow-hidden">
              {/* Title Bar */}
              {displayedDocument && (
                <div className="bg-gray-700 px-4 py-2 flex items-center justify-between border-b border-gray-600">
                  <div className="text-xs font-semibold text-white truncate">
                    {displayedDocument.title}
                  </div>
                  <Button
                    onClick={handleClearDisplay}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
              <CardContent className="flex-1 flex items-center justify-center overflow-hidden relative p-4">
                {displayedDocument ? (
                  <div
                    className="relative w-full h-full flex items-center justify-center overflow-hidden"
                    style={{ cursor: isPanning ? 'grabbing' : (zoom > 100 ? 'grab' : 'crosshair') }}
                    onMouseDown={(e) => {
                      if (zoom > 100) {
                        setIsPanning(true);
                        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
                      }
                    }}
                    onMouseMove={(e) => {
                      if (isPanning && zoom > 100) {
                        setPanOffset({
                          x: e.clientX - panStart.x,
                          y: e.clientY - panStart.y,
                        });
                      }
                      handleMouseMove(e);
                    }}
                    onMouseUp={() => setIsPanning(false)}
                    onMouseLeave={() => {
                      setIsPanning(false);
                      setShowMouseCursor(false);
                    }}
                    onMouseEnter={() => setShowMouseCursor(true)}
                    onTouchStart={(e) => {
                      if (e.touches.length === 2) {
                        // Pinch-to-zoom: two fingers
                        const distance = getTouchDistance(e.touches);
                        setInitialPinchDistance(distance);
                        setInitialZoom(zoom);
                        setIsPanning(false);
                      } else if (e.touches.length === 1) {
                        // Single finger: show cursor and pan if zoomed
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.touches[0].clientX - rect.left;
                        const y = e.touches[0].clientY - rect.top;
                        setMousePos({ x, y });
                        setShowMouseCursor(true);
                        
                        if (zoom > 100) {
                          setIsPanning(true);
                          setPanStart({
                            x: e.touches[0].clientX - panOffset.x,
                            y: e.touches[0].clientY - panOffset.y,
                          });
                        }
                        
                        // Send cursor position to viewers (as percentage)
                        if (displayedDocumentId && currentSession) {
                          const xPercent = (x / rect.width) * 100;
                          const yPercent = (y / rect.height) * 100;
                          
                          updateZoomAndCursorMutation.mutate({
                            sessionId: sessionIdNum,
                            zoomLevel: zoom,
                            cursorX: xPercent,
                            cursorY: yPercent,
                            cursorVisible: true,
                            panOffsetX: panOffset.x,
                            panOffsetY: panOffset.y,
                          });
                        }
                      }
                    }}
                    onTouchMove={(e) => {
                      if (e.touches.length === 2 && initialPinchDistance) {
                        // Pinch-to-zoom
                        e.preventDefault();
                        const currentDistance = getTouchDistance(e.touches);
                        const scale = currentDistance / initialPinchDistance;
                        const newZoom = Math.max(50, Math.min(200, initialZoom * scale));
                        setZoom(Math.round(newZoom));
                        
                        if (currentSession) {
                          updateZoomAndCursorMutation.mutate({
                            sessionId: sessionIdNum,
                            zoomLevel: Math.round(newZoom),
                            cursorX: mousePos.x,
                            cursorY: mousePos.y,
                            cursorVisible: showMouseCursor && newZoom > 100,
                            panOffsetX: panOffset.x,
                            panOffsetY: panOffset.y,
                          });
                        }
                      } else if (e.touches.length === 1) {
                        // Single finger: update cursor position and pan
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.touches[0].clientX - rect.left;
                        const y = e.touches[0].clientY - rect.top;
                        setMousePos({ x, y });
                        
                        if (isPanning && zoom > 100) {
                          setPanOffset({
                            x: e.touches[0].clientX - panStart.x,
                            y: e.touches[0].clientY - panStart.y,
                          });
                        }
                        
                        // Send cursor position to viewers (as percentage)
                        if (displayedDocumentId && currentSession) {
                          const xPercent = (x / rect.width) * 100;
                          const yPercent = (y / rect.height) * 100;
                          
                          updateZoomAndCursorMutation.mutate({
                            sessionId: sessionIdNum,
                            zoomLevel: zoom,
                            cursorX: xPercent,
                            cursorY: yPercent,
                            cursorVisible: true,
                            panOffsetX: panOffset.x,
                            panOffsetY: panOffset.y,
                          });
                        }
                      }
                    }}
                    onTouchEnd={(e) => {
                      if (e.touches.length === 0) {
                        setIsPanning(false);
                        setInitialPinchDistance(null);
                        setShowMouseCursor(false);
                        
                        // Hide cursor for viewers
                        if (displayedDocumentId && currentSession) {
                          updateZoomAndCursorMutation.mutate({
                            sessionId: sessionIdNum,
                            zoomLevel: zoom,
                            cursorX: mousePos.x,
                            cursorY: mousePos.y,
                            cursorVisible: false,
                            panOffsetX: panOffset.x,
                            panOffsetY: panOffset.y,
                          });
                        }
                      }
                    }}
                  >
                    {displayedDocument.type === "image" && (
                      <>
                        <img
                          ref={imageRef}
                          src={displayedDocument.fileUrl}
                          alt={displayedDocument.title}
                          className="max-w-full max-h-full object-contain"
                          style={{
                            transform: `scale(${zoom / 100}) translate(${panOffset.x / (zoom / 100)}px, ${panOffset.y / (zoom / 100)}px)`,
                            transition: isPanning ? 'none' : 'transform 0.2s ease-out',
                          }}
                        />
                        {/* Cursor Indicator - Red for Presenter */}
                        {showMouseCursor && zoom > 100 && (
                          <div
                            className="absolute w-6 h-6 border-2 border-red-500 rounded-full pointer-events-none"
                            style={{
                              left: `${mousePos.x}px`,
                              top: `${mousePos.y}px`,
                              transform: "translate(-50%, -50%)",
                            }}
                          >
                            <div className="absolute inset-1 border-2 border-red-500 rounded-full opacity-50" />
                          </div>
                        )}
                      </>
                    )}
                    {displayedDocument.type === "pdf" && (
                      <div className="text-center">
                        <div className="text-6xl mb-4">📄</div>
                        <p className="text-gray-400 text-sm">{displayedDocument.title}</p>
                      </div>
                    )}
                    {displayedDocument.type === "video" && (
                      <video
                        src={displayedDocument.fileUrl}
                        controls
                        className="max-w-full max-h-full"
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <p className="text-sm mb-2">Sélectionnez un document</p>
                    <p className="text-xs">Clic pour sélectionner</p>
                    <p className="text-xs">Double-clic pour afficher</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Controls & Info */}
          <div className="lg:col-span-1 flex flex-col gap-2 overflow-y-auto">
            {/* Share Panel */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Partager</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => copyToClipboard(getShareLink(currentSession.sessionCode))}
                  variant="outline"
                  className="w-full gap-1 bg-gray-700 border-gray-600 hover:bg-gray-600 text-white h-8 text-xs"
                  size="sm"
                >
                  <Copy className="w-3 h-3" />
                  Copier
                </Button>

                <a
                  href={generateWhatsAppLink(currentSession.sessionCode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full gap-1 bg-green-600 hover:bg-green-700 h-8 text-xs" size="sm">
                    <Share2 className="w-3 h-3" />
                    WhatsApp
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Chat Panel */}
            <div className="flex-1 flex flex-col overflow-hidden border border-gray-700 rounded-lg">
              <ChatPanelViewer
                sessionId={sessionIdNum}
                senderType="presenter"
                senderName={currentSession.title}
                onLoadDocument={(url, name, type) => {
                  // Charger le document dans le visualisateur
                  console.log('Load document:', url, name, type);
                }}
              />
            </div>

            {/* Info Panel */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Infos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div>
                  <p className="text-gray-400 text-xs">Code:</p>
                  <p className="font-mono font-bold text-xs">{currentSession.sessionCode}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Spectateurs:</p>
                  <p className="font-bold text-xs">{viewerCount}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Documents:</p>
                  <p className="font-bold text-xs">{documents.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

