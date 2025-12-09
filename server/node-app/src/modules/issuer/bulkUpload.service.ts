import { prisma as Prisma } from '../../utils/prisma';
import AdmZip from 'adm-zip';
import { IssuerBulkAdapterFactory } from '../../adapters/issuerBulkAdapters';
import { v4 as uuidv4 } from 'uuid';
import { writeToBlockchain } from '../../services/blockchainClient';
import fs from 'fs';
import path from 'path';

export class BulkUploadService {
  
  async initiateBulkUpload(issuerId: number, filePath: string, originalFileName: string) {
    // 1. Create Batch Record
    const batch = await Prisma.bulkUploadBatch.create({
      data: {
        issuer_id: issuerId,
        status: 'processing',
        total_records: 0
      }
    });

    // Start processing in background (fire and forget)
    this.processBatchWrapper(batch.id, filePath).catch(err => {
        console.error(`Background processing failed for batch ${batch.id}`, err);
    });

    return batch;
  }

  private async processBatchWrapper(batchId: number, filePath: string) {
    try {
      // 2. Read and Verify ZIP
      const zip = new AdmZip(filePath);
      const zipEntries = zip.getEntries();
      
      // Update total records estimate
      const validEntries = zipEntries.filter(entry => !entry.isDirectory && !entry.entryName.startsWith('__MACOSX') && !entry.entryName.startsWith('.'));
      
      await Prisma.bulkUploadBatch.update({
        where: { id: batchId },
        data: { total_records: validEntries.length }
      });

      let successCount = 0;
      let failedCount = 0;

      // 3. Process Each File
      for (const entry of validEntries) {
        const fileName = entry.entryName;
        const fileBuffer = entry.getData();

        try {
          // Identify Adapter
          const adapter = IssuerBulkAdapterFactory.getAdapter(fileName, fileBuffer);
          
          if (!adapter) {
            throw new Error('No suitable adapter found for file type');
          }

          // Extract & Verify
          const metadata = await adapter.extractMetadata(fileName, fileBuffer);
          const verification = await adapter.verify(fileName, fileBuffer, metadata);

          if (!verification.isValid) {
            throw new Error(`Verification failed: ${verification.errors?.join(', ')}`);
          }

          // Normalize
          const credentialData = adapter.normalize(metadata);

          // Find Learner Logic (Simplified)
          let learnerId: null | number = null;
          if (credentialData.learner_email) {
            const learner = await Prisma.learner.findUnique({ where: { email: credentialData.learner_email } });
            if (learner) learnerId = learner.id;
          }

          // Blockchain Anchor
          const credentialId = uuidv4();
          const dataHash = `hash-${uuidv4()}`; 
          
          let txHash = '';
          try {
             const blockchainResult = await writeToBlockchain(credentialId, dataHash, "pending-ipfs-upload");
             txHash = blockchainResult.tx_hash;
          } catch (bkError: any) {
             console.warn(`Blockchain anchoring failed for ${fileName}:`, bkError.message);
             throw new Error(`Blockchain anchoring failed: ${bkError.message}`);
          }

          // Save Credential
          // Use any for partial match on normalized data
          const anyData = credentialData as any;

          await Prisma.credential.create({
            data: {
              credential_id: credentialId,
              issuer_id: (await Prisma.bulkUploadBatch.findUnique({where: {id: batchId}}))?.issuer_id as number, // Get issuer from batch
              learner_id: learnerId,
              learner_email: anyData.learner_email || "unknown@example.com",
              certificate_title: anyData.certificate_title || "Bulk Uploaded Certificate",
              issued_at: new Date(),
              data_hash: dataHash,
              tx_hash: txHash,
              metadata: metadata || {},
              status: 'issued',
              batch_id: batchId,
              original_file_url: fileName, 
            }
          });

          successCount++;
          
          // Update progress incrementally? Or just at end. 
          // Updating periodically is better for UX but adds DB load. 
          // For now, update at end.

        } catch (error: any) {
          failedCount++;
          await Prisma.bulkUploadError.create({
            data: {
              batch_id: batchId,
              file_name: fileName,
              error_message: error.message || 'Unknown error'
            }
          });
        }
      }

      // 4. Update Batch Status
      await Prisma.bulkUploadBatch.update({
        where: { id: batchId },
        data: {
          status: 'completed',
          success_count: successCount,
          failed_count: failedCount
        }
      });

    } catch (error: any) {
      await Prisma.bulkUploadBatch.update({
        where: { id: batchId },
        data: {
          status: 'failed',
          failed_count: 0 
        }
      });
      console.error("Bulk Upload Failed:", error);
    } finally {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
  }

  async getBatchStatus(batchId: number, issuerId: number) {
    return Prisma.bulkUploadBatch.findFirst({
        where: { id: batchId, issuer_id: issuerId },
        include: { errors: true }
    });
  }
}

export const bulkUploadService = new BulkUploadService();
