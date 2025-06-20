import { BlobServiceClient, BlobSASPermissions, StorageSharedKeyCredential, generateBlobSASQueryParameters } from '@azure/storage-blob';
import { generateUniqueFilename } from './file-utils';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'drive-files';
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

if (!connectionString) {
  throw new Error('Azure Storage connection string is not defined');
}

if (!accountName || !accountKey) {
  throw new Error('Azure Storage account name and key are required for SAS token generation');
}

// Initialize the blob service client
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

/**
 * Upload a file to Azure Blob Storage
 * @param file - File buffer to upload
 * @param fileName - Unique file name for the blob
 * @param mimeType - MIME type of the file
 * @returns Object containing blob URL and blob name
 */
export async function uploadFileToBlob(
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ blobUrl: string; blobName: string }> {
  try {
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Ensure container exists
    await containerClient.createIfNotExists({
      access: 'blob', // Allow public read access to blobs
    });

    // Generate unique blob name with timestamp
    const blobName = `${Date.now()}-${fileName}`;
    
    // Get blob client
    const blobClient = containerClient.getBlockBlobClient(blobName);
    
    // Upload file
    await blobClient.uploadData(file, {
      blobHTTPHeaders: {
        blobContentType: mimeType,
      },
    });

    return {
      blobUrl: blobClient.url,
      blobName,
    };
  } catch (error) {
    console.error('Error uploading file to blob storage:', error);
    throw new Error('Failed to upload file to storage');
  }
}

/**
 * Delete a file from Azure Blob Storage
 * @param blobName - Name of the blob to delete
 * @returns Boolean indicating success
 */
export async function deleteFileFromBlob(blobName: string): Promise<boolean> {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);
    
    const response = await blobClient.deleteIfExists();
    return response.succeeded;
  } catch (error) {
    console.error('Error deleting file from blob storage:', error);
    return false;
  }
}

/**
 * Generate a temporary download URL for a blob
 * @param blobName - Name of the blob
 * @returns Temporary download URL
 */
export async function generateDownloadUrl(
  blobName: string
): Promise<string> {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);
    
    // For now, return the direct URL since we set container access to 'blob'
    // In production, you might want to generate SAS tokens for more security
    return blobClient.url;
  } catch (error) {
    console.error('Error generating download URL:', error);
    throw new Error('Failed to generate download URL');
  }
}

/**
 * Check if a blob exists
 * @param blobName - Name of the blob to check
 * @returns Boolean indicating if blob exists
 */
export async function blobExists(blobName: string): Promise<boolean> {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);
    
    return await blobClient.exists();
  } catch (error) {
    console.error('Error checking if blob exists:', error);
    return false;
  }
}

/**
 * Generate a SAS token for a blob
 * @param blobName - Name of the blob
 * @param permissions - Permissions for the SAS token
 * @param expiresInMinutes - Expiration time in minutes
 * @returns SAS token string
 */
export function generateBlobSasToken(
  blobName: string,
  permissions: BlobSASPermissions,
  expiresInMinutes: number
): string {
  if (!accountName || !accountKey) {
    throw new Error('Azure Storage account credentials not configured');
  }
  
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  const expiryDate = new Date(new Date().valueOf() + expiresInMinutes * 60 * 1000);
  
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions,
      expiresOn: expiryDate,
    },
    sharedKeyCredential
  ).toString();

  return sasToken;
}

/**
 * Upload a file to Azure Blob Storage using a SAS token
 * @param file - File buffer to upload
 * @param fileName - Original file name
 * @param mimeType - MIME type of the file
 * @param expiresInMinutes - Expiration time for the SAS token in minutes
 * @returns Object containing blob URL and blob name
 */
export async function uploadFileWithSas(
  file: Buffer,
  fileName: string,
  mimeType: string,
  expiresInMinutes = 60
): Promise<{ blobUrl: string; blobName: string }> {
  // Generate unique blob name
  const blobName = generateUniqueFilename(fileName);
  
  // Generate SAS token with write permission
  const sasToken = generateBlobSasToken(blobName, BlobSASPermissions.parse('rw'), expiresInMinutes);
  
  // Construct blob URL with SAS token
  const blobUrl = `${blobServiceClient.url}/${containerName}/${blobName}?${sasToken}`;
  
  try {
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Ensure container exists
    await containerClient.createIfNotExists({
      access: 'blob',
    });

    // Get blob client
    const blobClient = containerClient.getBlockBlobClient(blobName);
    
    // Upload file
    await blobClient.uploadData(file, {
      blobHTTPHeaders: {
        blobContentType: mimeType,
      },
    });

    return {
      blobUrl,
      blobName,
    };
  } catch (error) {
    console.error('Error uploading file with SAS to blob storage:', error);
    throw new Error('Failed to upload file with SAS to storage');
  }
}

/**
 * Generate SAS token for direct client-side upload
 * @param originalFileName - Original name of the file
 * @param userId - ID of the user uploading the file
 * @returns Object containing SAS URL, blob name, and container URL
 */
export async function generateSasToken(
  originalFileName: string,
  userId: string
): Promise<{ sasUrl: string; blobName: string; containerUrl: string }> {
  try {
    if (!accountName || !accountKey) {
      throw new Error('Azure Storage account credentials not configured');
    }

    // Generate unique blob name
    const uniqueFileName = generateUniqueFilename(originalFileName);
    const blobName = `${userId}/${Date.now()}-${uniqueFileName}`;
    
    // Create shared key credential
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    
    // Set SAS token permissions and expiry
    const sasOptions = {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('w'), // Write permission only
      startsOn: new Date(),
      expiresOn: new Date(new Date().valueOf() + 60 * 60 * 1000), // 1 hour from now
    };
    
    // Generate SAS query parameters
    const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
    
    // Construct the SAS URL
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(blobName);
    const sasUrl = `${blobClient.url}?${sasToken}`;
    
    return {
      sasUrl,
      blobName,
      containerUrl: containerClient.url
    };
  } catch (error) {
    console.error('Error generating SAS token:', error);
    throw new Error('Failed to generate SAS token');
  }
}

/**
 * Configure CORS settings for Azure Blob Storage
 * This should be run once to set up CORS for client-side uploads
 */
export async function configureBlobStorageCors(): Promise<void> {
  try {
    const serviceProperties = await blobServiceClient.getProperties();
      // Configure CORS rules
    const corsRules = [
      {
        allowedOrigins: 'http://localhost:3000,https://localhost:3000,https://storage.sujal.info',
        allowedMethods: 'GET,PUT,POST,DELETE,HEAD,OPTIONS',
        allowedHeaders: 'x-ms-*,content-type,content-length,content-md5,x-ms-blob-type,x-ms-blob-content-type',
        exposedHeaders: 'x-ms-*',
        maxAgeInSeconds: 86400, // 24 hours
      }
    ];

    await blobServiceClient.setProperties({
      ...serviceProperties,
      cors: corsRules,
    });

    console.log('CORS configuration updated successfully');
  } catch (error) {
    console.error('Error configuring CORS:', error);
    throw new Error('Failed to configure CORS settings');
  }
}
