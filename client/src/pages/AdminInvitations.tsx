import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, Plus, Calendar, User, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export default function AdminInvitations() {
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState("");

  // Queries
  const linksQuery = trpc.admin.getCommercialInvitations.useQuery();
  
  // Mutations
  const createLinkMutation = trpc.admin.createCommercialInvitation.useMutation({
    onSuccess: (data) => {
      toast.success("Lien d'accès créé avec succès!");
      setName("");
      linksQuery.refetch();
      
      // Copy access link to clipboard
      navigator.clipboard.writeText(data.accessLink);
      toast.info("Lien d'accès copié dans le presse-papiers");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteLinkMutation = trpc.admin.deleteCommercialInvitation.useMutation({
    onSuccess: () => {
      toast.success("Lien d'accès supprimé");
      linksQuery.refetch();
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

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    createLinkMutation.mutate({
      name: name.trim(),
    });
  };

  const handleDeleteLink = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce lien d'accès ?")) {
      deleteLinkMutation.mutate({ id });
    }
  };

  const copyAccessLink = (token: string) => {
    const accessLink = `${window.location.origin}/commercial/${token}`;
    navigator.clipboard.writeText(accessLink);
    toast.success("Lien d'accès copié!");
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
                Administration - Liens d'Accès Commerciaux
              </h1>
              <p className="text-gray-600">
                Gérez les liens d'accès pour les commerciaux
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
                  Créer un Lien d'Accès
                </CardTitle>
                <CardDescription>
                  Générez un lien d'accès pour un commercial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateLink} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom du commercial *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jean Dupont"
                      required
                      className="mt-1"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createLinkMutation.isPending}
                  >
                    {createLinkMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Création...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Créer le Lien
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Comment ça fonctionne :
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Un lien d'accès unique sera généré</li>
                    <li>• Le commercial accède directement via ce lien</li>
                    <li>• Il peut créer ses propres sessions</li>
                    <li>• Vous pouvez révoquer l'accès à tout moment</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des liens */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Liens d'Accès Existants
                  {linksQuery.data && (
                    <Badge variant="secondary">
                      {linksQuery.data.length}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Liste de tous les liens d'accès commerciaux
                </CardDescription>
              </CardHeader>
              <CardContent>
                {linksQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Chargement des liens...</span>
                  </div>
                ) : linksQuery.error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600">
                      Erreur lors du chargement : {linksQuery.error.message}
                    </p>
                    <Button
                      onClick={() => linksQuery.refetch()}
                      variant="outline"
                      className="mt-2"
                    >
                      Réessayer
                    </Button>
                  </div>
                ) : !linksQuery.data || linksQuery.data.length === 0 ? (
                  <div className="text-center py-8">
                    <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun lien d'accès créé</p>
                    <p className="text-sm text-gray-500">
                      Créez votre premier lien pour donner accès à un commercial
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {linksQuery.data.map((link) => (
                      <div
                        key={link.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">
                                  {link.name}
                                </span>
                              </div>
                              <Badge 
                                variant={link.revoked ? "secondary" : "default"}
                              >
                                {link.revoked ? "Révoqué" : "Actif"}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                <span>Créé le {formatDate(link.createdAt)}</span>
                              </div>
                              {link.lastUsedAt && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3 h-3" />
                                  <span>Dernière utilisation : {formatDate(link.lastUsedAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            {!link.revoked && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyAccessLink(link.token)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteLink(link.id)}
                              disabled={deleteLinkMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {!link.revoked && (
                          <div className="mt-3 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                            {window.location.origin}/commercial/{link.token}
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

