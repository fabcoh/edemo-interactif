import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, Link } from "wouter";
import { Upload, FileText, Image, Video, ArrowLeft } from "lucide-react";

/**
 * Presenter Session Page - Upload and manage documents for a specific session
 */
export default function PresenterSession() {
  const { isAuthenticated } = useAuth();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const sessionIdNum = sessionId ? parseInt(sessionId) : 0;

  // Queries
  const sessionsQuery = trpc.presentation.getSessions.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const documentsQuery = trpc.documents.getSessionDocuments.useQuery(
    { sessionId: sessionIdNum },
    { enabled: !!sessionIdNum && isAuthenticated }
  );

  // Mutations
  const uploadDocumentMutation = trpc.documents.uploadDocument.useMutation({
    onSuccess: () => {
      setUploadedFiles([]);
      setUploadProgress({});
      documentsQuery.refetch();
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès Refusé</CardTitle>
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

  const sessions = sessionsQuery.data || [];
  const currentSession = sessions.find(s => s.id === sessionIdNum);
  const documents = documentsQuery.data || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const handleUploadFile = async (file: File) => {
    const fileType = getFileType(file.type);
    if (!fileType) {
      alert("Type de fichier non supporté. Utilisez PDF, images ou vidéos.");
      return;
    }

    try {
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileData = event.target?.result as string;
        const base64Data = fileData.split(",")[1];

        await uploadDocumentMutation.mutateAsync({
          sessionId: sessionIdNum,
          title: file.name.replace(/\.[^/.]+$/, ""),
          type: fileType,
          fileData: base64Data,
          fileName: file.name,
          mimeType: file.type,
        });

        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Erreur lors du téléchargement du fichier");
    }
  };

  const getFileType = (mimeType: string): "pdf" | "image" | "video" | null => {
    if (mimeType.includes("pdf")) return "pdf";
    if (mimeType.includes("image")) return "image";
    if (mimeType.includes("video")) return "video";
    return null;
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-5 h-5" />;
      case "image":
        return <Image className="w-5 h-5" />;
      case "video":
        return <Video className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
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
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
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
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Ajouter des Documents</CardTitle>
                <CardDescription>
                  Téléchargez vos fichiers (PDF, images, vidéos)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* File Input */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.mp4,.webm,.mov"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-input"
                    />
                    <label htmlFor="file-input" className="cursor-pointer block">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm font-semibold text-gray-700">
                        Cliquez pour sélectionner
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ou glissez-déposez vos fichiers
                      </p>
                    </label>
                  </div>

                  {/* Selected Files */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Fichiers Sélectionnés:</h4>
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm truncate">{file.name}</span>
                          <button
                            onClick={() => {
                              setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx));
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Button */}
                  <Button
                    onClick={() => {
                      uploadedFiles.forEach(file => handleUploadFile(file));
                    }}
                    disabled={uploadedFiles.length === 0 || uploadDocumentMutation.isPending}
                    className="w-full"
                  >
                    {uploadDocumentMutation.isPending
                      ? "Téléchargement..."
                      : `Télécharger ${uploadedFiles.length} fichier${uploadedFiles.length !== 1 ? "s" : ""}`}
                  </Button>

                  {/* File Type Info */}
                  <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-900">
                    <p className="font-semibold mb-1">Formats Supportés:</p>
                    <ul className="space-y-1">
                      <li>📄 PDF</li>
                      <li>🖼️ Images (PNG, JPG, GIF)</li>
                      <li>🎬 Vidéos (MP4, WebM, MOV)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documents List */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Documents de la Présentation</CardTitle>
                <CardDescription>
                  {documents.length} document{documents.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documentsQuery.isLoading ? (
                  <div className="text-center py-8 text-gray-500">Chargement...</div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-4">Aucun document pour le moment</p>
                    <p className="text-sm">Téléchargez vos premiers documents pour commencer</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc, idx) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                            {getDocumentIcon(doc.type)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{doc.title}</h4>
                          <p className="text-xs text-gray-600">
                            {doc.type.toUpperCase()} • Position {idx + 1}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {doc.mimeType}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next Steps */}
            {documents.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-base">Prochaines Étapes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Retournez au Tableau de Bord</p>
                      <p className="text-xs text-gray-600">Allez à l'onglet "Partage"</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Partagez le Lien</p>
                      <p className="text-xs text-gray-600">Copiez le lien ou partagez sur WhatsApp</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Commencez la Présentation</p>
                      <p className="text-xs text-gray-600">Sélectionnez un document pour l'afficher</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

