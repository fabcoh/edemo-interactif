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
import { Lock } from "lucide-react";

interface PinAuthDialogProps {
  open: boolean;
  onSuccess: () => void;
}

const CORRECT_PIN = "5656";
const PIN_STORAGE_KEY = "presenter_pin_validated";

export function PinAuthDialog({ open, onSuccess }: PinAuthDialogProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin === CORRECT_PIN) {
      // Store validation in sessionStorage
      sessionStorage.setItem(PIN_STORAGE_KEY, "true");
      setError("");
      onSuccess();
    } else {
      setError("Code PIN incorrect");
      setPin("");
    }
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
            Entrez le code PIN pour accéder aux fonctions de présentation
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Code PIN"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                className="text-center text-2xl tracking-widest"
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full">
              Valider
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to check if PIN is validated
export function isPinValidated(): boolean {
  return sessionStorage.getItem(PIN_STORAGE_KEY) === "true";
}

// Helper function to clear PIN validation
export function clearPinValidation(): void {
  sessionStorage.removeItem(PIN_STORAGE_KEY);
}

