import { BlobServiceClient } from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'drive-files';

if (!connectionString) {
  throw new Error('Azure Storage connection string is not defined');
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
