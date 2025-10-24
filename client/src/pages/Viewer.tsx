import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { ArrowLeft, Users } from "lucide-react";

/**
 * Viewer Page - Display presentation content in real-time
 */
export default function Viewer() {
  const [, params] = useLocation();
  const [sessionCode, setSessionCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  // Extract session code from URL if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      setSessionCode(code);
      setEnteredCode(code);
      setIsJoined(true);
    }
  }, []);

  // Real-time query with polling
  const sessionQuery = trpc.presentation.getSessionByCode.useQuery(
    { sessionCode: enteredCode },
    { 
      enabled: isJoined && !!enteredCode,
      refetchInterval: 1000, // Poll every 1 second for real-time updates
    }
  );

  const joinSessionMutation = trpc.viewer.joinSession.useMutation({
    onSuccess: () => {
      setIsJoined(true);
    },
  });

  const handleJoinSession = async () => {
    if (sessionCode.trim()) {
      setEnteredCode(sessionCode);
      setIsJoined(true);
    }
  };

  const handleLeaveSession = () => {
    setSessionCode("");
    setEnteredCode("");
    setIsJoined(false);
  };

  const session = sessionQuery.data;
  const currentDocument = session?.currentDocument;
  const orientation = session?.currentOrientation || "portrait";

  if (!isJoined || !enteredCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Rejoindre une Présentation</CardTitle>
            <CardDescription>
              Entrez le code de session pour voir la présentation en direct
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="code">Code de Session</Label>
              <Input
                id="code"
                placeholder="Ex: ABC12345"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleJoinSession();
                  }
                }}
                className="font-mono text-lg tracking-widest"
              />
            </div>
            <Button
              onClick={handleJoinSession}
              disabled={!sessionCode.trim()}
              className="w-full"
              size="lg"
            >
              Rejoindre
            </Button>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Retour
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Connexion à la présentation...</p>
        </div>
      </div>
    );
  }

  if (sessionQuery.isError || !session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Présentation Non Trouvée</CardTitle>
            <CardDescription>
              Le code de session est invalide ou la présentation est inactive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleLeaveSession}
              className="w-full mb-2"
            >
              Essayer un Autre Code
            </Button>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Retour à l'Accueil
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{session.title}</h1>
          <p className="text-xs text-gray-400">Code: {session.sessionCode}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <Users className="w-4 h-4" />
            <span>En direct</span>
          </div>
          <Button
            onClick={handleLeaveSession}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quitter
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {currentDocument ? (
          <div
            className={`w-full h-full flex items-center justify-center ${
              orientation === "landscape" ? "max-w-6xl" : "max-w-2xl"
            }`}
          >
            {currentDocument.type === "pdf" && (
              <div className="w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden">
                <iframe
                  src={`${currentDocument.fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-full border-none"
                  title="PDF Viewer"
                />
              </div>
            )}

            {currentDocument.type === "image" && (
              <div className="w-full h-full flex items-center justify-center bg-white rounded-lg shadow-2xl overflow-hidden">
                <img
                  src={currentDocument.fileUrl}
                  alt={currentDocument.title}
                  className={`${
                    orientation === "portrait"
                      ? "max-h-full w-auto"
                      : "max-w-full h-auto"
                  }`}
                />
              </div>
            )}

            {currentDocument.type === "video" && (
              <div className="w-full h-full bg-black rounded-lg shadow-2xl overflow-hidden">
                <video
                  src={currentDocument.fileUrl}
                  controls
                  className="w-full h-full"
                  autoPlay
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              En Attente de Contenu
            </h2>
            <p className="text-gray-400">
              Le présentateur va bientôt afficher un document
            </p>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-3 text-center text-sm text-gray-400">
        {currentDocument ? (
          <p>
            📄 {currentDocument.title} • {currentDocument.type.toUpperCase()}
          </p>
        ) : (
          <p>Connecté à la présentation "{session.title}"</p>
        )}
      </footer>
    </div>
  );
}

