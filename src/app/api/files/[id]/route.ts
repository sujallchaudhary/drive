import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/mongodb';
import { File } from '@/models';

/**
 * DELETE /api/files/[id] - Delete a file
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
    }    // Soft delete - just mark as deleted, don't remove from storage yet
    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();

    return NextResponse.json({ 
      success: true, 
      message: 'File moved to trash' 
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
