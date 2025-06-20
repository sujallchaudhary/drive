import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/mongodb';
import { File } from '@/models';
import { FileFilter } from '@/types';

/**
 * GET /api/files - Retrieve user's files with optional filtering and search
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const filter = (searchParams.get('filter') as FileFilter) || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;    // Build query
    const query: Record<string, unknown> = {
      userId: session.user.id,
      isDeleted: false
    };

    // Add text search if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }    // Add file type filter
    if (filter !== 'all') {
      if (filter === 'starred') {
        query.isStarred = true;
      } else if (filter === 'recent') {
        // Recent files from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query.uploadedAt = { $gte: sevenDaysAgo };
      } else if (filter === 'trash') {
        query.isDeleted = true;
        delete query.isDeleted; // Remove the previous isDeleted: false
      } else {
        const typeMap: Record<FileFilter, string[]> = {
          all: [],
          images: ['image'],
          videos: ['video'],
          pdfs: ['pdf'],
          docs: ['document'],
          starred: [],
          recent: [],
          trash: [],
        };
        
        if (typeMap[filter] && typeMap[filter].length > 0) {
          query.fileType = { $in: typeMap[filter] };
        }
      }
    }

    // Execute query with pagination
    const [files, totalCount] = await Promise.all([
      File.find(query)
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      File.countDocuments(query)
    ]);

    return NextResponse.json({
      files,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + files.length < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
