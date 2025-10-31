/**
 * Prospect Popup Component
 * Displays prospect information with navigation between contacts
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Star, Trash2, RefreshCw } from 'lucide-react';
import type { ProspectContact } from '@/lib/excelParser';

interface EnrichedData {
  fullName?: string;
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
  const [notes, setNotes] = useState('');
  const [rappelDate, setRappelDate] = useState('');
  const [status, setStatus] = useState<string>('nouveau');
  const [isSaving, setIsSaving] = useState(false);

  const currentContact = contacts[currentIndex];
  const totalContacts = contacts.length;

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
    setNotes('');
    setRappelDate('');
    setStatus('nouveau');
  };

  const handleEnrich = async () => {
    if (!currentContact) return;
    
    setIsEnriching(true);
    try {
      const data = await onEnrich(currentContact);
      setEnrichedData(data);
    } catch (error) {
      console.error('Enrichment failed:', error);
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSave = async () => {
    if (!currentContact) return;
    
    setIsSaving(true);
    try {
      await onSave(currentContact, enrichedData, notes, rappelDate, status);
      // Reset form after save
      resetForm();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentContact) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-blue-50">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-black">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-bold">
                FICHE {currentIndex + 1}/{totalContacts}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                disabled={currentIndex === totalContacts - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={handleEnrich}
              disabled={isEnriching || (!currentContact.email && !currentContact.telephone)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isEnriching ? 'animate-spin' : ''}`} />
              {isEnriching ? 'Enrichissement...' : 'Enrichir'}
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Photo du prospect en haut si disponible */}
        {enrichedData?.photoUrl && (
          <div className="flex justify-center py-4">
            <img 
              src={enrichedData.photoUrl} 
              alt={`${currentContact.nom} ${currentContact.prenom}`} 
              className="w-32 h-32 rounded-full object-cover border-4 border-blue-300 shadow-lg"
            />
          </div>
        )}
        
        <div className="space-y-6 text-black">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Informations de contact</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nom</Label>
                <Input value={currentContact.nom} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Prénom</Label>
                <Input value={currentContact.prenom} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Âge</Label>
                <Input value={currentContact.age} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input value={currentContact.telephone} readOnly className="bg-muted" />
              </div>
              <div className="col-span-2">
                <Label>Email</Label>
                <Input value={currentContact.email} readOnly className="bg-muted" />
              </div>
              <div className="col-span-2">
                <Label>Adresse</Label>
                <Input value={currentContact.adresse} readOnly className="bg-muted" />
              </div>
              {currentContact.infos && (
                <div className="col-span-2">
                  <Label>Infos</Label>
                  <Textarea value={currentContact.infos} readOnly className="bg-muted" rows={2} />
                </div>
              )}
            </div>
          </div>

          {/* Enriched Data */}
          {enrichedData && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">📊 Informations enrichies</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {enrichedData.photoUrl && (
                  <div className="col-span-2 flex justify-center">
                    <img 
                      src={enrichedData.photoUrl} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  </div>
                )}
                {enrichedData.fullName && (
                  <div className="col-span-2">
                    <Label>Nom complet</Label>
                    <Input value={enrichedData.fullName} readOnly className="bg-muted" />
                  </div>
                )}
                {enrichedData.jobTitle && (
                  <div>
                    <Label>Poste</Label>
                    <Input value={enrichedData.jobTitle} readOnly className="bg-muted" />
                  </div>
                )}
                {enrichedData.company && (
                  <div>
                    <Label>Entreprise</Label>
                    <Input value={enrichedData.company} readOnly className="bg-muted" />
                  </div>
                )}
                {enrichedData.industry && (
                  <div>
                    <Label>Secteur</Label>
                    <Input value={enrichedData.industry} readOnly className="bg-muted" />
                  </div>
                )}
                {enrichedData.companySize && (
                  <div>
                    <Label>Taille entreprise</Label>
                    <Input value={enrichedData.companySize} readOnly className="bg-muted" />
                  </div>
                )}
                {enrichedData.education && (
                  <div className="col-span-2">
                    <Label>Formation</Label>
                    <Textarea value={enrichedData.education} readOnly className="bg-muted" rows={2} />
                  </div>
                )}
                {enrichedData.linkedinUrl && (
                  <div className="col-span-2">
                    <Label>LinkedIn</Label>
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

          {/* Device Info */}
          {deviceInfo && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">💻 Détection automatique</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type d'appareil</Label>
                  <Input value={deviceInfo.deviceType} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Navigateur</Label>
                  <Input value={deviceInfo.browser} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Système d'exploitation</Label>
                  <Input value={deviceInfo.os} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Résolution</Label>
                  <Input value={deviceInfo.screenResolution} readOnly className="bg-muted" />
                </div>
              </div>
            </div>
          )}

          {/* Save Section */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-lg">⭐ Marquer comme intéressante</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Statut</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
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
                <Label>Date de rappel</Label>
                <Input 
                  type="datetime-local" 
                  value={rappelDate}
                  onChange={(e) => setRappelDate(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajouter des notes sur ce prospect..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
              >
                <Star className="h-4 w-4 mr-2" />
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
              <Button 
                variant="destructive"
                onClick={onClose}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Fermer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

