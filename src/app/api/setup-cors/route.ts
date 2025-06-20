import { NextResponse } from 'next/server';
import { configureBlobStorageCors } from '@/lib/azure-storage';

export async function POST() {
  try {
    // This is a one-time setup endpoint - you might want to add authentication
    // or remove this after initial setup for security
    
    await configureBlobStorageCors();
    
    return NextResponse.json({
      message: 'CORS configuration updated successfully'
    });

  } catch (error) {
    console.error('Error configuring CORS:', error);
    return NextResponse.json(
      { 
        error: 'Failed to configure CORS',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
