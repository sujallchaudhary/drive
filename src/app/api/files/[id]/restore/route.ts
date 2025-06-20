import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/mongodb';
import { File } from '@/models';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
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

    // Restore the file
    await File.findByIdAndUpdate(id, {
      isDeleted: false,
      $unset: { deletedAt: 1 },
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'File restored successfully'
    });

  } catch (error) {
    console.error('Error restoring file:', error);
    return NextResponse.json(
      { error: 'Failed to restore file' },
      { status: 500 }
    );
  }
}
