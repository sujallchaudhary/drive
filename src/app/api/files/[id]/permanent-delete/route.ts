import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/mongodb';
import { File, User } from '@/models';
import { deleteFileFromBlob } from '@/lib/azure-storage';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    await connectDB();
    
    // Find the deleted file and verify ownership
    const file = await File.findOne({
      _id: id,
      userId: session.user.id,
      isDeleted: true
    });
    
    if (!file) {
      return NextResponse.json(
        { error: 'File not found in trash' },
        { status: 404 }
      );
    }

    // Permanently delete from Azure Blob Storage
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

    // Permanently delete from database
    await File.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'File permanently deleted'
    });

  } catch (error) {
    console.error('Error permanently deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to permanently delete file' },
      { status: 500 }
    );
  }
}
