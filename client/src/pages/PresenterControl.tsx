"use client";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, Link } from "wouter";
import { ArrowLeft, Users, Copy, Share2, Upload, X, ZoomIn, ZoomOut, Check, Send, Download, MessageCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import ChatPanel from "@/components/ChatPanel";
import { Document, Page, pdfjs } from 'react-pdf';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState(100);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);

  const sessionIdNum = sessionId ? parseInt(sessionId) : 0;

  // Queries
  const sessionsQuery = trpc.presentation.getSessions.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 2000, // Poll every 2s for synchronization
  });

  const documentsQuery = trpc.documents.getSessionDocuments.useQuery(
    { sessionId: sessionIdNum },
    { 
      enabled: !!sessionIdNum && isAuthenticated,
      refetchInterval: 2000, // Poll every 2s for synchronization
    }
  );

  const viewerCountQuery = trpc.presentation.getViewerCount.useQuery(
    { sessionId: sessionIdNum },
    { 
      enabled: !!sessionIdNum && isAuthenticated,
      refetchInterval: 2000, // Poll every 2s for synchronization
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

  const sendMessageMutation = trpc.chat.sendMessage.useMutation();

  // Synchronize displayed document with session's current document (for viewer uploads)
  // MUST be before any conditional returns to respect Rules of Hooks
  const sessions = sessionsQuery.data || [];
  const currentSession = sessions.find(s => s.id === sessionIdNum);
  
  useEffect(() => {
    if (currentSession?.currentDocumentId && currentSession.currentDocumentId !== displayedDocumentId) {
      console.log('[Presenter] Syncing displayed document from session:', currentSession.currentDocumentId);
      setDisplayedDocumentId(currentSession.currentDocumentId);
      setSelectedDocumentId(currentSession.currentDocumentId);
    }
  }, [currentSession?.currentDocumentId, displayedDocumentId]);

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

  const documentsRaw = documentsQuery.data || [];
  
  // Auto-detect file type from URL for all documents
  const documents = documentsRaw.map(doc => ({
    ...doc,
    type: doc.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' as const :
          doc.fileUrl.match(/\.pdf$/i) ? 'pdf' as const :
          doc.type
  }));
  const viewerCount = viewerCountQuery.data?.count || 0;
  const selectedDocument = documents.find(d => d.id === selectedDocumentId);
  const displayedDocumentRaw = documents.find(d => d.id === displayedDocumentId);
  
  // Auto-detect file type from URL if type is incorrect
  const displayedDocument = displayedDocumentRaw ? {
    ...displayedDocumentRaw,
    type: displayedDocumentRaw.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' as const :
          displayedDocumentRaw.fileUrl.match(/\.pdf$/i) ? 'pdf' as const :
          displayedDocumentRaw.type
  } : undefined;

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
    setPageNumber(1); // Reset PDF page number
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
    const message = `Santéo présentation : ${shareLink}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (displayedDocumentId && currentSession && imageRef.current) {
      // Get container and image dimensions
      const containerRect = e.currentTarget.getBoundingClientRect();
      const imageRect = imageRef.current.getBoundingClientRect();
      
      // Position relative to image
      const imageX = e.clientX - imageRect.left;
      const imageY = e.clientY - imageRect.top;
      
      // Position for cursor display (relative to container, but accounting for image position)
      const cursorX = imageRect.left - containerRect.left + imageX;
      const cursorY = imageRect.top - containerRect.top + imageY;
      setMousePos({ x: cursorX, y: cursorY });
      
      // Convert pixel coordinates to percentage (0-100) relative to image
      const xPercent = (imageX / imageRect.width) * 100;
      const yPercent = (imageY / imageRect.height) * 100;
      
      updateZoomAndCursorMutation.mutate({
        sessionId: sessionIdNum,
        zoomLevel: zoom,
        cursorX: xPercent,
        cursorY: yPercent,
        cursorVisible: showMouseCursor && zoom >= 100,
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
              <h1 className="text-sm font-bold">{currentSession.title}</h1>
              <p className="text-[10px] text-gray-400">Code: {currentSession.sessionCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-900 rounded-lg">
              <Users className="w-3 h-3" />
              <span className="text-[10px] text-gray-300">Spectateurs: <span className="font-bold">{viewerCount}</span></span>
            </div>
            <Button
              onClick={handleEndSession}
              variant="destructive"
              className="h-6 px-2 text-[10px]"
            >
              Terminer
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col gap-4 overflow-hidden">
        {/* Zoom Controls + Upload - Sur la même ligne */}
        <div className="flex items-center gap-3 bg-gray-800 p-1.5 rounded-lg border border-gray-700">
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
          {/* Upload Zone */}
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
          <div
            onClick={() => document.getElementById('document-upload')?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const files = e.dataTransfer.files;
              if (files.length > 0) {
                handleUploadDocument(files[0]);
              }
            }}
            className="border-2 border-dashed border-gray-600 rounded-lg px-4 py-1.5 text-center cursor-pointer hover:border-gray-500 transition-colors whitespace-nowrap"
          >
            <p className="text-xs text-gray-400">Glisser un fichier ici</p>
          </div>

          {/* Share Buttons - Copier et WhatsApp */}
          <Button
            onClick={() => copyToClipboard(getShareLink(currentSession.sessionCode))}
            variant="outline"
            className="gap-1 bg-gray-700 border-gray-600 hover:bg-gray-600 text-white h-8 px-3"
            size="sm"
          >
            <Copy className="w-3 h-3" />
            Copier
          </Button>

          <a
            href={generateWhatsAppLink(currentSession.sessionCode)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="gap-1 bg-green-600 hover:bg-green-700 h-8 px-3" size="sm">
              <Share2 className="w-3 h-3" />
              WhatsApp
            </Button>
          </a>
        </div>

        {/* Thumbnails Bar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold">Documents ({documents.length})</h2>
          </div>

          {/* Thumbnails Container */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {documents.map((doc, idx) => (
              <div
                key={doc.id}
                onClick={() => {
                  setSelectedDocumentId(doc.id);
                  handleDisplayDocument(doc.id);
                }}
                className={`flex-shrink-0 w-24 h-24 rounded-lg cursor-pointer transition-all group relative overflow-hidden ${
                  selectedDocumentId === doc.id
                    ? "ring-2 ring-blue-500"
                    : ""
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
                      onError={(e) => {
                        console.error('Image load error:', doc.fileUrl);
                        // Masquer l'image et afficher le gradient de fond
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {/* Bouton WhatsApp en haut à gauche */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent('Regardez ce document : ' + doc.fileUrl)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                      className="absolute top-0.5 left-0.5 bg-green-500 hover:bg-green-600 text-white rounded-full p-0.5 transition-colors z-40 shadow-lg"
                      title="Partager sur WhatsApp"
                    >
                      <MessageCircle className="w-2.5 h-2.5" />
                    </button>
                    {/* Bouton Supprimer en haut à droite - TOUJOURS VISIBLE */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Tentative de suppression du document:', { id: doc.id, type: typeof doc.id, sessionId: sessionIdNum });
                        setDocumentToDelete(doc.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="absolute top-0.5 right-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 transition-colors z-40 shadow-lg"
                      title="Supprimer ce document"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                    {/* Bouton Télécharger en bas à gauche */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const link = document.createElement('a');
                        link.href = doc.fileUrl;
                        link.download = doc.title || 'document';
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="absolute bottom-0.5 left-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-0.5 transition-colors z-30 shadow-lg"
                      title="Télécharger"
                    >
                      <Download className="w-2.5 h-2.5" />
                    </button>
                    {/* Bouton Envoyer en bas à droite - VERT */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Envoyer le document dans le chat
                        sendMessageMutation.mutate({
                          sessionId: sessionIdNum,
                          senderType: "presenter",
                          senderName: currentSession.title,
                          message: doc.title,
                          videoUrl: doc.fileUrl,
                          fileType: doc.type,
                        });
                      }}
                      className="absolute bottom-0.5 right-0.5 bg-green-600 hover:bg-green-700 text-white rounded-full p-0.5 transition-colors z-30"
                      title="Envoyer dans le chat"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </>
                )}
                {doc.type === "pdf" && (
                  <>
                    {/* Fond gradient comme pour les images */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, hsl(${(doc.id * 60) % 360}, 70%, 40%), hsl(${(doc.id * 60 + 60) % 360}, 70%, 40%))`
                      }}
                    />
                    {/* Preview PDF par-dessus le gradient */}
                    <div className="w-full h-full flex items-center justify-center overflow-hidden relative z-10 bg-white/90">
                      <Document
                        file={doc.fileUrl}
                        onLoadError={(error) => {
                          console.error('PDF thumbnail error:', error);
                        }}
                        loading={
                          <div className="text-center">
                            <div className="text-2xl">📄</div>
                            <p className="text-xs text-gray-500 mt-1">Chargement...</p>
                          </div>
                        }
                        error={
                          <div className="text-center">
                            <div className="text-2xl">📄</div>
                            <p className="text-xs text-red-600 mt-1">Erreur</p>
                          </div>
                        }
                      >
                        <Page
                          pageNumber={1}
                          width={64}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      </Document>
                    </div>
                    {/* Bouton Supprimer en haut à droite - TOUJOURS VISIBLE */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Tentative de suppression du document:', { id: doc.id, type: typeof doc.id, sessionId: sessionIdNum });
                        setDocumentToDelete(doc.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="absolute top-0.5 right-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 transition-colors z-40 shadow-lg"
                      title="Supprimer ce document"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                    {/* Bouton Envoyer en bas à droite - VERT */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sendMessageMutation.mutate({
                          sessionId: sessionIdNum,
                          senderType: "presenter",
                          senderName: currentSession.title,
                          message: doc.title,
                          videoUrl: doc.fileUrl,
                          fileType: doc.type,
                        });
                      }}
                      className="absolute bottom-0.5 right-0.5 bg-green-600 hover:bg-green-700 text-white rounded-full p-0.5 transition-colors z-40 shadow-lg"
                      title="Envoyer dans le chat"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </>
                )}
                {doc.type === "video" && (
                  <>
                    <div className="text-center flex flex-col items-center justify-center z-10 relative">
                      <div className="text-4xl">🎬</div>
                    </div>
                    {/* Bouton Supprimer en haut à droite - TOUJOURS VISIBLE */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Tentative de suppression du document:', { id: doc.id, type: typeof doc.id, sessionId: sessionIdNum });
                        setDocumentToDelete(doc.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="absolute top-0.5 right-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 transition-colors z-40 shadow-lg"
                      title="Supprimer ce document"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                    {/* Bouton Envoyer en bas à droite - VERT */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sendMessageMutation.mutate({
                          sessionId: sessionIdNum,
                          senderType: "presenter",
                          senderName: currentSession.title,
                          message: doc.title,
                          videoUrl: doc.fileUrl,
                          fileType: doc.type,
                        });
                      }}
                      className="absolute bottom-0.5 right-0.5 bg-green-600 hover:bg-green-700 text-white rounded-full p-0.5 transition-colors z-40 shadow-lg"
                      title="Envoyer dans le chat"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </>
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
            <Card className="bg-gray-800 border-0 flex-1 flex flex-col overflow-hidden">
              <CardContent className="flex-1 flex items-start justify-center overflow-hidden relative p-0">
                {displayedDocument ? (
                  <div
                    className="relative w-full h-full flex items-start justify-center overflow-hidden"
                    style={{ cursor: zoom >= 100 ? 'none' : 'default' }}
                    onMouseDown={(e) => {
                      if (zoom >= 100) {
                        setIsPanning(true);
                        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
                      }
                    }}
                    onMouseMove={(e) => {
                      if (isPanning && zoom >= 100) {
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
                        if (imageRef.current) {
                          const containerRect = e.currentTarget.getBoundingClientRect();
                          const imageRect = imageRef.current.getBoundingClientRect();
                          const imageX = e.touches[0].clientX - imageRect.left;
                          const imageY = e.touches[0].clientY - imageRect.top;
                          const cursorX = imageRect.left - containerRect.left + imageX;
                          const cursorY = imageRect.top - containerRect.top + imageY;
                          setMousePos({ x: cursorX, y: cursorY });
                        }
                        setShowMouseCursor(true);
                        
                        if (zoom >= 100) {
                          setIsPanning(true);
                          setPanStart({
                            x: e.touches[0].clientX - panOffset.x,
                            y: e.touches[0].clientY - panOffset.y,
                          });
                        }
                        
                        // Send cursor position to viewers (as percentage)
                        if (displayedDocumentId && currentSession && imageRef.current) {
                          const imageRect = imageRef.current.getBoundingClientRect();
                          const imageX = e.touches[0].clientX - imageRect.left;
                          const imageY = e.touches[0].clientY - imageRect.top;
                          const xPercent = (imageX / imageRect.width) * 100;
                          const yPercent = (imageY / imageRect.height) * 100;
                          
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
                        if (imageRef.current) {
                          const containerRect = e.currentTarget.getBoundingClientRect();
                          const imageRect = imageRef.current.getBoundingClientRect();
                          const imageX = e.touches[0].clientX - imageRect.left;
                          const imageY = e.touches[0].clientY - imageRect.top;
                          const cursorX = imageRect.left - containerRect.left + imageX;
                          const cursorY = imageRect.top - containerRect.top + imageY;
                          setMousePos({ x: cursorX, y: cursorY });
                        
                          if (isPanning && zoom >= 100) {
                            setPanOffset({
                              x: e.touches[0].clientX - panStart.x,
                              y: e.touches[0].clientY - panStart.y,
                            });
                          }
                          
                          // Send cursor position to viewers (as percentage)
                          if (displayedDocumentId && currentSession) {
                            const xPercent = (imageX / imageRect.width) * 100;
                            const yPercent = (imageY / imageRect.height) * 100;
                          
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
                        {/* Pointeur main avec doigt */}
                        {showMouseCursor && zoom >= 100 && (
                          <div
                            className="absolute pointer-events-none"
                            style={{
                              left: `${mousePos.x + 0}px`,
                              top: `${mousePos.y + 0}px`,
                              transform: "translate(-50%, -50%)",
                            }}
                          >
                            <div className="text-3xl" style={{ filter: 'drop-shadow(0 0 3px rgba(255, 0, 0, 0.8))' }}>
                              👆
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {displayedDocument.type === "pdf" && (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <Document
                          file={displayedDocument.fileUrl}
                          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                          onLoadError={(error) => {
                            console.error('PDF load error:', error);
                            console.log('Document type:', displayedDocument.type, 'URL:', displayedDocument.fileUrl);
                          }}
                          loading={
                            <div className="text-center">
                              <div className="text-6xl mb-4">📄</div>
                              <p className="text-gray-400">Chargement du PDF...</p>
                            </div>
                          }
                          error={
                            <div className="text-center">
                              <div className="text-6xl mb-4">📄</div>
                              <p className="text-red-400">Impossible de charger le PDF</p>
                              <p className="text-gray-500 text-sm mt-2">{displayedDocument.title}</p>
                            </div>
                          }
                          className="max-w-full max-h-full"
                        >
                          <Page
                            pageNumber={pageNumber}
                            scale={zoom / 100}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                          />
                        </Document>
                        {numPages && numPages > 1 && (
                          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-4 py-2 rounded-lg flex items-center gap-2 z-10">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                              disabled={pageNumber <= 1}
                            >
                              ←
                            </Button>
                            <span className="text-white text-sm">
                              Page {pageNumber} / {numPages}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                              disabled={pageNumber >= numPages}
                            >
                              →
                            </Button>
                          </div>
                        )}
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
            {/* Chat Panel - Allongé vers le bas */}
            <div className="flex-[2] flex flex-col overflow-hidden">
              <ChatPanel
                sessionId={sessionIdNum}
                senderType="presenter"
                senderName={currentSession.title}
                showDeleteButton={true}
                onLoadDocument={async (url, name, type) => {
                  // Trouver le document correspondant dans la liste
                  const doc = documents.find(d => d.fileUrl === url);
                  if (doc) {
                    // Afficher le document pour tous les viewers
                    await handleDisplayDocument(doc.id);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (documentToDelete !== null) {
                  console.log('Suppression confirmée du document:', documentToDelete);
                  deleteDocumentMutation.mutate(
                    { documentId: documentToDelete, sessionId: sessionIdNum },
                    {
                      onSuccess: () => {
                        console.log('Document supprimé avec succès');
                        setDocumentToDelete(null);
                      },
                      onError: (error) => {
                        console.error('Erreur de suppression:', error);
                        setDocumentToDelete(null);
                      }
                    }
                  );
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

