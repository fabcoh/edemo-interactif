import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, Link } from "wouter";
import { ArrowLeft, Play, Pause, Users, Copy, Share2, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Presenter Control Page - Control document display during presentation
 */
export default function PresenterControl() {
  const { isAuthenticated } = useAuth();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");

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
      refetchInterval: 2000, // Check viewer count every 2 seconds
    }
  );

  // Mutations
  const updateDocumentMutation = trpc.presentation.updateCurrentDocument.useMutation({
    onSuccess: () => {
      // Document updated successfully
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
      // Reset file input
      const fileInput = document.getElementById('document-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    },
  });

  const handleUploadDocument = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'video/mp4'];
    if (!validTypes.includes(file.type)) {
      alert('Format de fichier non supporté. Veuillez utiliser PDF, PNG, JPG ou MP4.');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      alert('Le fichier est trop volumineux. Maximum 100MB.');
      return;
    }

    // Read file as base64
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

  const handleDisplayDocument = async (docId: number | null) => {
    if (!docId) return;
    await updateDocumentMutation.mutateAsync({
      sessionId: sessionIdNum,
      documentId: docId,
      orientation,
    });
  };

  const handleClearDisplay = async () => {
    await updateDocumentMutation.mutateAsync({
      sessionId: sessionIdNum,
      documentId: null,
      orientation,
    });
  };

  const handleEndSession = async () => {
    if (confirm("Êtes-vous sûr de vouloir terminer cette présentation?")) {
      await endSessionMutation.mutateAsync({ sessionId: sessionIdNum });
      // Redirect after ending
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/presenter">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentSession.title}</h1>
              <p className="text-sm text-gray-600">Code: {currentSession.sessionCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-900">{viewerCount} spectateur{viewerCount !== 1 ? "s" : ""}</span>
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

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Documents Panel */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Documents Disponibles</CardTitle>
                <CardDescription>
                  Sélectionnez un document pour l'afficher aux spectateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documentsQuery.isLoading ? (
                  <div className="text-center py-8 text-gray-500">Chargement...</div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-4">Aucun document pour le moment</p>
                    <Link href={`/presenter/session/${sessionIdNum}`}>
                      <Button>Ajouter des Documents</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc, idx) => (
                      <div
                        key={doc.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedDocumentId === doc.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                        onClick={() => setSelectedDocumentId(doc.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{doc.title}</h4>
                            <p className="text-sm text-gray-600">
                              {doc.type.toUpperCase()} • Position {idx + 1}
                            </p>
                          </div>
                          <div className="text-2xl">
                            {doc.type === "pdf" && "📄"}
                            {doc.type === "image" && "🖼️"}
                            {doc.type === "video" && "🎬"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview */}
            {selectedDocumentId && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Aperçu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center ${
                    orientation === "portrait" ? "h-96" : "h-64"
                  }`}>
                    {documents.find(d => d.id === selectedDocumentId)?.type === "image" && (
                      <img
                        src={documents.find(d => d.id === selectedDocumentId)?.fileUrl}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    )}
                    {documents.find(d => d.id === selectedDocumentId)?.type === "pdf" && (
                      <div className="text-center text-gray-600">
                        <div className="text-4xl mb-2">📄</div>
                        <p>PDF - Cliquez sur "Afficher" pour voir le rendu complet</p>
                      </div>
                    )}
                    {documents.find(d => d.id === selectedDocumentId)?.type === "video" && (
                      <div className="text-center text-gray-600">
                        <div className="text-4xl mb-2">🎬</div>
                        <p>Vidéo - Cliquez sur "Afficher" pour lancer la lecture</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Control Panel */}
          <div className="space-y-4">
            {/* Upload Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ajouter un Document</CardTitle>
                <CardDescription>Pendant la présentation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
                    className="w-full gap-2"
                    variant="outline"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadDocumentMutation.isPending ? "Upload..." : "Télécharger"}
                  </Button>
                  <p className="text-xs text-gray-500">PDF, PNG, JPG, MP4 (max 100MB)</p>
                </div>
              </CardContent>
            </Card>

            {/* Display Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Contrôles d'Affichage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Orientation */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Format d'Affichage
                  </label>
                  <Select value={orientation} onValueChange={(val) => setOrientation(val as "portrait" | "landscape")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">📱 Portrait</SelectItem>
                      <SelectItem value="landscape">🖥️ Paysage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Display Button */}
                <Button
                  onClick={() => selectedDocumentId && handleDisplayDocument(selectedDocumentId)}
                  disabled={!selectedDocumentId || updateDocumentMutation.isPending}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Play className="w-4 h-4" />
                  {updateDocumentMutation.isPending ? "Affichage..." : "Afficher"}
                </Button>

                {/* Clear Display Button */}
                <Button
                  onClick={handleClearDisplay}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Pause className="w-4 h-4" />
                  Masquer
                </Button>
              </CardContent>
            </Card>

            {/* Share Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Partager</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => copyToClipboard(getShareLink(currentSession.sessionCode))}
                  variant="outline"
                  className="w-full gap-2"
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
                  <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                    <Share2 className="w-4 h-4" />
                    WhatsApp
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Info Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Infos Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">Code:</p>
                  <p className="font-mono font-bold text-gray-900">{currentSession.sessionCode}</p>
                </div>
                <div>
                  <p className="text-gray-600">Spectateurs actifs:</p>
                  <p className="font-bold text-gray-900">{viewerCount}</p>
                </div>
                <div>
                  <p className="text-gray-600">Documents:</p>
                  <p className="font-bold text-gray-900">{documents.length}</p>
                </div>
                <div>
                  <p className="text-gray-600">Titre:</p>
                  <p className="font-bold text-gray-900 truncate">{currentSession.title}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

