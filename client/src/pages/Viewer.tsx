"use client";

import { useState, useRef } from "react";
import { useRoute } from "wouter";
import ChatPanel from "@/components/ChatPanel";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { ArrowLeft, Users, X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [viewerDocuments, setViewerDocuments] = useState<Array<{id: string, url: string, name: string, type: string}>>([]);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);

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

  const setCurrentDocumentMutation = trpc.viewer.setCurrentDocument.useMutation({
    onSuccess: () => {
      // Rafraîchir la session pour voir le changement
      sessionQuery.refetch();
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
      
      // Synchroniser le scroll du conteneur PDF
      if (pdfContainerRef.current && displayDocument?.type === 'pdf') {
        pdfContainerRef.current.scrollLeft = cursorQuery.data.panOffsetX;
        pdfContainerRef.current.scrollTop = cursorQuery.data.panOffsetY;
      }
      console.log('[Viewer] Cursor data:', {
        zoom: cursorQuery.data.zoomLevel,
        x: cursorQuery.data.cursorX,
        y: cursorQuery.data.cursorY,
        visible: cursorQuery.data.cursorVisible,
        panOffsetX: cursorQuery.data.panOffsetX,
        panOffsetY: cursorQuery.data.panOffsetY,
      });
    }
  }, [cursorQuery.data]);

  const session = sessionQuery.data;
  const currentDocument = session?.currentDocument;
  const displayDocument = currentDocument;

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

  // Upload file mutation (using chat upload to S3)
  const uploadFileMutation = trpc.chat.uploadFile.useMutation();

  // Handle viewer document upload
  const handleViewerUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      const fileType = file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'video';
      
      try {
        // Upload to S3 first
        const uploadResult = await uploadFileMutation.mutateAsync({
          sessionId: session?.id || 0,
          fileName: file.name,
          fileData: base64Data.split(',')[1], // Remove data URL prefix
          mimeType: file.type,
        });
        
        // Create document object with S3 URL
        const newDoc = {
          id: `viewer-${Date.now()}`,
          url: uploadResult.url,
          name: file.name,
          type: fileType
        };
        
        // Add to viewer documents list
        setViewerDocuments(prev => [...prev, newDoc]);
        
        // Automatically display the document for everyone
        if (enteredCode) {
          setCurrentDocumentMutation.mutate({
            sessionCode: enteredCode,
            documentUrl: uploadResult.url,
            documentName: file.name,
            documentType: fileType as "image" | "pdf" | "video",
          });
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Erreur lors de l\'upload du fichier');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle viewer document deletion
  const handleViewerDocumentDelete = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the click to display
    setViewerDocuments(prev => prev.filter(d => d.id !== docId));
  };

  // Handle viewer document click to display
  const handleViewerDocumentClick = (doc: {id: string, url: string, name: string, type: string}) => {
    if (enteredCode) {
      setCurrentDocumentMutation.mutate({
        sessionCode: enteredCode,
        documentUrl: doc.url,
        documentName: doc.name,
        documentType: doc.type as "image" | "pdf" | "video",
      });
    }
  };

  // If joined and fullscreen, show only the document
  if (isJoined && isFullscreen && displayDocument) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        {/* Main Content Area - Vertical Layout */}
        <div className="h-full flex flex-col">
          {/* Document Display - 65% of screen */}
          <div className="h-[65%] bg-black flex flex-col items-center justify-center overflow-hidden relative">

          {/* Document Content */}
          <div 
            className="w-full h-full flex items-center justify-center overflow-auto cursor-pointer"
            onDoubleClick={() => displayDocument && window.open(displayDocument.fileUrl, '_blank')}
            title="Double-cliquer pour ouvrir en plein écran"
          >
            {documentError && (
              <div className="text-center text-red-400 p-4">
                <p className="text-sm">Erreur lors du chargement du document</p>
                <p className="text-xs text-gray-400 mt-2">{documentError}</p>
              </div>
            )}

            {!documentError && displayDocument.type === "pdf" && (
              <div ref={pdfContainerRef} className="w-full h-full overflow-auto bg-gray-900 relative">
                <Document
                  file={displayDocument.fileUrl}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  onLoadError={(error) => {
                    console.error('PDF load error:', error);
                    setDocumentError("Impossible de charger le PDF");
                  }}
                  loading={
                    <div className="text-center p-8">
                      <div className="text-6xl mb-4">📄</div>
                      <p className="text-gray-400">Chargement du PDF...</p>
                    </div>
                  }
                  error={
                    <div className="text-center p-8">
                      <div className="text-6xl mb-4">📄</div>
                      <p className="text-red-400">Impossible de charger le PDF</p>
                    </div>
                  }
                  className="flex flex-col items-center"
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={presenterZoom / 100}
                    width={Math.min(window.innerWidth * 0.9, 1200)}
                    className="max-w-full"
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </Document>
                {numPages && numPages > 1 && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-4 py-2 rounded-lg flex items-center gap-2 z-10">
                    <button
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                      disabled={pageNumber <= 1}
                    >
                      ←
                    </button>
                    <span className="text-white text-sm">
                      Page {pageNumber} / {numPages}
                    </span>
                    <button
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                      disabled={pageNumber >= numPages}
                    >
                      →
                    </button>
                  </div>
                )}
              </div>
            )}

            {!documentError && displayDocument.type === "image" && (
              <div className="flex items-center justify-center w-full h-full relative">
                <img
                  ref={imageRef}
                  src={displayDocument.fileUrl}
                  alt="Document"
                  style={{
                    transform: `scale(${presenterZoom / 100}) translate(${presenterPanOffsetX / (presenterZoom / 100)}px, ${presenterPanOffsetY / (presenterZoom / 100)}px)`,
                    transition: "transform 0.2s ease-out",
                  }}
                  className="max-w-full max-h-full object-contain"
                  onError={() => setDocumentError("Impossible de charger l'image")}
                />
                {/* Pointeur main du présentateur visible pour les spectateurs */}
                {/* Convert percentage to pixels based on actual image position */}
                {presenterCursorVisible && imageRef.current && (() => {
                  const imageRect = imageRef.current.getBoundingClientRect();
                  const containerRect = imageRef.current.parentElement?.getBoundingClientRect();
                  if (!containerRect) return null;
                  
                  // Calculate cursor position in pixels
                  const cursorX = (presenterCursorX / 100) * imageRect.width + (imageRect.left - containerRect.left);
                  const cursorY = (presenterCursorY / 100) * imageRect.height + (imageRect.top - containerRect.top);
                  
                  return (
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${cursorX}px`,
                        top: `${cursorY}px`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div className="text-3xl" style={{ filter: 'drop-shadow(0 0 3px rgba(255, 0, 0, 0.8))' }}>
                        👆
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {!documentError && displayDocument.type === "video" && (
              <video
                src={displayDocument.fileUrl}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain"
                onError={() => setDocumentError("Impossible de charger la vidéo")}
              />
            )}
          </div>
          </div>

          {/* Upload + Chat Panel - Bottom 35% - Layout 2 colonnes */}
          <div className="h-[35%] bg-gray-900 border-t border-gray-700 flex flex-row">
            {/* Zone Upload - 1/3 gauche */}
            <div className="w-1/3 border-r border-gray-700 flex flex-col p-4 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Mes Documents</h3>
              
              {/* Zone glisser-déposer */}
              <input
                type="file"
                id="viewer-document-upload"
                accept="image/*,application/pdf,video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleViewerUpload(file);
                }}
                className="hidden"
              />
              <div
                onClick={() => document.getElementById('viewer-document-upload')?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = e.dataTransfer.files;
                  if (files.length > 0) {
                    handleViewerUpload(files[0]);
                  }
                }}
                className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-gray-500 transition-colors mb-4"
              >
                <p className="text-xs text-gray-400">Glisser un fichier ici</p>
                <p className="text-xs text-gray-500 mt-1">ou cliquer pour sélectionner</p>
              </div>

              {/* Liste des vignettes uploadées */}
              <div className="space-y-2 flex-1 overflow-y-auto">
                {viewerDocuments.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center">Aucun document uploadé</p>
                ) : (
                  [...viewerDocuments].reverse().map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleViewerDocumentClick(doc)}
                      className="relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all group"
                      style={{ aspectRatio: '16/9' }}
                    >
                      {doc.type === 'image' && (
                        <img
                          src={doc.url}
                          alt={doc.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {doc.type === 'pdf' && (
                        <div className="w-full h-full flex items-center justify-center bg-red-900/20 overflow-hidden">
                          <Document
                            file={doc.url}
                            onLoadError={(error) => console.error('PDF thumbnail error:', error)}
                            loading={
                              <div className="text-center">
                                <div className="text-2xl">📄</div>
                              </div>
                            }
                            error={
                              <div className="text-center">
                                <div className="text-2xl">📄</div>
                                <p className="text-xs text-red-400 mt-1">Erreur</p>
                              </div>
                            }
                          >
                            <Page
                              pageNumber={1}
                              width={120}
                              renderTextLayer={false}
                              renderAnnotationLayer={false}
                            />
                          </Document>
                        </div>
                      )}
                      {doc.type === 'video' && (
                        <div className="w-full h-full flex items-center justify-center bg-purple-900/20">
                          <span className="text-4xl">🎥</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                        <p className="text-xs text-white truncate">{doc.name}</p>
                      </div>
                      {/* Bouton de suppression */}
                      <button
                        onClick={(e) => handleViewerDocumentDelete(doc.id, e)}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Supprimer"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Zone Chat - 2/3 droite */}
            <div className="w-2/3 flex flex-col">
              <ChatPanel
                sessionId={session?.id || 0}
                senderType="viewer"
                senderName="Spectateur"
                showDeleteButton={false}
                onLoadDocument={async (url: string, name: string, type: string) => {
                  // Mettre à jour le document actuel de la session (synchronisation avec le présentateur)
                  console.log('[Viewer] onLoadDocument called', { url, name, type, enteredCode });
                  if (enteredCode && (type === 'image' || type === 'pdf' || type === 'video')) {
                    console.log('[Viewer] Calling setCurrentDocumentMutation');
                    setCurrentDocumentMutation.mutate({
                      sessionCode: enteredCode,
                      documentUrl: url,
                      documentName: name,
                      documentType: type as "image" | "pdf" | "video",
                    });
                  }
                }}
              />
            </div>
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

