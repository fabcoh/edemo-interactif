import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, Plus, Mail, Calendar, User, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export default function AdminInvitations() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Queries
  const invitationsQuery = trpc.admin.getCommercialInvitations.useQuery();
  
  // Mutations
  const createInvitationMutation = trpc.admin.createCommercialInvitation.useMutation({
    onSuccess: (data) => {
      toast.success("Invitation créée avec succès!");
      setEmail("");
      setName("");
      setIsCreating(false);
      invitationsQuery.refetch();
      
      // Copy invitation link to clipboard
      navigator.clipboard.writeText(data.inviteLink);
      toast.info("Lien d'invitation copié dans le presse-papiers");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteInvitationMutation = trpc.admin.deleteCommercialInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation supprimée");
      invitationsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Loading states
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Check if user is admin
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Accès refusé</CardTitle>
            <CardDescription>
              Vous devez être administrateur pour accéder à cette page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = "/"}
              className="w-full"
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("L'email est requis");
      return;
    }

    createInvitationMutation.mutate({
      email: email.trim(),
      name: name.trim() || undefined,
    });
  };

  const handleDeleteInvitation = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette invitation ?")) {
      deleteInvitationMutation.mutate({ id });
    }
  };

  const copyInviteLink = (token: string) => {
    const inviteLink = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Lien d'invitation copié!");
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Administration - Invitations Commerciales
              </h1>
              <p className="text-gray-600">
                Gérez les invitations pour les comptes commerciaux
              </p>
            </div>
            <Button
              onClick={() => window.location.href = "/"}
              variant="outline"
            >
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulaire de création */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Créer une Invitation
                </CardTitle>
                <CardDescription>
                  Invitez un nouveau commercial à rejoindre la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateInvitation} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email du commercial *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="commercial@exemple.com"
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="name">Nom (optionnel)</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jean Dupont"
                      className="mt-1"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createInvitationMutation.isPending}
                  >
                    {createInvitationMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Création...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Créer l'Invitation
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Comment ça fonctionne :
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Un lien unique sera généré</li>
                    <li>• Le commercial devra confirmer son email</li>
                    <li>• Son compte sera créé automatiquement</li>
                    <li>• Il pourra créer des présentations</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des invitations */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Invitations Existantes
                  {invitationsQuery.data && (
                    <Badge variant="secondary">
                      {invitationsQuery.data.length}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Liste de toutes les invitations créées
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invitationsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Chargement des invitations...</span>
                  </div>
                ) : invitationsQuery.error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600">
                      Erreur lors du chargement : {invitationsQuery.error.message}
                    </p>
                    <Button
                      onClick={() => invitationsQuery.refetch()}
                      variant="outline"
                      className="mt-2"
                    >
                      Réessayer
                    </Button>
                  </div>
                ) : !invitationsQuery.data || invitationsQuery.data.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucune invitation créée</p>
                    <p className="text-sm text-gray-500">
                      Créez votre première invitation pour inviter un commercial
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invitationsQuery.data.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">
                                  {invitation.name || invitation.email}
                                </span>
                              </div>
                              <Badge 
                                variant={invitation.used ? "secondary" : "default"}
                              >
                                {invitation.used ? "Utilisée" : "En attente"}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                <span>{invitation.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                <span>Créée le {formatDate(invitation.createdAt)}</span>
                              </div>
                              {invitation.usedAt && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3 h-3" />
                                  <span>Utilisée le {formatDate(invitation.usedAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            {!invitation.used && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyInviteLink(invitation.token)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteInvitation(invitation.id)}
                              disabled={deleteInvitationMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {!invitation.used && (
                          <div className="mt-3 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                            {window.location.origin}/invite/{invitation.token}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
