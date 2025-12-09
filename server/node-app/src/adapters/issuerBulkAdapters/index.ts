import { Credential } from '@prisma/client';

export interface VerificationResult {
  isValid: boolean;
  errors?: string[];
  metadata?: any;
}

export interface IssuerBulkAdapter {
  identify(fileName: string, fileBuffer: Buffer): boolean;
  extractMetadata(fileName: string, fileBuffer: Buffer): Promise<any>;
  verify(fileName: string, fileBuffer: Buffer, metadata: any): Promise<VerificationResult>;
  normalize(metadata: any): Partial<Credential>;
}

import { aiService } from '../../modules/ai/ai.service';

export class DefaultAdapter implements IssuerBulkAdapter {
  identify(fileName: string, fileBuffer: Buffer): boolean {
    // Default handles JSON, PDF, and Images if no other adapter claims it
    const lowerName = fileName.toLowerCase();
    return lowerName.endsWith('.json') || 
           lowerName.endsWith('.pdf') || 
           lowerName.endsWith('.png') || 
           lowerName.endsWith('.jpg') || 
           lowerName.endsWith('.jpeg');
  }

  async extractMetadata(fileName: string, fileBuffer: Buffer): Promise<any> {
    const lowerName = fileName.toLowerCase();
    
    if (lowerName.endsWith('.json')) {
      try {
        const jsonContent = JSON.parse(fileBuffer.toString('utf-8'));
        return jsonContent;
      } catch (e) {
        throw new Error(`Invalid JSON in file ${fileName}`);
      }
    } else if (lowerName.endsWith('.pdf')) {
      // PDF metadata extraction would require a PDF parser
      return { filename: fileName, type: 'pdf', note: 'Metadata extraction from PDF not fully implemented' };
    } else if (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
        try {
            // Use AI Service for OCR
            // We pass empty strings for known fields as we are extracting them
            const ocrResult = await aiService.processOCR(
                fileBuffer,
                fileName,
                "", // learnerEmail unknown
                "", // certificateTitle unknown
                ""  // issuerName unknown
            );
            return {
                ...ocrResult,
                type: 'image_scan',
                ai_extracted: true
            };
        } catch (error) {
            console.warn(`OCR failed for ${fileName}`, error);
            return { filename: fileName, type: 'image', error: 'OCR processing failed' };
        }
    }
    return {};
  }

  async verify(fileName: string, fileBuffer: Buffer, metadata: any): Promise<VerificationResult> {
    // Basic structural verification
    if (!metadata) return { isValid: false, errors: ['No metadata extracted'] };
    // TODO: Add schema validation here
    return { isValid: true };
  }

  normalize(metadata: any): Partial<Credential> {
    // Attempt to map common fields
    return {
      certificate_title: metadata.title || metadata.certificateTitle || "Untitled Certificate",
      // Map other fields as best effort
      metadata: metadata,
      learner_email: metadata.email || metadata.learnerEmail || "", 
      // Note: learner_email is required by schema, validation should catch if missing
    };
  }
}

export class IssuerBulkAdapterFactory {
  private static adapters: IssuerBulkAdapter[] = [
    new DefaultAdapter()
    // Add other adapters here (e.g. NSDCAdapter)
  ];

  static getAdapter(fileName: string, fileBuffer: Buffer): IssuerBulkAdapter | null {
    for (const adapter of this.adapters) {
      if (adapter.identify(fileName, fileBuffer)) {
        return adapter;
      }
    }
    return null;
  }
}
