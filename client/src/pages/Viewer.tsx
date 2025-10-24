import { useState, useEffect } from "react";
import { useRoute } from "wouter";
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
  const [match, params] = useRoute("/view/:code");
  const [sessionCode, setSessionCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  // Extract session code from URL if present
  useEffect(() => {
    // Check if we're on the /view/:code route
    if (match && params?.code) {
      setSessionCode(params.code);
      setEnteredCode(params.code);
      setIsJoined(true);
    } else {
      // Fallback to query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (code) {
        setSessionCode(code);
        setEnteredCode(code);
        setIsJoined(true);
      }
    }
  }, [match, params]);

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

  const session = sessionQuery.data;
  const currentDocument = session?.currentDocument;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-black border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{session?.title || "Présentation"}</h1>
            <p className="text-sm text-gray-400">
              Code: {session?.sessionCode || "---"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" />
              <span>{viewerCount} spectateur(s)</span>
            </div>
            {!isJoined && (
              <Link href="/">
                <Button variant="outline">Retour</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!isJoined ? (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Rejoindre une Présentation</CardTitle>
                <CardDescription>
                  Entrez le code de session pour voir la présentation en direct
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Code de Session</Label>
                  <Input
                    placeholder="Ex: ABC12345"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === "Enter" && handleJoinSession()}
                    className="mt-2"
                  />
                </div>
                <Button onClick={handleJoinSession} className="w-full">
                  Rejoindre
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : sessionQuery.isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Chargement...</p>
          </div>
        ) : !session ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Présentation non trouvée</p>
            <Link href="/">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Document Display */}
            {currentDocument ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-0">
                  {currentDocument.type === "pdf" && (
                    <div className="bg-black p-4 rounded-lg">
                      <iframe
                        src={currentDocument.fileUrl}
                        className="w-full h-96 rounded"
                        title="PDF Document"
                      />
                    </div>
                  )}
                  {currentDocument.type === "image" && (
                    <div className="bg-black p-4 rounded-lg flex justify-center">
                      <img
                        src={currentDocument.fileUrl}
                        alt="Document"
                        className="max-h-96 rounded"
                      />
                    </div>
                  )}
                  {currentDocument.type === "video" && (
                    <div className="bg-black p-4 rounded-lg">
                      <video
                        src={currentDocument.fileUrl}
                        controls
                        className="w-full h-96 rounded"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="py-12 text-center text-gray-400">
                  En attente du premier document...
                </CardContent>
              </Card>
            )}

            {/* Info */}
            <Card className="bg-blue-900 border-blue-700">
              <CardContent className="py-4">
                <p className="text-sm text-blue-100">
                  ✅ Vous êtes connecté à la présentation. Les documents s'afficheront en temps réel.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

