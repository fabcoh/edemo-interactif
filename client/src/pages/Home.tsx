import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Presentation, Users } from "lucide-react";
import { PinAuthDialog, isPinValidated } from "@/components/PinAuthDialog";
import { useState } from "react";

/**
 * Home page - Landing page with options to present or view
 */
export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showPinDialog, setShowPinDialog] = useState(false);
  
  const handlePresenterAccess = () => {
    if (isPinValidated()) {
      setLocation("/presenter");
    } else {
      setShowPinDialog(true);
    }
  };
  
  const handlePinSuccess = () => {
    setShowPinDialog(false);
    setLocation("/presenter");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-8 w-8" />}
            <h1 className="text-2xl font-bold text-gray-900">{APP_TITLE}</h1>
          </div>
          <div>
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Bienvenue, {user?.name || "Utilisateur"}</span>
                {user?.role === "admin" && (
                  <Link href="/admin/invitations">
                    <Button variant="outline" size="sm">Administration</Button>
                  </Link>
                )}
                <Link href="/presenter">
                  <Button variant="default">Tableau de bord</Button>
                </Link>
              </div>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="default">Se connecter</Button>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Présentations Interactives en Temps Réel
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Partagez vos documents (PDF, images, vidéos) avec votre audience en temps réel via un lien WhatsApp exclusif
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Presenter Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-4 rounded-full">
                <Presentation className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">
              Je suis Présentateur
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Créez une nouvelle session de présentation, téléchargez vos documents et contrôlez l'affichage en temps réel
            </p>
            <div className="space-y-3">
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-blue-600">✓</span> Téléchargez PDF, images et vidéos
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600">✓</span> Contrôlez le format (portrait/paysage)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600">✓</span> Partagez un lien exclusif
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600">✓</span> Synchronisation en temps réel
                </li>
              </ul>
            </div>
            <Button className="w-full" size="lg" onClick={handlePresenterAccess}>
              Se Connecter pour Présenter
            </Button>
          </div>

          {/* Viewer Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">
              Je suis Spectateur
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Vous avez reçu un lien ? Entrez le code de session pour voir la présentation en direct
            </p>
            <div className="space-y-3">
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Accès via lien unique
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Visualisation en temps réel
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Support PDF, images et vidéos
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Aucune connexion requise
                </li>
              </ul>
            </div>
            <Link href="/viewer" className="block mt-6">
              <Button className="w-full" size="lg" variant="outline">
                Rejoindre une Présentation
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Fonctionnalités Principales
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">📄</div>
              <h4 className="font-bold text-lg text-gray-900 mb-2">Multi-Format</h4>
              <p className="text-gray-600">
                Supportez PDF, images PNG/JPG et vidéos MP4 pour vos présentations
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔗</div>
              <h4 className="font-bold text-lg text-gray-900 mb-2">Partage Facile</h4>
              <p className="text-gray-600">
                Générez un lien unique à partager via WhatsApp ou tout autre canal
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h4 className="font-bold text-lg text-gray-900 mb-2">Temps Réel</h4>
              <p className="text-gray-600">
                Synchronisation instantanée entre le présentateur et les spectateurs
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* PIN Auth Dialog */}
      <PinAuthDialog open={showPinDialog} onSuccess={handlePinSuccess} />
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 {APP_TITLE}. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

