import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { generateSasToken } from '@/lib/azure-storage';
import connectDB from '@/lib/db';
import { User } from '@/models';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, fileSize, mimeType } = await request.json();
    
    if (!fileName || !fileSize || !mimeType) {
      return NextResponse.json({ 
        error: 'Missing required fields: fileName, fileSize, mimeType' 
      }, { status: 400 });
    }

    // Check file size (2GB limit)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB in bytes
    if (fileSize > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 2GB.' 
      }, { status: 400 });
    }

    // Connect to database and check user's storage limit
    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUsage = user.storageUsed || 0;
    const storageLimit = user.storageLimit || 5 * 1024 * 1024 * 1024; // 5GB default

    if (currentUsage + fileSize > storageLimit) {
      return NextResponse.json({ 
        error: 'Storage limit exceeded. Please upgrade your plan or delete some files.' 
      }, { status: 400 });
    }

    // Generate SAS token for direct upload
    const { sasUrl, blobName, containerUrl } = await generateSasToken(fileName, session.user.id);

    return NextResponse.json({
      sasUrl,
      blobName,
      containerUrl,
      // Return upload metadata for the client
      uploadMetadata: {
        fileName,
        fileSize,
        mimeType,
        userId: session.user.id
      }
    });

  } catch (error) {
    console.error('Error generating SAS token:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate upload token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
