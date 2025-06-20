import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import { File, User } from '@/models';
import { getFileType } from '@/lib/file-utils';
import { blobExists } from '@/lib/azure-storage';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      fileName, 
      originalName,
      fileSize, 
      mimeType, 
      blobName, 
      blobUrl 
    } = await request.json();
    
    if (!fileName || !fileSize || !mimeType || !blobName || !blobUrl) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Verify the blob was actually uploaded
    const exists = await blobExists(blobName);
    if (!exists) {
      return NextResponse.json({ 
        error: 'File upload verification failed' 
      }, { status: 400 });
    }

    // Connect to database
    await connectDB();

    // Get user and update storage usage
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine file type
    const fileType = getFileType(mimeType);

    // Save file metadata to database
    const fileDocument = new File({
      name: originalName || fileName,
      originalName: originalName || fileName,
      size: fileSize,
      mimeType,
      fileType,
      blobUrl,
      blobName,
      userId: session.user.id,
      isStarred: false,
      isDeleted: false,
    });

    await fileDocument.save();

    // Update user's storage usage
    const currentUsage = user.storageUsed || 0;
    user.storageUsed = currentUsage + fileSize;
    await user.save();

    return NextResponse.json({
      message: 'File registered successfully',
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
    console.error('Error registering file:', error);
    return NextResponse.json(
      { 
        error: 'Failed to register file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
