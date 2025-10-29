import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Save } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AdminSettings() {
  const { user, loading: authLoading } = useAuth();
  const [newPin, setNewPin] = useState("");

  // Queries
  const pinQuery = trpc.admin.getPresenterPin.useQuery();
  
  // Mutations
  const updatePinMutation = trpc.admin.updatePresenterPin.useMutation({
    onSuccess: () => {
      toast.success("Code PIN mis à jour avec succès!");
      setNewPin("");
      pinQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPin.length < 4) {
      toast.error("Le code PIN doit contenir au moins 4 caractères");
      return;
    }
    
    updatePinMutation.mutate({ pin: newPin });
  };

  // Loading states
  if (authLoading || pinQuery.isLoading) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Paramètres Admin</h1>
            <div className="flex gap-2">
              <Link href="/admin/invitations">
                <Button variant="outline">Invitations</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Accueil</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* PIN Settings Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              <CardTitle>Code PIN Présentateur</CardTitle>
            </div>
            <CardDescription>
              Gérez le code PIN requis pour accéder au tableau de bord présentateur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current PIN Display */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label className="text-sm font-medium text-gray-700">Code PIN actuel</Label>
              <div className="mt-2">
                <code className="text-2xl font-bold text-blue-600 tracking-wider">
                  {pinQuery.data?.pin || "****"}
                </code>
              </div>
            </div>

            {/* Update PIN Form */}
            <form onSubmit={handleUpdatePin} className="space-y-4">
              <div>
                <Label htmlFor="newPin">Nouveau code PIN</Label>
                <Input
                  id="newPin"
                  type="text"
                  placeholder="Entrez le nouveau code PIN (4-20 caractères)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="mt-1"
                  minLength={4}
                  maxLength={20}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Le code peut être alphanumérique (lettres et chiffres)
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full gap-2"
                disabled={updatePinMutation.isPending || newPin.length < 4}
              >
                <Save className="w-4 h-4" />
                {updatePinMutation.isPending ? "Mise à jour..." : "Mettre à jour le code PIN"}
              </Button>
            </form>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">ℹ️ Information</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Le code PIN est requis pour accéder au tableau de bord présentateur</li>
                <li>• Tous les présentateurs doivent utiliser le même code PIN</li>
                <li>• Le changement est immédiat et affecte tous les utilisateurs</li>
                <li>• Minimum 4 caractères, maximum 20 caractères</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

