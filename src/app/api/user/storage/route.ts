import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import { User } from '@/models';

/**
 * GET /api/user/storage - Get user storage information
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      storageUsed: user.storageUsed || 0,
      storageLimit: user.storageLimit || 5 * 1024 * 1024 * 1024, // 5GB default
      percentageUsed: ((user.storageUsed || 0) / (user.storageLimit || 5 * 1024 * 1024 * 1024)) * 100
    });

  } catch (error) {
    console.error('Error fetching storage info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
