import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import { File } from '@/models';
import { uploadFileToBlob } from '@/lib/azure-storage';
import { getFileType, generateUniqueFilename } from '@/lib/file-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size (2GB limit)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 2GB.' 
      }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name);
    
    // Upload to Azure Blob Storage
    const { blobUrl, blobName } = await uploadFileToBlob(
      buffer,
      uniqueFilename,
      file.type
    );

    // Determine file type
    const fileType = getFileType(file.type);

    // Connect to database
    await connectDB();

    // Save file metadata to database
    const fileDocument = new File({
      name: file.name,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      fileType,
      blobUrl,
      blobName,
      userId: session.user.id,
    });

    await fileDocument.save();

    return NextResponse.json({
      message: 'File uploaded successfully',
      file: {
        id: fileDocument._id,
        name: fileDocument.name,
        size: fileDocument.size,
        mimeType: fileDocument.mimeType,
        fileType: fileDocument.fileType,
        blobUrl: fileDocument.blobUrl,
        uploadedAt: fileDocument.uploadedAt,
      }
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
