import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/mongodb';
import { File } from '@/models';

interface YouTubeUploadRequest {
  type: 'youtube-video' | 'youtube-playlist';
  url: string;
  title: string;
  description?: string;
  thumbnail: string;
  videoId?: string;
  playlistId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body: YouTubeUploadRequest = await request.json();
    const { type, url, title, description, thumbnail, videoId, playlistId } = body;

    // Validate required fields
    if (!type || !url || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if YouTube video already exists for this user
    const existingFile = await File.findOne({
      userId: session.user.id,
      blobUrl: url,
      isDeleted: false
    });

    if (existingFile) {
      return NextResponse.json(
        { error: 'This YouTube video is already in your drive' },
        { status: 409 }
      );
    }

    // Create YouTube file entry
    const fileData = {
      name: title,
      originalName: title,
      size: 0, // YouTube videos don't count toward storage
      mimeType: type === 'youtube-playlist' ? 'application/x-youtube-playlist' : 'video/youtube',
      fileType: 'video' as const,
      blobUrl: url, // Store the YouTube URL
      blobName: videoId || playlistId || `youtube-${Date.now()}`, // Use video/playlist ID
      userId: session.user.id,
      description,
      tags: ['youtube', type === 'youtube-playlist' ? 'playlist' : 'video'],
      isYouTube: true,
      youTubeData: {
        type,
        videoId,
        playlistId,
        thumbnail
      }
    };

    const file = await File.create(fileData);    // Transform the response to match FileMetadata interface
    const responseFile = {
      _id: file._id.toString(),
      name: file.name,
      originalName: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      fileType: file.fileType,
      blobUrl: file.blobUrl,
      blobName: file.blobName,
      uploadedAt: file.uploadedAt,
      updatedAt: file.updatedAt,
      userId: file.userId,
      isStarred: file.isStarred || false,
      isDeleted: file.isDeleted || false,
      description: file.description,
      tags: file.tags,
      isYouTube: file.isYouTube,
      youTubeData: file.youTubeData
    };

    return NextResponse.json({
      success: true,
      file: responseFile
    });

  } catch (error) {
    console.error('Error adding YouTube video:', error);
    return NextResponse.json(
      { error: 'Failed to add YouTube video' },
      { status: 500 }
    );
  }
}
