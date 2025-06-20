import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import { File } from '@/models';

/**
 * PATCH /api/files/[id]/rename - Rename a file
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    const { id: fileId } = await params;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

    await connectDB();

    const file = await File.findOne({ 
      _id: fileId, 
      userId: session.user.id,
      isDeleted: false 
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Update the file name
    file.name = name.trim();
    await file.save();

    return NextResponse.json({ 
      success: true, 
      file: file 
    });

  } catch (error) {
    console.error('Error renaming file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
