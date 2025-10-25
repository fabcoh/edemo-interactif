import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2, CheckCircle } from "lucide-react";

export default function CommercialAccess() {
  const [, params] = useRoute("/commercial/:token");
  const [, setLocation] = useLocation();
  const token = params?.token || "";

  // Verify commercial link
  const linkQuery = trpc.invitation.verifyCommercialLink.useQuery(
    { token },
    { 
      enabled: !!token,
      retry: false,
    }
  );

  // Redirect to dashboard after successful verification
  useEffect(() => {
    if (linkQuery.data?.valid) {
      // Store commercial token in sessionStorage for later use
      sessionStorage.setItem("commercialToken", token);
      sessionStorage.setItem("commercialName", linkQuery.data.name);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
    }
  }, [linkQuery.data, token, setLocation]);

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
              Le lien d'accès semble invalide.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (linkQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">Vérification du lien d'accès...</p>
                <p className="text-sm text-gray-600 mt-1">Veuillez patienter</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (linkQuery.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Accès refusé
            </CardTitle>
            <CardDescription>
              {linkQuery.error.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Le lien d'accès est invalide ou a été révoqué. Veuillez contacter l'administrateur.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (linkQuery.data?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">Accès autorisé !</p>
                <p className="text-sm text-gray-600 mt-1">
                  Bienvenue, {linkQuery.data.name}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Redirection vers le tableau de bord...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

