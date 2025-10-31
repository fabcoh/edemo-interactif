/**
 * Excel parser for prospection files
 * Extracts contact information from uploaded Excel files
 */

import * as XLSX from 'xlsx';

export interface ProspectContact {
  id: number;
  nom: string;
  prenom: string;
  age: string;
  adresse: string;
  telephone: string;
  email: string;
  infos?: string;
  provenance?: string;
}

/**
 * Parse Excel file and extract contact information
 */
export async function parseProspectionFile(file: File): Promise<ProspectContact[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file'));
          return;
        }

        // Read the workbook
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Find the header row (should contain "Nom - Prénom", "Age", etc.)
        // Skip first row if it's a title (e.g., "Santeo.net")
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
          const row = jsonData[i];
          if (row && row.some((cell: any) => 
            typeof cell === 'string' && (
              cell.toLowerCase().includes('nom') ||
              cell.toLowerCase().includes('id') ||
              cell.toLowerCase().includes('prénom')
            )
          )) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          reject(new Error('Could not find header row in Excel file'));
          return;
        }

        // Get headers
        const headers = jsonData[headerRowIndex].map((h: any) => 
          h ? String(h).toLowerCase().trim() : ''
        );

        // Find column indices
        const idIndex = headers.findIndex((h: string) => h === 'id');
        const nomPrenomIndex = headers.findIndex((h: string) => h.includes('nom'));
        const ageIndex = headers.findIndex((h: string) => h.includes('age') || h.includes('âge'));
        const adresseIndex = headers.findIndex((h: string) => h.includes('adresse'));
        const telIndex = headers.findIndex((h: string) => 
          h.includes('coordonnées') || h.includes('téléphone') || h.includes('tel')
        );
        const emailIndex = headers.findIndex((h: string) => h.includes('mail') || h.includes('email'));
        const infosIndex = headers.findIndex((h: string) => h.includes('infos'));
        const provenanceIndex = headers.findIndex((h: string) => h.includes('provenance') || h.includes('source'));

        // Parse data rows
        const contacts: ProspectContact[] = [];
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          // Extract ID
          const id = idIndex >= 0 && row[idIndex] ? Number(row[idIndex]) : i;

          // Extract and split "Nom - Prénom"
          const nomPrenom = nomPrenomIndex >= 0 && row[nomPrenomIndex] 
            ? String(row[nomPrenomIndex]).trim() 
            : '';
          
          let nom = '';
          let prenom = '';
          
          if (nomPrenom) {
            // Try to split by common separators
            const parts = nomPrenom.split(/[\s-]+/);
            if (parts.length >= 2) {
              nom = parts[0];
              prenom = parts.slice(1).join(' ');
            } else {
              nom = nomPrenom;
            }
          }

          // Extract other fields
          const age = ageIndex >= 0 && row[ageIndex] ? String(row[ageIndex]).trim() : '';
          const adresse = adresseIndex >= 0 && row[adresseIndex] ? String(row[adresseIndex]).trim() : '';
          const telephone = telIndex >= 0 && row[telIndex] ? String(row[telIndex]).trim() : '';
          const email = emailIndex >= 0 && row[emailIndex] ? String(row[emailIndex]).trim() : '';
          const infos = infosIndex >= 0 && row[infosIndex] ? String(row[infosIndex]).trim() : '';
          const provenance = provenanceIndex >= 0 && row[provenanceIndex] ? String(row[provenanceIndex]).trim() : '';

          // Only add if we have at least a name or email or phone
          if (nom || email || telephone) {
            contacts.push({
              id,
              nom,
              prenom,
              age,
              adresse,
              telephone,
              email,
              infos,
              provenance,
            });
          }
        }

        resolve(contacts);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsBinaryString(file);
  });
}

