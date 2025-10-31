"use client";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, Link } from "wouter";
import { ArrowLeft, Users, Copy, Share2, Upload, X, ZoomIn, ZoomOut, Check, Send, Download, MessageCircle, Monitor } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import ChatPanel from "@/components/ChatPanel";
import ProspectPopup from "@/components/ProspectPopup";
import { parseProspectionFile, type ProspectContact } from "@/lib/excelParser";
import { getDeviceInfo } from "@/lib/deviceDetection";
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
  // Rectangle selection states
  const [rectangle, setRectangle] = useState({ x: 0, y: 0, width: 0, height: 0, visible: false });
  const [isDrawingRectangle, setIsDrawingRectangle] = useState(false);
  const [rectangleStart, setRectangleStart] = useState({ x: 0, y: 0 });
  // Viewer preview floating window
  const [showViewerPreview, setShowViewerPreview] = useState(false);
  
  // Prospection system states
  const [prospectContacts, setProspectContacts] = useState<ProspectContact[]>([]);
  const [showProspectPopup, setShowProspectPopup] = useState(false);
  const [currentProspectIndex, setCurrentProspectIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Helper function to update zoom, cursor and rectangle
  const updatePresenterState = (overrides: Partial<{
    zoomLevel: number;
    cursorX: number;
    cursorY: number;
    cursorVisible: boolean;
    panOffsetX: number;
    panOffsetY: number;
    pageNumber: number;
  }> = {}) => {
    if (!currentSession) return;
    updateZoomAndCursorMutation.mutate({
      sessionId: sessionIdNum,
      zoomLevel: overrides.zoomLevel ?? zoom,
      cursorX: overrides.cursorX ?? mousePos.x,
      cursorY: overrides.cursorY ?? mousePos.y,
      cursorVisible: overrides.cursorVisible ?? showMouseCursor,
      panOffsetX: overrides.panOffsetX ?? panOffset.x,
      panOffsetY: overrides.panOffsetY ?? panOffset.y,
      pageNumber: overrides.pageNumber ?? pageNumber,
      rectangleX: rectangle.x,
      rectangleY: rectangle.y,
      rectangleWidth: rectangle.width,
      rectangleHeight: rectangle.height,
      rectangleVisible: rectangle.visible,
    });
  };

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

    // Détecter si c'est un fichier Excel/CSV pour la prospection
    const isProspectionFile = 
      file.name.endsWith('.xlsx') || 
      file.name.endsWith('.xls') || 
      file.name.endsWith('.csv') ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.type === 'text/csv';

    if (isProspectionFile) {
      // Ouvrir le popup de prospection
      try {
        const contacts = await parseProspectionFile(file);
        setProspectContacts(contacts);
        setCurrentProspectIndex(0);
        setShowProspectPopup(true);
      } catch (error) {
        console.error('Erreur de parsing:', error);
        alert('Erreur lors de la lecture du fichier Excel/CSV');
      }
      return;
    }

    // Sinon, traiter comme un document de présentation normal
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'video/mp4'];
    if (!validTypes.includes(file.type)) {
      alert('Format de fichier non supporté. Veuillez utiliser PDF, PNG, JPG, MP4, Excel ou CSV.');
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
      
      updatePresenterState({
        cursorX: xPercent,
        cursorY: yPercent,
        cursorVisible: showMouseCursor && zoom >= 100,
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
        <div className="container mx-auto px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/presenter">
              <Button variant="ghost" size="sm" className="gap-1.5 text-white hover:bg-gray-800 h-7 px-2">
                <ArrowLeft className="w-3.5 h-3.5" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-[9px] font-bold text-white">{currentSession.title}</h1>
              <p className="text-[9px] text-gray-400">Code: {currentSession.sessionCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Bouton Copier le lien */}
            <Button
              onClick={() => copyToClipboard(getShareLink(currentSession.sessionCode))}
              variant="outline"
              className="h-7 px-2 gap-1 bg-gray-700 border-gray-600 hover:bg-gray-600 text-white"
              size="sm"
              title="Copier le lien de partage"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            {/* Bouton WhatsApp */}
            <a
              href={generateWhatsAppLink(currentSession.sessionCode)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                className="h-7 px-2 gap-1 bg-green-600 hover:bg-green-700"
                size="sm"
                title="Partager sur WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
              </Button>
            </a>
            {/* Bouton écran flottant viewer */}
            <Button
              onClick={() => setShowViewerPreview(!showViewerPreview)}
              className="h-7 px-2 gap-1 bg-purple-600 hover:bg-purple-700"
              size="sm"
              title="Afficher la vue lecteur"
            >
              <Monitor className="w-3.5 h-3.5" />
            </Button>
            {/* Bouton Fiches de prospection */}
            <Button
              onClick={() => setShowProspectPopup(!showProspectPopup)}
              className="h-7 px-2 gap-1 bg-blue-600 hover:bg-blue-700"
              size="sm"
              title="Afficher les fiches de prospection"
              disabled={prospectContacts.length === 0}
            >
              📋
            </Button>
            {/* Compteur de spectateurs */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-900 rounded-lg">
              <Users className="w-3 h-3" />
              <span className="text-xs font-bold">{viewerCount}</span>
            </div>
            <Button
              onClick={handleEndSession}
              variant="destructive"
              className="h-7 w-7 p-0"
              title="Terminer la présentation"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-2 flex flex-col gap-2 overflow-hidden">
        {/* Zoom Controls + Upload - Sur la même ligne */}
        <div className="hidden flex items-center gap-2 bg-gray-800 p-1 rounded-lg border border-gray-700">
          <span className="text-xs text-gray-400 whitespace-nowrap">Zoom:</span>
          <Button
            onClick={() => {
              const newZoom = Math.max(50, zoom - 10);
              setZoom(newZoom);
              updatePresenterState({
                zoomLevel: newZoom,
                cursorVisible: showMouseCursor && newZoom > 100,
              });
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
              updatePresenterState({
                zoomLevel: newZoom,
                cursorVisible: showMouseCursor && newZoom > 100,
              });
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
              updatePresenterState({
                zoomLevel: newZoom,
                cursorVisible: showMouseCursor && newZoom > 100,
              });
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
              updatePresenterState({
                zoomLevel: 100,
                cursorVisible: false,
              });
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
                          width={96}
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
            <Card className="border-0 flex-1 flex flex-col overflow-hidden bg-transparent">
              <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
                {/* Mini barre toujours visible pour tous les documents */}
                {displayedDocument && (
                <div className="flex justify-center py-2 bg-gray-900/50">
                  <div className="bg-black/60 backdrop-blur-sm px-3 py-0.5 rounded-full flex items-center gap-2 shadow-lg">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0 text-xs font-bold bg-white/90 hover:bg-white border-none"
                      onClick={() => {
                        const newPage = Math.max(1, pageNumber - 1);
                        setPageNumber(newPage);
                        updatePresenterState({ pageNumber: newPage });
                      }}
                      disabled={pageNumber <= 1 || !numPages}
                    >
                      ←
                    </Button>
                    <input
                      type="text"
                      value={`${pageNumber}/${numPages || '?'}`}
                      onChange={(e) => {
                        const value = e.target.value.split('/')[0];
                        if (value === '' || /^\d+$/.test(value)) {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            setPageNumber(numValue);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value.split('/')[0]);
                        if (isNaN(value) || value < 1) {
                          setPageNumber(1);
                          updatePresenterState({ pageNumber: 1 });
                        } else if (numPages && value > numPages) {
                          setPageNumber(numPages);
                          updatePresenterState({ pageNumber: numPages });
                        } else {
                          updatePresenterState({ pageNumber: value });
                        }
                      }}
                      onFocus={(e) => {
                        e.currentTarget.setSelectionRange(0, String(pageNumber).length);
                      }}
                      className="w-12 h-5 px-1 text-[9px] text-center bg-white/90 text-gray-900 border-none rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0 text-xs font-bold bg-white/90 hover:bg-white border-none"
                      onClick={() => {
                        const newPage = Math.min(numPages || 999, pageNumber + 1);
                        setPageNumber(newPage);
                        updatePresenterState({ pageNumber: newPage });
                      }}
                      disabled={pageNumber >= (numPages || 999) || !numPages}
                    >
                      →
                    </Button>
                    <div className="w-px h-4 bg-gray-400 ml-1"></div>
                    <div className="relative flex flex-col items-center">
                      <input
                        type="range"
                        min="50"
                        max="200"
                        step="5"
                        value={zoom}
                        onChange={(e) => {
                          const newZoom = parseInt(e.target.value);
                          setZoom(newZoom);
                          updatePresenterState({
                            zoomLevel: newZoom,
                            cursorVisible: showMouseCursor && newZoom > 100,
                          });
                        }}
                        className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((zoom - 50) / 150) * 100}%, #6b7280 ${((zoom - 50) / 150) * 100}%, #6b7280 100%)`
                        }}
                      />
                      <span className="absolute -bottom-4 text-white text-[8px] font-semibold">
                        {zoom}%
                      </span>
                    </div>
                    <Button
                      onClick={() => {
                        setZoom(100);
                        setPanOffset({ x: 0, y: 0 });
                        updatePresenterState({
                          zoomLevel: 100,
                          panOffsetX: 0,
                          panOffsetY: 0,
                          cursorVisible: false,
                        });
                      }}
                      variant="outline"
                      size="sm"
                      className="h-5 w-5 p-0 text-[9px] bg-white/90 hover:bg-white border-none font-semibold"
                    >
                      R
                    </Button>
                    <div className="w-px h-4 bg-gray-400 ml-1"></div>
                    <input
                      type="file"
                      id="mini-document-upload-always"
                      accept="image/*,application/pdf,video/*,.xlsx,.xls,.csv"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleUploadDocument(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <div
                      onClick={() => document.getElementById('mini-document-upload-always')?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const files = e.dataTransfer.files;
                        if (files.length > 0) {
                          handleUploadDocument(files[0]);
                        }
                      }}
                      className="border border-dashed border-gray-400 rounded px-2 py-0.5 text-center cursor-pointer hover:border-gray-300 transition-colors ml-1"
                    >
                      <p className="text-[9px] text-gray-300 whitespace-nowrap">Glisser un fichier ici</p>
                    </div>
                  </div>
                </div>
                )}
                {displayedDocument ? (
                  <div
                    className="relative w-full flex-1 flex items-start justify-center overflow-hidden"
                    style={{ cursor: zoom >= 100 ? 'none' : 'default' }}
                    onMouseDown={(e) => {
                      if (e.ctrlKey && imageRef.current) {
                        // Ctrl+Click: Start rectangle selection
                        const containerRect = e.currentTarget.getBoundingClientRect();
                        const imageRect = imageRef.current.getBoundingClientRect();
                        const imageX = e.clientX - imageRect.left;
                        const imageY = e.clientY - imageRect.top;
                        const xPercent = (imageX / imageRect.width) * 100;
                        const yPercent = (imageY / imageRect.height) * 100;
                        
                        setIsDrawingRectangle(true);
                        setRectangleStart({ x: xPercent, y: yPercent });
                        setRectangle({ x: xPercent, y: yPercent, width: 0, height: 0, visible: false });
                      } else if (zoom >= 100) {
                        // Normal click: Pan
                        setIsPanning(true);
                        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
                      }
                    }}
                    onMouseMove={(e) => {
                      if (isDrawingRectangle && imageRef.current) {
                        // Drawing rectangle
                        const imageRect = imageRef.current.getBoundingClientRect();
                        const imageX = e.clientX - imageRect.left;
                        const imageY = e.clientY - imageRect.top;
                        const xPercent = (imageX / imageRect.width) * 100;
                        const yPercent = (imageY / imageRect.height) * 100;
                        
                        const width = xPercent - rectangleStart.x;
                        const height = yPercent - rectangleStart.y;
                        
                        setRectangle({
                          x: width >= 0 ? rectangleStart.x : xPercent,
                          y: height >= 0 ? rectangleStart.y : yPercent,
                          width: Math.abs(width),
                          height: Math.abs(height),
                          visible: true,
                        });
                      } else if (isPanning && zoom >= 100) {
                        setPanOffset({
                          x: e.clientX - panStart.x,
                          y: e.clientY - panStart.y,
                        });
                      }
                      if (!isPanning) {
                        handleMouseMove(e);
                      }
                    }}
                    onMouseUp={() => {
                      if (isDrawingRectangle) {
                        setIsDrawingRectangle(false);
                        // Send rectangle to backend
                        updatePresenterState();
                      }
                      setIsPanning(false);
                    }}
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
                          
                          updatePresenterState({
                            cursorX: xPercent,
                            cursorY: yPercent,
                            cursorVisible: true,
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
                        
                        updatePresenterState({
                          zoomLevel: Math.round(newZoom),
                          cursorVisible: showMouseCursor && newZoom > 100,
                        });
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
                          
                            updatePresenterState({
                              cursorX: xPercent,
                              cursorY: yPercent,
                              cursorVisible: true,
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
                        if (displayedDocumentId) {
                          updatePresenterState({
                            cursorVisible: false,
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
                        {/* Rectangle Selection Overlay */}
                        {rectangle.visible && imageRef.current && (
                          <div
                            className="absolute border-4 border-blue-500 bg-blue-500 bg-opacity-10"
                            style={{
                              left: `${rectangle.x}%`,
                              top: `${rectangle.y}%`,
                              width: `${rectangle.width}%`,
                              height: `${rectangle.height}%`,
                              pointerEvents: 'none',
                            }}
                          >
                            {/* Close Button */}
                            <button
                              onClick={() => {
                                setRectangle({ ...rectangle, visible: false });
                                updatePresenterState();
                              }}
                              className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 pointer-events-auto"
                              title="Fermer la sélection"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    {displayedDocument.type === "pdf" && (
                      <div 
                        className="w-full h-full flex flex-col items-center justify-center"
                        onMouseDown={(e) => {
                          if (e.shiftKey) {
                            // Shift + Click: Start rectangle selection
                            setIsDrawingRectangle(true);
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                            const y = ((e.clientY - rect.top) / rect.height) * 100;
                            setRectangleStart({ x, y });
                            setRectangle({ x, y, width: 0, height: 0, visible: false });
                          } else {
                            // Normal click: Pan
                            setIsPanning(true);
                            setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
                          }
                        }}
                        onMouseMove={(e) => {
                          if (isDrawingRectangle) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                            const y = ((e.clientY - rect.top) / rect.height) * 100;
                            setRectangle({
                              x: Math.min(rectangleStart.x, x),
                              y: Math.min(rectangleStart.y, y),
                              width: Math.abs(x - rectangleStart.x),
                              height: Math.abs(y - rectangleStart.y),
                              visible: true,
                            });
                          } else if (isPanning && zoom >= 100) {
                            setPanOffset({
                              x: e.clientX - panStart.x,
                              y: e.clientY - panStart.y,
                            });
                          }
                          if (!isPanning) {
                            handleMouseMove(e);
                          }
                        }}
                        onMouseUp={() => {
                          if (isDrawingRectangle) {
                            setIsDrawingRectangle(false);
                            updatePresenterState({
                              rectangleX: rectangle.x,
                              rectangleY: rectangle.y,
                              rectangleWidth: rectangle.width,
                              rectangleHeight: rectangle.height,
                              rectangleVisible: rectangle.visible,
                            });
                          }
                          setIsPanning(false);
                          updatePresenterState();
                        }}
                        onMouseLeave={() => {
                          setIsPanning(false);
                          setIsDrawingRectangle(false);
                        }}
                        onTouchStart={(e) => {
                          if (e.touches.length === 1) {
                            setIsPanning(true);
                            setPanStart({
                              x: e.touches[0].clientX - panOffset.x,
                              y: e.touches[0].clientY - panOffset.y,
                            });
                          }
                        }}
                        onTouchMove={(e) => {
                          if (isPanning && e.touches.length === 1 && zoom >= 100) {
                            setPanOffset({
                              x: e.touches[0].clientX - panStart.x,
                              y: e.touches[0].clientY - panStart.y,
                            });
                          }
                        }}
                        onTouchEnd={() => {
                          setIsPanning(false);
                          updatePresenterState();
                        }}
                        style={{ cursor: isPanning ? 'grabbing' : (zoom >= 100 ? 'grab' : 'default') }}
                      >
                        {/* Barre PDF supprimée - utilisation de la mini barre universelle centrée en haut */}
                        <Document
                          key={displayedDocument.fileUrl}
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
                          className="flex flex-col items-center"
                        >
                          <div style={{
                            transform: `scale(${zoom / 100}) translate(${panOffset.x / (zoom / 100)}px, ${panOffset.y / (zoom / 100)}px)`,
                            transition: isPanning ? 'none' : 'transform 0.2s ease-out',
                          }}>
                            <Page
                              pageNumber={pageNumber}
                              width={typeof window !== 'undefined' ? (window.innerWidth < 768 ? window.innerWidth * 0.95 : Math.min(window.innerWidth * 0.8, 900)) : 800}
                              className="max-w-full"
                              renderTextLayer={true}
                              renderAnnotationLayer={true}
                            />
                          </div>
                        </Document>
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

      {/* Floating Viewer Preview Window */}
      {showViewerPreview && currentSession && (
        <div
          className="fixed bg-gray-900 border-2 border-purple-500 rounded-lg shadow-2xl overflow-hidden z-50"
          style={{
            top: '100px',
            right: '20px',
            width: '400px',
            height: '600px',
            resize: 'both',
            minWidth: '300px',
            minHeight: '600px',
            maxWidth: '90vw',
            maxHeight: '95vh',
          }}
        >
          {/* Header */}
          <div className="bg-blue-600 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-semibold">Vue Lecteur</span>
            </div>
            <Button
              onClick={() => setShowViewerPreview(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-white hover:bg-blue-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {/* Iframe */}
          <iframe
            src={`/view/${currentSession.sessionCode}`}
            className="w-full h-[calc(100%-40px)] border-0"
            title="Vue Lecteur"
            style={{ overflow: 'auto' }}
          />
        </div>
      )}

      {/* Fenêtre flottante Fiches de prospection */}
      {showProspectPopup && prospectContacts.length > 0 && (
        <div
          className="fixed z-50 bg-blue-50 rounded-lg shadow-2xl border-4 border-blue-600 overflow-hidden"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '800px',
            height: '600px',
            minWidth: '300px',
            minHeight: '600px',
            maxWidth: '90vw',
            maxHeight: '95vh',
          }}
        >
          {/* Header */}
          <div className="bg-blue-600 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-semibold">📋 Fiches de prospection</span>
            </div>
            <Button
              onClick={() => setShowProspectPopup(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-white hover:bg-blue-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {/* Content */}
          <div className="w-full h-[calc(100%-40px)] overflow-y-auto p-4">
            <ProspectPopup
              open={true}
              onClose={() => setShowProspectPopup(false)}
              contacts={prospectContacts}
              currentIndex={currentProspectIndex}
              onNavigate={(index) => setCurrentProspectIndex(index)}
              onEnrich={async (contact) => {
                // Simulation de recherche (2 secondes)
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Générer des données uniques basées sur le nom/prénom/âge
                const age = parseInt(contact.age);
                const nameHash = (contact.nom + contact.prenom).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                
                // Postes variés selon l'âge
                const postes = age < 30 
                  ? ['Chargé de Clientèle', 'Commercial Junior', 'Assistant Commercial', 'Conseiller Client']
                  : age < 45
                  ? ['Directeur Commercial', 'Responsable Développement', 'Chef des Ventes', 'Manager Commercial']
                  : ['Directeur Général', 'Directeur Régional', 'Président', 'Vice-Président'];
                
                // Formations adaptées à l'âge
                const formations = age < 30
                  ? ['BTS Commerce', 'DUT Gestion', 'Licence Économie - Sorbonne', 'Licence Commerce']
                  : age < 45
                  ? ['Master Commerce - ESSEC', 'Master Marketing - Sciences Po', 'École de Commerce - EDHEC', 'Master Gestion']
                  : ['MBA - HEC Paris', 'Executive MBA - INSEAD', 'Doctorat Économie', 'Grande École Commerce'];
                
                // Entreprises variées
                const entreprises = ['Acme Corporation', 'TechCorp', 'InnovateLab', 'FutureTech', 'GlobalSolutions', 'SmartBusiness', 'NextGen SA', 'Visionary Group'];
                
                // Secteurs variés
                const secteurs = ['Tech / SaaS', 'Finance', 'Santé', 'E-commerce', 'Industrie', 'Services', 'Consulting', 'Marketing'];
                
                // Tailles d'entreprise variées
                const tailles = ['1-10 employés', '10-50 employés', '50-200 employés', '200-500 employés', '500+ employés'];
                
                // Sélection basée sur le hash du nom (pour cohérence)
                const posteIndex = nameHash % postes.length;
                const entrepriseIndex = (nameHash * 2) % entreprises.length;
                const secteurIndex = (nameHash * 3) % secteurs.length;
                const formationIndex = (nameHash * 5) % formations.length;
                const tailleIndex = (nameHash * 7) % tailles.length;
                
                // Couleurs variées pour l'avatar
                const couleurs = ['3b82f6', 'ef4444', '10b981', 'f59e0b', '8b5cf6', 'ec4899', '06b6d4', '84cc16'];
                const couleurIndex = nameHash % couleurs.length;
                
                // Calculer la date de naissance à partir de l'âge
                const currentYear = new Date().getFullYear();
                const birthYear = currentYear - age;
                // Générer un mois et jour aléatoires mais cohérents (basés sur le hash)
                const birthMonth = (nameHash % 12) + 1; // 1-12
                const birthDay = (nameHash % 28) + 1; // 1-28 (pour éviter les problèmes de mois)
                const birthDate = `${birthDay.toString().padStart(2, '0')}/${birthMonth.toString().padStart(2, '0')}/${birthYear}`;
                
                return {
                  fullName: `${contact.prenom} ${contact.nom}`,
                  birthDate: birthDate,
                  jobTitle: postes[posteIndex],
                  company: entreprises[entrepriseIndex],
                  age: age,
                  photoUrl: `https://ui-avatars.com/api/?name=${contact.prenom}+${contact.nom}&size=128&background=${couleurs[couleurIndex]}&color=fff`,
                  linkedinUrl: `https://linkedin.com/in/${contact.prenom.toLowerCase()}-${contact.nom.toLowerCase()}`,
                  education: formations[formationIndex],
                  companySize: tailles[tailleIndex],
                  industry: secteurs[secteurIndex],
                };
              }}
              onSave={async (contact, enrichedData, notes, rappelDate, status) => {
                // Simulation de sauvegarde
                console.log('Sauvegarde:', { contact, enrichedData, notes, rappelDate, status });
                alert(`Fiche sauvegardée pour ${contact.prenom} ${contact.nom} !\nStatut: ${status}\nRappel: ${rappelDate || 'Aucun'}`);
              }}
              deviceInfo={getDeviceInfo()}
            />
          </div>
        </div>
      )}

    </div>
  );
}

