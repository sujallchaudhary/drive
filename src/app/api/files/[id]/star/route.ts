import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import { File } from '@/models';

/**
 * POST /api/files/[id]/star - Toggle star status of a file
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

    // Toggle starred status
    file.isStarred = !file.isStarred;
    await file.save();

    return NextResponse.json({ 
      success: true, 
      isStarred: file.isStarred 
    });

  } catch (error) {
    console.error('Error toggling star:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
