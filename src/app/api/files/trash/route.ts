import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/mongodb';
import { File } from '@/models';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get all deleted files for the user
    const trashedFiles = await File.find({
      userId: session.user.id,
      isDeleted: true
    }).sort({ deletedAt: -1 });

    // Transform the data to match our FileMetadata interface
    const files = trashedFiles.map(file => ({
      _id: file._id.toString(),
      name: file.name,
      originalName: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      fileType: file.fileType,
      blobUrl: file.blobUrl,
      blobName: file.blobName,
      uploadedAt: file.uploadedAt,
      updatedAt: file.updatedAt,
      deletedAt: file.deletedAt,
      userId: file.userId,
      isStarred: file.isStarred || false,
      isDeleted: file.isDeleted,
      shareToken: file.shareToken,
      shareExpiry: file.shareExpiry,
      description: file.description
    }));

    return NextResponse.json({
      success: true,
      files,
      count: files.length
    });

  } catch (error) {
    console.error('Error fetching trash files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trash files' },
      { status: 500 }
    );
  }
}
