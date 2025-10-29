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
import { Mail } from "lucide-react";

interface EmailAuthDialogProps {
  open: boolean;
  onSuccess: (email: string) => void;
}

const EMAIL_STORAGE_KEY = "presenter_email";

export function EmailAuthDialog({ open, onSuccess }: EmailAuthDialogProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Veuillez entrer une adresse email valide");
      return;
    }
    
    // Store email in sessionStorage
    if (typeof window !== "undefined") {
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
            <Mail className="w-5 h-5" />
            Identification
          </DialogTitle>
          <DialogDescription>
            Entrez votre adresse email pour accéder à vos présentations
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                id="email"
                type="email"
                placeholder="votre.email@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="text-center"
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full">
              Continuer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get stored email
export function getStoredEmail(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(EMAIL_STORAGE_KEY);
}

// Helper function to clear stored email
export function clearStoredEmail(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(EMAIL_STORAGE_KEY);
}

