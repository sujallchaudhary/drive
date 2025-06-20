import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import { File, User } from '@/models';
import { deleteFileFromBlob } from '@/lib/azure-storage';

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
    }

    // Delete from Azure Blob Storage
    try {
      await deleteFileFromBlob(file.blobName);
    } catch (error) {
      console.error('Error deleting from blob storage:', error);
      // Continue with database deletion even if blob deletion fails
    }

    // Update user's storage usage
    const user = await User.findById(session.user.id);
    if (user) {
      user.storageUsed = Math.max(0, (user.storageUsed || 0) - file.size);
      await user.save();
    }

    // Mark file as deleted (soft delete)
    file.isDeleted = true;
    await file.save();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
