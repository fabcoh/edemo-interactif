import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Mail, User, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { APP_TITLE, APP_LOGO } from "@/const";

export default function InvitationAccept() {
  const [, params] = useRoute("/invite/:token");
  const token = params?.token || "";
  
  const [email, setEmail] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptedSuccessfully, setAcceptedSuccessfully] = useState(false);

  // Query to get invitation details
  const invitationQuery = trpc.invitation.getInvitationByToken.useQuery(
    { token },
    { enabled: !!token }
  );

  // Mutation to accept invitation
  const acceptInvitationMutation = trpc.invitation.acceptInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation acceptée avec succès!");
      setAcceptedSuccessfully(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
      setIsAccepting(false);
    },
  });

  // Pre-fill email when invitation data is loaded
  useEffect(() => {
    if (invitationQuery.data?.email) {
      setEmail(invitationQuery.data.email);
    }
  }, [invitationQuery.data]);

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("L'email est requis");
      return;
    }

    setIsAccepting(true);
    acceptInvitationMutation.mutate({
      token,
      email: email.trim(),
    });
  };

  // Loading state
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Token manquant
            </CardTitle>
            <CardDescription>
              Le lien d'invitation semble invalide.
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

  // Success state
  if (acceptedSuccessfully) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">
              Invitation Acceptée !
            </CardTitle>
            <CardDescription>
              Votre compte commercial a été créé avec succès.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                Vous allez être redirigé vers la page de connexion dans quelques secondes...
              </p>
            </div>
            
            <Button 
              onClick={() => window.location.href = "/"}
              className="w-full"
            >
              Accéder à {APP_TITLE}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <div className="flex items-center gap-3">
              {APP_LOGO && (
                <img src={APP_LOGO} alt="Logo" className="w-8 h-8" />
              )}
              <h1 className="text-xl font-bold text-gray-900">
                {APP_TITLE}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          
          {/* Loading state */}
          {invitationQuery.isLoading && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">
                    Vérification de l'invitation...
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error state */}
          {invitationQuery.error && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Invitation Invalide
                </CardTitle>
                <CardDescription>
                  {invitationQuery.error.message}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800">
                      Cette invitation n'existe pas ou a déjà été utilisée.
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => window.location.href = "/"}
                    className="w-full"
                  >
                    Retour à l'accueil
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success state - Show form */}
          {invitationQuery.data && (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle>
                  Accepter l'Invitation
                </CardTitle>
                <CardDescription>
                  Vous avez été invité à rejoindre {APP_TITLE} en tant que commercial
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-6">
                  
                  {/* Invitation details */}
                  <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                    <h3 className="font-medium text-blue-900">
                      Détails de l'invitation :
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-800">
                          Email : {invitationQuery.data.email}
                        </span>
                      </div>
                      
                      {invitationQuery.data.name && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-800">
                            Nom : {invitationQuery.data.name}
                          </span>
                        </div>
                      )}
                    </div>

                    <Badge className="bg-blue-600">
                      Rôle : Commercial
                    </Badge>
                  </div>

                  {/* Email confirmation form */}
                  <form onSubmit={handleAcceptInvitation} className="space-y-4">
                    <div>
                      <Label htmlFor="email">
                        Confirmez votre adresse email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        required
                        className="mt-1"
                        disabled={isAccepting}
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Cette adresse doit correspondre à celle de l'invitation
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isAccepting || acceptInvitationMutation.isPending}
                    >
                      {isAccepting || acceptInvitationMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Création du compte...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accepter l'Invitation
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Information box */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Que se passe-t-il ensuite ?
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Votre compte commercial sera créé automatiquement</li>
                      <li>• Vous pourrez créer et gérer des présentations</li>
                      <li>• Vous aurez accès à tous les outils de présentation</li>
                      <li>• Vous pourrez partager vos présentations via WhatsApp</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
