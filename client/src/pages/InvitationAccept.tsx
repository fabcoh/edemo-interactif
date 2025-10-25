import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function InvitationAccept() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to home after 3 seconds
    setTimeout(() => {
      setLocation("/");
    }, 3000);
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-yellow-600 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Page obsolète
          </CardTitle>
          <CardDescription>
            Cette page n'est plus utilisée. Les liens d'invitation ont été remplacés par des liens d'accès directs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Vous allez être redirigé vers la page d'accueil...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

