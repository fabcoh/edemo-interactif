/**
 * Prospect Popup Component - Compact Single Page Layout
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import type { ProspectContact } from '@/lib/excelParser';

interface EnrichedData {
  fullName?: string;
  birthDate?: string;
  jobTitle?: string;
  company?: string;
  age?: number;
  photoUrl?: string;
  linkedinUrl?: string;
  education?: string;
  companySize?: string;
  industry?: string;
}

interface DeviceInfo {
  deviceType: string;
  browser: string;
  os: string;
  screenResolution: string;
}

interface ProspectPopupProps {
  open: boolean;
  onClose: () => void;
  contacts: ProspectContact[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onEnrich: (contact: ProspectContact) => Promise<EnrichedData | null>;
  onSave: (contact: ProspectContact, enrichedData: EnrichedData | null, notes: string, rappelDate: string, status: string) => Promise<void>;
  deviceInfo?: DeviceInfo;
}

export default function ProspectPopup({
  open,
  onClose,
  contacts,
  currentIndex,
  onNavigate,
  onEnrich,
  onSave,
  deviceInfo,
}: ProspectPopupProps) {
  const currentContact = contacts[currentIndex];
  const totalContacts = contacts.length;

  const [enrichedData, setEnrichedData] = useState<EnrichedData | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [hasEnrichedData, setHasEnrichedData] = useState(false);
  const [notes, setNotes] = useState('');
  const [rappelDate, setRappelDate] = useState('');
  const [status, setStatus] = useState<'nouveau' | 'en_cours' | 'qualifie' | 'non_interesse'>('nouveau');
  const [isSaving, setIsSaving] = useState(false);
  const [editablePhone, setEditablePhone] = useState(currentContact.telephone);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [favorites, setFavorites] = useState<ProspectContact[]>([]);

  // Charger les favoris depuis localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('prospectFavorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    }
  }, []);

  // Recherche automatique dès l'ouverture de la fiche
  useEffect(() => {
    if (currentContact && open) {
      handleAutoEnrich();
    }
  }, [currentIndex, open]);

  const handleAutoEnrich = async () => {
    if (!currentContact) return;
    
    setIsEnriching(true);
    setHasEnrichedData(false);
    try {
      const data = await onEnrich(currentContact);
      setEnrichedData(data);
      setHasEnrichedData(data !== null && Object.keys(data).length > 0);
    } catch (error) {
      console.error('Enrichment failed:', error);
    } finally {
      setIsEnriching(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
      resetForm();
    }
  };

  const handleNext = () => {
    if (currentIndex < totalContacts - 1) {
      onNavigate(currentIndex + 1);
      resetForm();
    }
  };

  const resetForm = () => {
    setEnrichedData(null);
    setHasEnrichedData(false);
    setNotes('');
    setRappelDate('');
    setStatus('nouveau');
    setEditablePhone(currentContact.telephone);
  };

  // Formater le numéro de téléphone par groupes de 2
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,2}/g) || [];
    return groups.join(' ');
  };

  // Générer le message WhatsApp
  const generateWhatsAppMessage = () => {
    const nom = currentContact.nom;
    const prenom = currentContact.prenom;
    const age = parseInt(currentContact.age);
    const birthDate = enrichedData?.birthDate || 'votre date de naissance';
    
    // Déterminer Bonjour/Bonsoir selon l'heure (fuseau Paris)
    const now = new Date();
    const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const hour = parisTime.getHours();
    const greeting = hour >= 18 ? 'Bonsoir' : 'Bonjour';
    
    // Pour les moins de 30 ans : juste le prénom
    if (age < 30) {
      return `${greeting} ${prenom}\nSuite à votre demande de devis pour la mutuelle santé, je voulais confirmer votre date de naissance, c'est bien le ${birthDate} ?`;
    }
    
    // Pour les 30 ans et plus : Prénom + Nom (sans titre pour éviter erreur de genre)
    return `${greeting} ${prenom} ${nom}\nSuite à votre demande de devis pour la mutuelle santé, je voulais confirmer votre date de naissance, c'est bien le ${birthDate} ?`;
  };

  // Créer le lien WhatsApp
  const getWhatsAppLink = () => {
    let phone = editablePhone.replace(/\D/g, '');
    
    // Convertir au format international si numéro français (commence par 0)
    if (phone.startsWith('0')) {
      phone = '33' + phone.substring(1);
    }
    
    const message = encodeURIComponent(generateWhatsAppMessage());
    return `https://wa.me/${phone}?text=${message}`;
  };

  const handleSave = async () => {
    if (!currentContact) return;
    
    setIsSaving(true);
    try {
      await onSave(currentContact, enrichedData, notes, rappelDate, status);
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentContact || !open) return null;

  return (
    <div className="space-y-3">
      {/* Navigation Header */}
      <div className="flex items-center justify-center gap-2 relative">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="h-10 w-10 bg-white border-2 border-gray-300 hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5 text-black" />
        </Button>
        <span className="text-lg font-bold text-black">
          FICHE {currentIndex + 1}/{totalContacts}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentIndex === totalContacts - 1}
          className="h-10 w-10 bg-white border-2 border-gray-300 hover:bg-gray-100"
        >
          <ChevronRight className="h-5 w-5 text-black" />
        </Button>

        {/* Icône de recherche avec animation (position absolue à droite) */}
        <div className="absolute right-0">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isEnriching ? 'bg-blue-400 animate-pulse' : hasEnrichedData ? 'bg-green-400' : 'bg-gray-300'
            }`}
          >
            <Search className="h-8 w-8 text-white" />
          </div>
          {hasEnrichedData && !isEnriching && (
            <span className="absolute -top-2 -right-2 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
            </span>
          )}
        </div>
      </div>

      {/* Section Contact */}
      <div className="bg-white/80 p-3 rounded-lg border border-gray-300 space-y-2">
        <h3 className="text-sm font-semibold text-black border-b pb-1">👤 Contact</h3>
        
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-black">Nom</Label>
            <Input value={currentContact.nom} readOnly className="h-8 text-sm bg-white/50 text-black" />
          </div>
          <div>
            <Label className="text-xs text-black">Prénom</Label>
            <Input value={currentContact.prenom} readOnly className="h-8 text-sm bg-white/50 text-black" />
          </div>
          <div>
            <Label className="text-xs text-black">Âge</Label>
            <Input value={currentContact.age} readOnly className="h-8 text-sm bg-white/50 text-black" />
          </div>
        </div>

        <div>
          <Label className="text-xs text-black">Téléphone</Label>
          <div className="flex items-center gap-2">
            <Input 
              value={formatPhoneNumber(editablePhone)} 
              onChange={(e) => setEditablePhone(e.target.value.replace(/\s/g, ''))}
              className="flex-1 h-8 text-sm bg-white text-black font-bold"
              placeholder="06 12 34 56 78"
            />
            <a href={`tel:${editablePhone}`} className="flex items-center justify-center h-8 w-8 bg-green-500 hover:bg-green-600 rounded-md" title="Appeler">
              <span className="text-lg">☎️</span>
            </a>
            <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-8 w-8 bg-green-500 hover:bg-green-600 rounded-md" title="WhatsApp">
              <span className="text-lg">💬</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-black">Email</Label>
            <Input value={currentContact.email} readOnly className="h-8 text-sm bg-white/50 text-black" />
          </div>
          <div>
            <Label className="text-xs text-black">Adresse</Label>
            <Input value={currentContact.adresse} readOnly className="h-8 text-sm bg-white/50 text-black" />
          </div>
        </div>
      </div>

      {/* Section Enrichie */}
      {enrichedData && (
        <div className="bg-white/80 p-3 rounded-lg border border-gray-300 space-y-2 relative">
          <h3 className="text-sm font-semibold text-black border-b pb-1">📊 Informations enrichies</h3>
          
          {/* Mini vignette photo */}
          {enrichedData.photoUrl && (
            <div className="absolute top-3 right-3">
              <img 
                src={enrichedData.photoUrl} 
                alt="Photo" 
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-300 cursor-pointer hover:scale-110 transition-transform"
                onClick={() => setPhotoModalOpen(true)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {enrichedData.fullName && (
              <div>
                <Label className="text-xs text-black">Nom complet</Label>
                <Input value={enrichedData.fullName} readOnly className="h-8 text-sm bg-white/50 text-black" />
              </div>
            )}
            {enrichedData.birthDate && (
              <div>
                <Label className="text-xs text-black">Date de naissance</Label>
                <Input value={`${enrichedData.birthDate} (${enrichedData.age || currentContact.age} ans)`} readOnly className="h-8 text-sm bg-white/50 text-black" />
              </div>
            )}
            {currentContact.provenance && (
              <div>
                <Label className="text-xs text-black">Provenance</Label>
                <Input value={currentContact.provenance} readOnly className="h-8 text-sm bg-white/50 text-black" />
              </div>
            )}
            {enrichedData.jobTitle && (
              <div>
                <Label className="text-xs text-black">Poste</Label>
                <Input value={enrichedData.jobTitle} readOnly className="h-8 text-sm bg-white/50 text-black" />
              </div>
            )}
            {enrichedData.company && (
              <div>
                <Label className="text-xs text-black">Entreprise</Label>
                <Input value={enrichedData.company} readOnly className="h-8 text-sm bg-white/50 text-black" />
              </div>
            )}
            {enrichedData.industry && (
              <div>
                <Label className="text-xs text-black">Secteur</Label>
                <Input value={enrichedData.industry} readOnly className="h-8 text-sm bg-white/50 text-black" />
              </div>
            )}
            {enrichedData.companySize && (
              <div>
                <Label className="text-xs text-black">Taille entreprise</Label>
                <Input value={enrichedData.companySize} readOnly className="h-8 text-sm bg-white/50 text-black" />
              </div>
            )}
            {enrichedData.education && (
              <div className="col-span-2">
                <Label className="text-xs text-black">Formation</Label>
                <Input value={enrichedData.education} readOnly className="h-8 text-sm bg-white/50 text-black" />
              </div>
            )}
            {enrichedData.linkedinUrl && (
              <div className="col-span-2">
                <Label className="text-xs text-black">LinkedIn</Label>
                <a 
                  href={enrichedData.linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block h-8 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md border border-blue-300 truncate"
                >
                  {enrichedData.linkedinUrl}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section Suivi */}
      <div className="bg-white/80 p-3 rounded-lg border border-gray-300 space-y-2">
        <h3 className="text-sm font-semibold text-black border-b pb-1">📝 Suivi</h3>
        
        <div>
          <Label className="text-xs text-black">Notes</Label>
          <Textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[60px] text-sm bg-white text-black resize-none"
            placeholder="Ajouter des notes..."
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-black">Statut</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger className="h-8 text-sm bg-white text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nouveau">Nouveau</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="qualifie">Qualifié</SelectItem>
                <SelectItem value="non_interesse">Non intéressé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-black">Date de rappel</Label>
            <Input 
              type="date" 
              value={rappelDate} 
              onChange={(e) => setRappelDate(e.target.value)}
              className="h-8 text-sm bg-white text-black"
            />
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-sm"
        >
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>

      {/* Modal agrandissement photo */}
      <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
        <DialogContent className="max-w-2xl">
          {enrichedData?.photoUrl && (
            <img 
              src={enrichedData.photoUrl} 
              alt={`${currentContact.nom} ${currentContact.prenom}`} 
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

