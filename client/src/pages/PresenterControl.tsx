"use client";

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, Link } from "wouter";
import { ArrowLeft, Users, Copy, Share2, Upload, X, ZoomIn, ZoomOut, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

/**
 * Presenter Control Page - Control document display during presentation
 * Layout: Thumbnails on top with previews, centered preview below, controls on right
 */
export default function PresenterControl() {
  const { isAuthenticated } = useAuth();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [displayedDocumentId, setDisplayedDocumentId] = useState<number | null>(null);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [zoom, setZoom] = useState(100);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showMouseCursor, setShowMouseCursor] = useState(false);

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
      const base64 = (e.target?.result as string).split(',')[1];
      const fileType = file.type === 'application/pdf' ? 'pdf' : file.type.startsWith('image/') ? 'image' : 'video';

      await uploadDocumentMutation.mutateAsync({
        sessionId: sessionIdNum,
        title: file.name.replace(/\.[^/.]+$/, ''),
        type: fileType as 'pdf' | 'image' | 'video',
        fileData: base64,
        fileName: file.name,
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
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
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

      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col gap-6 overflow-hidden">
        {/* Thumbnails Bar - Top */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Documents ({documents.length})</h2>
            <input
              id="document-upload"
              type="file"
              accept=".pdf,image/png,image/jpeg,.mp4"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleUploadDocument(e.target.files[0]);
                }
              }}
              disabled={uploadDocumentMutation.isPending}
              className="hidden"
            />
            <Button
              onClick={() => document.getElementById('document-upload')?.click()}
              disabled={uploadDocumentMutation.isPending}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Upload className="w-4 h-4" />
              {uploadDocumentMutation.isPending ? "Upload..." : "Ajouter"}
            </Button>
          </div>

          {/* Horizontal Thumbnails Scroll with Previews */}
          <div className="flex gap-3 overflow-x-auto pb-2 bg-gray-800 p-3 rounded-lg">
            {documentsQuery.isLoading ? (
              <div className="text-center py-4 text-gray-400 w-full">Chargement...</div>
            ) : documents.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-sm w-full">
                Aucun document
              </div>
            ) : (
              documents.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="flex-shrink-0 relative group cursor-pointer"
                  onClick={() => setSelectedDocumentId(doc.id)}
                  onDoubleClick={() => handleDisplayDocument(doc.id)}
                >
                  {/* Thumbnail with Preview */}
                  <div
                    className={`w-28 h-36 rounded-lg overflow-hidden border-2 transition-all flex items-center justify-center ${
                      selectedDocumentId === doc.id
                        ? "border-blue-500 ring-2 ring-blue-400"
                        : "border-gray-600 hover:border-gray-400"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDocumentId(doc.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleDisplayDocument(doc.id);
                    }}
                    style={{
                      backgroundImage: `linear-gradient(135deg, hsl(${(doc.id * 60) % 360}, 70%, 50%), hsl(${(doc.id * 60 + 60) % 360}, 70%, 50%))`
                    }}
                  >
                    {doc.type === "image" && (
                      <>
                        <img
                          src={doc.fileUrl}
                          alt={doc.title}
                          className="w-full h-full object-cover pointer-events-none"
                          onError={(e) => {
                            // Hide image on error, show fallback
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white pointer-events-none">
                          <div className="text-3xl mb-1">🖼️</div>
                          <div className="text-xs text-center px-2 font-semibold line-clamp-2">{doc.title}</div>
                        </div>
                      </>
                    )}
                    {doc.type === "pdf" && (
                      <div className="text-center flex flex-col items-center justify-center">
                        <div className="text-3xl mb-1">📄</div>
                        <div className="text-xs text-white font-semibold text-center px-2 line-clamp-2">{doc.title}</div>
                      </div>
                    )}
                    {doc.type === "video" && (
                      <div className="text-center flex flex-col items-center justify-center">
                        <div className="text-3xl mb-1">🎬</div>
                        <div className="text-xs text-white font-semibold text-center px-2 line-clamp-2">{doc.title}</div>
                      </div>
                    )}
                  </div>

                  {/* Number Badge */}
                  <div className="absolute top-1 left-1 bg-black bg-opacity-70 text-white text-xs font-bold px-2 py-1 rounded">
                    {idx + 1}
                  </div>

                  {/* Checkmark if Displayed */}
                  {displayedDocumentId === doc.id && (
                    <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}

                  {/* Double-click Hint */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all rounded-lg">
                    <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs font-bold">2x</p>
                      <p className="text-xs">afficher</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
          {/* Center - Preview Area */}
          <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
            <Card className="bg-gray-800 border-gray-700 flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {displayedDocument ? displayedDocument.title : "Aucun document affiché"}
                  </CardTitle>
                  {displayedDocument && (
                    <Button
                      onClick={handleClearDisplay}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center overflow-hidden relative">
                {displayedDocument ? (
                  <div
                    className="relative w-full h-full flex items-center justify-center cursor-crosshair"
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setShowMouseCursor(true)}
                    onMouseLeave={() => setShowMouseCursor(false)}
                  >
                    {displayedDocument.type === "image" && (
                      <>
                        <img
                          src={displayedDocument.fileUrl}
                          alt={displayedDocument.title}
                          className="max-w-full max-h-full object-contain transition-transform"
                          style={{
                            transform: `scale(${zoom / 100})`,
                          }}
                        />
                        {/* Cursor Indicator - Visible to Presenter */}
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
                        <p className="text-gray-400">{displayedDocument.title}</p>
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
                    <p className="text-lg mb-2">Sélectionnez un document</p>
                    <p className="text-sm">Clic pour sélectionner</p>
                    <p className="text-sm">Double-clic pour afficher</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Zoom Controls */}
            {displayedDocument?.type === "image" && (
              <div className="flex items-center gap-2 bg-gray-800 p-3 rounded-lg border border-gray-700">
                <Button
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  variant="outline"
                  size="sm"
                  className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <div className="flex-1 text-center text-sm font-semibold">
                  {zoom}%
                </div>
                <Button
                  onClick={() => setZoom(Math.min(200, zoom + 10))}
                  variant="outline"
                  size="sm"
                  className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setZoom(100)}
                  variant="outline"
                  size="sm"
                  className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                >
                  Réinitialiser
                </Button>
              </div>
            )}
          </div>

          {/* Right Panel - Controls & Info */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {/* Format Controls */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Format</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={orientation} onValueChange={(val) => setOrientation(val as "portrait" | "landscape")}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="portrait">📱 Portrait</SelectItem>
                    <SelectItem value="landscape">🖥️ Paysage</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Share Panel */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Partager</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => copyToClipboard(getShareLink(currentSession.sessionCode))}
                  variant="outline"
                  className="w-full gap-2 bg-gray-700 border-gray-600 hover:bg-gray-600 text-white"
                  size="sm"
                >
                  <Copy className="w-4 h-4" />
                  Copier Lien
                </Button>

                <a
                  href={generateWhatsAppLink(currentSession.sessionCode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full gap-2 bg-green-600 hover:bg-green-700" size="sm">
                    <Share2 className="w-4 h-4" />
                    WhatsApp
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Info Panel */}
            <Card className="bg-gray-800 border-gray-700 flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Infos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <p className="text-gray-400">Code:</p>
                  <p className="font-mono font-bold">{currentSession.sessionCode}</p>
                </div>
                <div>
                  <p className="text-gray-400">Spectateurs:</p>
                  <p className="font-bold">{viewerCount}</p>
                </div>
                <div>
                  <p className="text-gray-400">Documents:</p>
                  <p className="font-bold">{documents.length}</p>
                </div>
                <div>
                  <p className="text-gray-400">Titre:</p>
                  <p className="font-bold truncate">{currentSession.title}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

