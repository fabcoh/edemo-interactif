/**
 * Prospect Popup Component
 * Displays prospect information with 2 pages and automatic enrichment
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Star, Search, ChevronDown } from 'lucide-react';
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
  const [enrichedData, setEnrichedData] = useState<EnrichedData | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [hasEnrichedData, setHasEnrichedData] = useState(false);
  const [notes, setNotes] = useState('');
  const [rappelDate, setRappelDate] = useState('');
  const [status, setStatus] = useState<string>('nouveau');
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState<'summary' | 'details'>('summary');

  const currentContact = contacts[currentIndex];
  const totalContacts = contacts.length;

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
      setCurrentPage('summary');
    }
  };

  const handleNext = () => {
    if (currentIndex < totalContacts - 1) {
      onNavigate(currentIndex + 1);
      resetForm();
      setCurrentPage('summary');
    }
  };

  const resetForm = () => {
    setEnrichedData(null);
    setHasEnrichedData(false);
    setNotes('');
    setRappelDate('');
    setStatus('nouveau');
  };

  const handleSave = async () => {
    if (!currentContact) return;
    
    setIsSaving(true);
    try {
      await onSave(currentContact, enrichedData, notes, rappelDate, status);
      resetForm();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentContact || !open) return null;

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-bold text-black">
            FICHE {currentIndex + 1}/{totalContacts}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={currentIndex === totalContacts - 1}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Icône de recherche avec animation */}
        <div className="relative">
          <div
            className={`
              flex items-center justify-center w-12 h-12 rounded-full border-4
              ${isEnriching ? 'animate-spin bg-blue-500 border-blue-300' : ''}
              ${hasEnrichedData && !isEnriching ? 'animate-pulse bg-blue-500 border-blue-300' : ''}
              ${!isEnriching && !hasEnrichedData ? 'bg-blue-200 border-blue-300' : ''}
            `}
          >
            <Search className="h-6 w-6 text-white" />
          </div>
          {hasEnrichedData && !isEnriching && (
            <span className="absolute -top-2 -right-2 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
            </span>
          )}
        </div>
      </div>

      {/* Page 1 : Résumé */}
      {currentPage === 'summary' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2 text-black">Informations de contact</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-black">Nom</Label>
              <Input value={currentContact.nom} readOnly className="bg-white/50 text-black" />
            </div>
            <div>
              <Label className="text-black">Prénom</Label>
              <Input value={currentContact.prenom} readOnly className="bg-white/50 text-black" />
            </div>
            <div>
              <Label className="text-black">Âge</Label>
              <Input value={currentContact.age} readOnly className="bg-white/50 text-black" />
            </div>
            <div>
              <Label className="text-black">Téléphone</Label>
              <Input value={currentContact.telephone} readOnly className="bg-white/50 text-black" />
            </div>
            <div className="col-span-2">
              <Label className="text-black">Email</Label>
              <Input value={currentContact.email} readOnly className="bg-white/50 text-black" />
            </div>
            <div className="col-span-2">
              <Label className="text-black">Adresse</Label>
              <Input value={currentContact.adresse} readOnly className="bg-white/50 text-black" />
            </div>
            {currentContact.infos && (
              <div className="col-span-2">
                <Label className="text-black">Infos</Label>
                <Textarea value={currentContact.infos} readOnly className="bg-white/50 text-black" rows={2} />
              </div>
            )}
          </div>

          {/* Message si infos trouvées */}
          {hasEnrichedData && !isEnriching && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Informations trouvées !</strong>
              <span className="block sm:inline"> Des données supplémentaires sont disponibles.</span>
            </div>
          )}

          {/* Bouton pour voir les détails */}
          {hasEnrichedData && (
            <Button
              onClick={() => setCurrentPage('details')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Voir les détails
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Page 2 : Détails complets */}
      {currentPage === 'details' && (
        <div className="space-y-6">
          {/* Bouton retour */}
          <Button
            onClick={() => setCurrentPage('summary')}
            variant="outline"
            className="mb-4"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Retour au résumé
          </Button>

          {/* Photo du prospect */}
          {enrichedData?.photoUrl && (
            <div className="flex justify-center py-4">
              <img 
                src={enrichedData.photoUrl} 
                alt={`${currentContact.nom} ${currentContact.prenom}`} 
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-300 shadow-lg"
              />
            </div>
          )}

          {/* Informations enrichies */}
          {enrichedData && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2 text-black">📊 Informations enrichies</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {enrichedData.fullName && (
                  <div className="col-span-2">
                    <Label className="text-black">Nom complet</Label>
                    <Input value={enrichedData.fullName} readOnly className="bg-white/50 text-black" />
                  </div>
                )}
                {enrichedData.birthDate && (
                  <div className="col-span-2">
                    <Label className="text-black">Date de naissance</Label>
                    <Input 
                      value={`${enrichedData.birthDate} (${enrichedData.age || contact.age} ans)`} 
                      readOnly 
                      className="bg-white/50 text-black" 
                    />
                  </div>
                )}
                {enrichedData.jobTitle && (
                  <div>
                    <Label className="text-black">Poste</Label>
                    <Input value={enrichedData.jobTitle} readOnly className="bg-white/50 text-black" />
                  </div>
                )}
                {enrichedData.company && (
                  <div>
                    <Label className="text-black">Entreprise</Label>
                    <Input value={enrichedData.company} readOnly className="bg-white/50 text-black" />
                  </div>
                )}
                {enrichedData.industry && (
                  <div>
                    <Label className="text-black">Secteur</Label>
                    <Input value={enrichedData.industry} readOnly className="bg-white/50 text-black" />
                  </div>
                )}
                {enrichedData.companySize && (
                  <div>
                    <Label className="text-black">Taille entreprise</Label>
                    <Input value={enrichedData.companySize} readOnly className="bg-white/50 text-black" />
                  </div>
                )}
                {enrichedData.education && (
                  <div className="col-span-2">
                    <Label className="text-black">Formation</Label>
                    <Textarea value={enrichedData.education} readOnly className="bg-white/50 text-black" rows={2} />
                  </div>
                )}
                {enrichedData.linkedinUrl && (
                  <div className="col-span-2">
                    <Label className="text-black">LinkedIn</Label>
                    <a 
                      href={enrichedData.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline block"
                    >
                      {enrichedData.linkedinUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Détection automatique */}
          {deviceInfo && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2 text-black">💻 Détection automatique</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black">Type d'appareil</Label>
                  <Input value={deviceInfo.deviceType} readOnly className="bg-white/50 text-black" />
                </div>
                <div>
                  <Label className="text-black">Navigateur</Label>
                  <Input value={deviceInfo.browser} readOnly className="bg-white/50 text-black" />
                </div>
                <div>
                  <Label className="text-black">Système d'exploitation</Label>
                  <Input value={deviceInfo.os} readOnly className="bg-white/50 text-black" />
                </div>
                <div>
                  <Label className="text-black">Résolution</Label>
                  <Input value={deviceInfo.screenResolution} readOnly className="bg-white/50 text-black" />
                </div>
              </div>
            </div>
          )}

          {/* Formulaire de suivi */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-lg text-black">⭐ Marquer comme intéressante</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-black">Statut</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nouveau">Nouveau</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="relance">Relancé</SelectItem>
                    <SelectItem value="converti">Converti</SelectItem>
                    <SelectItem value="perdu">Perdu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-black">Date de rappel</Label>
                <Input 
                  type="datetime-local" 
                  value={rappelDate}
                  onChange={(e) => setRappelDate(e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-black">Notes</Label>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajouter des notes sur ce prospect..."
                  rows={3}
                  className="bg-white text-black"
                />
              </div>
            </div>

            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Star className="h-4 w-4 mr-2" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

