import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Copy, Share2, Trash2, Eye, FileText, Image, Video, Users, Mail, X, Play } from "lucide-react";
import { Link } from "wouter";

/**
 * Presenter Dashboard - Manage presentation sessions and documents
 */
export default function Presenter() {
  const { user, isAuthenticated } = useAuth();
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [showCollaboratorDialog, setShowCollaboratorDialog] = useState(false);

  // Queries
  const sessionsQuery = trpc.presentation.getSessions.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const documentsQuery = trpc.documents.getSessionDocuments.useQuery(
    { sessionId: selectedSessionId || 0 },
    { enabled: !!selectedSessionId }
  );

  // Mutations
  const createSessionMutation = trpc.presentation.createSession.useMutation({
    onSuccess: () => {
      setNewSessionTitle("");
      sessionsQuery.refetch();
    },
  });

  const deleteDocumentMutation = trpc.documents.deleteDocument.useMutation({
    onSuccess: () => {
      documentsQuery.refetch();
    },
  });

  const collaboratorsQuery = trpc.collaboration.getCollaborators.useQuery(
    { sessionId: selectedSessionId || 0 },
    { enabled: !!selectedSessionId }
  );

  const inviteCollaboratorMutation = trpc.collaboration.inviteCollaborator.useMutation({
    onSuccess: () => {
      setCollaboratorEmail("");
      setShowCollaboratorDialog(false);
      collaboratorsQuery.refetch();
    },
  });

  const removeCollaboratorMutation = trpc.collaboration.removeCollaborator.useMutation({
    onSuccess: () => {
      collaboratorsQuery.refetch();
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès Refusé</CardTitle>
            <CardDescription>
              Vous devez être connecté pour accéder au tableau de bord du présentateur
            </CardDescription>
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
  const documents = documentsQuery.data || [];
  const selectedSession = sessionsQuery.data?.find(s => s.id === selectedSessionId);

  const handleCreateSession = async () => {
    if (newSessionTitle.trim()) {
      await createSessionMutation.mutateAsync({ title: newSessionTitle });
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (selectedSessionId) {
      await deleteDocumentMutation.mutateAsync({
        documentId,
        sessionId: selectedSessionId,
      });
    }
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

  const getShareLink = (sessionCode: string) => {
    return `${window.location.origin}/view/${sessionCode}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Lien copié dans le presse-papiers!");
  };

  const generateWhatsAppLink = (sessionCode: string) => {
    const shareLink = getShareLink(sessionCode);
    const message = `Rejoignez ma présentation en direct! ${shareLink}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Présentateur</h1>
            <p className="text-sm text-gray-600">Bienvenue, {user?.name}</p>
          </div>
          <Link href="/">
            <Button variant="outline">Retour</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Create New Session */}
        <div className="mb-8">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle Présentation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une Nouvelle Présentation</DialogTitle>
                <DialogDescription>
                  Donnez un titre à votre présentation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre de la Présentation</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Présentation Q4 2024"
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleCreateSession}
                  disabled={!newSessionTitle.trim() || createSessionMutation.isPending}
                  className="w-full"
                >
                  {createSessionMutation.isPending ? "Création..." : "Créer"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sessions and Documents */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Sessions List */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Mes Présentations</CardTitle>
                <CardDescription>
                  {sessions.length} présentation{sessions.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionsQuery.isLoading ? (
                  <div className="text-center py-8 text-gray-500">Chargement...</div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Aucune présentation. Créez-en une!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div key={session.id} className="space-y-2">
                        <button
                          onClick={() => setSelectedSessionId(session.id)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedSessionId === session.id
                              ? "bg-blue-100 border-2 border-blue-500"
                              : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                          }`}
                        >
                          <div className="font-semibold text-sm">{session.title}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            Code: {session.sessionCode}
                          </div>
                          <div className={`text-xs mt-1 ${session.isActive ? "text-green-600" : "text-red-600"}`}>
                            {session.isActive ? "🟢 Active" : "🔴 Inactive"}
                          </div>
                        </button>
                        {selectedSessionId === session.id && (
                          <Link href={`/presenter/control/${session.id}`}>
                            <Button className="w-full gap-2" size="sm">
                              <Play className="w-4 h-4" />
                              Présenter
                            </Button>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Session Details */}
          <div className="md:col-span-2">
            {selectedSession ? (
              <Tabs defaultValue="documents" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="collaborators">Collaborateurs</TabsTrigger>
                  <TabsTrigger value="share">Partage</TabsTrigger>
                </TabsList>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Documents de la Présentation</CardTitle>
                      <CardDescription>
                        {documents.length} document{documents.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href={`/presenter/session/${selectedSession.id}`}>
                        <Button className="w-full mb-4 gap-2">
                          <Plus className="w-4 h-4" />
                          Ajouter un Document
                        </Button>
                      </Link>

                      {documentsQuery.isLoading ? (
                        <div className="text-center py-8 text-gray-500">Chargement...</div>
                      ) : documents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          Aucun document. Ajoutez-en un!
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {getDocumentIcon(doc.type)}
                                <div>
                                  <div className="font-semibold text-sm">{doc.title}</div>
                                  <div className="text-xs text-gray-600">
                                    {doc.type.toUpperCase()}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Collaborators Tab */}
                <TabsContent value="collaborators" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Collaborateurs
                      </CardTitle>
                      <CardDescription>
                        Invitez d'autres commerciaux à contrôler cette présentation
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Invite Form */}
                      <div className="space-y-3 pb-4 border-b">
                        <Label>Inviter un Collaborateur</Label>
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            placeholder="Email du collaborateur"
                            value={collaboratorEmail}
                            onChange={(e) => setCollaboratorEmail(e.target.value)}
                          />
                          <Button
                            onClick={async () => {
                              if (collaboratorEmail && selectedSessionId) {
                                await inviteCollaboratorMutation.mutateAsync({
                                  sessionId: selectedSessionId,
                                  collaboratorEmail,
                                  permission: "control",
                                });
                              }
                            }}
                            disabled={!collaboratorEmail || inviteCollaboratorMutation.isPending}
                          >
                            <Plus className="w-4 h-4" />
                            Inviter
                          </Button>
                        </div>
                      </div>

                      {/* Collaborators List */}
                      <div>
                        <Label className="mb-3 block">Collaborateurs Actuels</Label>
                        {collaboratorsQuery.isLoading ? (
                          <div className="text-center py-4 text-gray-500">Chargement...</div>
                        ) : (collaboratorsQuery.data || []).length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            Aucun collaborateur pour le moment
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(collaboratorsQuery.data || []).map((collab) => (
                              <div
                                key={collab.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div>
                                  <div className="font-semibold text-sm">{collab.name || "Sans nom"}</div>
                                  <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                                    <Mail className="w-3 h-3" />
                                    {collab.email}
                                  </div>
                                  <div className="text-xs text-blue-600 mt-1">
                                    Permission: {collab.permission}
                                  </div>
                                </div>
                                <button
                                  onClick={async () => {
                                    if (selectedSessionId) {
                                      await removeCollaboratorMutation.mutateAsync({
                                        sessionId: selectedSessionId,
                                        collaboratorId: collab.collaboratorId,
                                      });
                                    }
                                  }}
                                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-900">
                        <p className="font-semibold mb-1">💡 Info:</p>
                        <p>Les collaborateurs peuvent contrôler la présentation avec le même code de session</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Share Tab */}
                <TabsContent value="share" className="space-y-4">
                  {selectedSession ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Partager la Présentation</CardTitle>
                        <CardDescription>
                          Partagez cette présentation avec votre audience
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Code de Session</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              value={selectedSession.sessionCode}
                              readOnly
                              className="font-mono"
                            />
                            <Button
                              variant="outline"
                              onClick={() => copyToClipboard(selectedSession.sessionCode)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label>Lien de Partage</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              value={getShareLink(selectedSession.sessionCode)}
                              readOnly
                              className="text-sm"
                            />
                            <Button
                              variant="outline"
                              onClick={() => copyToClipboard(getShareLink(selectedSession.sessionCode))}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="pt-4 space-y-2">
                          <a
                            href={generateWhatsAppLink(selectedSession.sessionCode)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                              <Share2 className="w-4 h-4" />
                              Partager sur WhatsApp
                            </Button>
                          </a>

                          <Link href={`/view/${selectedSession.sessionCode}`}>
                            <Button variant="outline" className="w-full gap-2">
                              <Eye className="w-4 h-4" />
                              Aperçu Spectateur
                            </Button>
                          </Link>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-900">
                          <p className="font-semibold mb-2">💡 Conseil:</p>
                          <p>
                            Partagez le lien WhatsApp avec votre audience. Ils pourront voir
                            les documents que vous afficherez en temps réel!
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center text-gray-500">
                        Sélectionnez une présentation pour voir les options de partage
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  Sélectionnez une présentation pour voir les détails
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

