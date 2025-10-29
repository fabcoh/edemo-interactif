import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface PinAuthDialogProps {
  open: boolean;
  onSuccess: (email: string) => void;
}

const PIN_STORAGE_KEY = "presenter_pin_validated";
const EMAIL_STORAGE_KEY = "presenter_email";

export function PinAuthDialog({ open, onSuccess }: PinAuthDialogProps) {
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  // Fetch the correct PIN from the database
  const pinQuery = trpc.auth.getPresenterPin.useQuery(undefined, {
    enabled: open,
    retry: 2,
    staleTime: 60000, // Cache for 1 minute
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use fetched PIN or fallback to default
    const correctPin = pinQuery.data?.pin || "5656";
    
    if (pinQuery.isError) {
      setError("Erreur de connexion au serveur. Réessayez.");
      return;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Veuillez entrer une adresse email valide");
      return;
    }
    
    // Validate PIN
    if (pin !== correctPin) {
      setError("Code PIN incorrect");
      setPin("");
      return;
    }
    
    // Store validation in sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.setItem(PIN_STORAGE_KEY, "true");
      sessionStorage.setItem(EMAIL_STORAGE_KEY, email);
    }
    setError("");
    onSuccess(email);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Accès Présentateur
          </DialogTitle>
          <DialogDescription>
            Entrez votre email et le code PIN pour accéder au tableau de bord
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Email Field */}
            <div className="grid gap-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Adresse email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="votre.email@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                autoFocus
              />
            </div>

            {/* PIN Field */}
            <div className="grid gap-2">
              <Label htmlFor="pin" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Code PIN
              </Label>
              <Input
                id="pin"
                type="text"
                placeholder="Entrez le code PIN"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError("");
                }}
                className="text-center text-xl tracking-wider"
              />
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
            {pinQuery.isLoading && (
              <p className="text-sm text-gray-500 text-center">Chargement...</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full">
              {pinQuery.isLoading ? "Chargement..." : "Se connecter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to check if PIN is validated
export function isPinValidated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(PIN_STORAGE_KEY) === "true";
}

// Helper function to get stored email
export function getStoredEmail(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(EMAIL_STORAGE_KEY);
}

// Helper function to clear PIN validation
export function clearPinValidation(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PIN_STORAGE_KEY);
  sessionStorage.removeItem(EMAIL_STORAGE_KEY);
}

