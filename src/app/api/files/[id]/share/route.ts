import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/mongodb';
import { File } from '@/models';
import crypto from 'crypto';

/**
 * POST /api/files/[id]/share - Generate a shareable link for a file
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id: fileId } = await params;
    const file = await File.findOne({ 
      _id: fileId, 
      userId: session.user.id,
      isDeleted: false 
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Generate a unique share token if not exists
    if (!file.shareToken) {
      file.shareToken = crypto.randomBytes(8).toString('hex');
      file.isPublic = true;
      await file.save();
    }

    // Generate the shareable URL
    const baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const shareUrl = `${baseUrl}/share/${file.shareToken}`;

    return NextResponse.json({ 
      success: true,
      shareUrl,
      shareToken: file.shareToken
    });

  } catch (error) {
    console.error('Error generating share link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files/[id]/share - Remove public sharing for a file
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id: fileId } = await params;
    const file = await File.findOne({ 
      _id: fileId, 
      userId: session.user.id,
      isDeleted: false 
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Remove public sharing
    file.shareToken = undefined;
    file.isPublic = false;
    await file.save();

    return NextResponse.json({ 
      success: true
    });

  } catch (error) {
    console.error('Error removing share link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
