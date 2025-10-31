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
import { ChevronLeft, ChevronRight, Star, Search, ChevronDown, X } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState<'summary' | 'details'>('summary');

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
        </div>

        {/* Bouton fermer */}
        <Button
          variant="outline"
          size="icon"
          onClick={onClose}
          className="h-10 w-10 bg-white border-2 border-gray-300 hover:bg-gray-100 ml-auto"
          title="Fermer"
        >
          <X className="h-5 w-5 text-black" />
        </Button>

        {/* Icône de recherche avec animation */}
        <div className="relative">
          <div
            className={`
              flex items-center justify-center w-16 h-16 rounded-full border-4
              ${isEnriching ? 'animate-spin bg-blue-500 border-blue-300' : ''}
              ${hasEnrichedData && !isEnriching ? 'animate-pulse bg-blue-500 border-blue-300' : ''}
              ${!isEnriching && !hasEnrichedData ? 'bg-blue-200 border-blue-300' : ''}
            `}
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
            <div className="col-span-2">
              <Label className="text-black">Téléphone</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={formatPhoneNumber(editablePhone)} 
                  onChange={(e) => setEditablePhone(e.target.value.replace(/\s/g, ''))}
                  className="flex-1 bg-white text-black font-bold"
                  placeholder="06 12 34 56 78"
                />
                <a href={`tel:${editablePhone}`} className="flex items-center justify-center h-10 w-10 bg-green-500 hover:bg-green-600 rounded-md" title="Appeler">
                  <span className="text-2xl">☎️</span>
                </a>
                <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-10 w-10 bg-green-500 hover:bg-green-600 rounded-md" title="WhatsApp">
                  <span className="text-2xl">💬</span>
                </a>
              </div>
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

          {/* Téléphone et WhatsApp */}
          <div className="bg-white/80 p-4 rounded-lg border-2 border-gray-300">
            <Label className="text-black mb-2 block">Téléphone</Label>
            <div className="flex items-center gap-2">
              <Input 
                value={formatPhoneNumber(editablePhone)} 
                onChange={(e) => setEditablePhone(e.target.value.replace(/\s/g, ''))}
                className="flex-1 bg-white text-black font-bold text-lg"
                placeholder="06 12 34 56 78"
              />
              <a href={`tel:${editablePhone}`} className="flex items-center justify-center h-12 w-12 bg-green-500 hover:bg-green-600 rounded-md" title="Appeler">
                <span className="text-3xl">☎️</span>
              </a>
              <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-12 w-12 bg-green-500 hover:bg-green-600 rounded-md" title="WhatsApp">
                <span className="text-3xl">💬</span>
              </a>
            </div>
          </div>

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
                      value={`${enrichedData.birthDate} (${enrichedData.age || currentContact.age} ans)`} 
                      readOnly 
                      className="bg-white/50 text-black" 
                    />
                  </div>
                )}
                {currentContact.provenance && (
                  <div className="col-span-2">
                    <Label className="text-black">Provenance</Label>
                    <Input 
                      value={currentContact.provenance} 
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

