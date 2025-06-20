import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { File } from '@/models';

/**
 * GET /api/share/[token] - Get file by share token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectDB();

    const { token } = await params;
    const file = await File.findOne({ 
      shareToken: token,
      isPublic: true,
      isDeleted: false 
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found or not shared' }, { status: 404 });
    }

    return NextResponse.json({ 
      file: {
        _id: file._id,
        name: file.name,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        fileType: file.fileType,
        blobUrl: file.blobUrl,
        uploadedAt: file.uploadedAt,
        description: file.description
      }
    });

  } catch (error) {
    console.error('Error fetching shared file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
