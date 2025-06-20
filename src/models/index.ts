import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  name: string;
  password: string;
  avatar?: string;
  storageLimit: number; // in bytes
  storageUsed: number; // in bytes
  starredFiles: string[]; // array of file IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface IFile extends Document {
  _id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  fileType: 'image' | 'video' | 'pdf' | 'document' | 'other';
  blobUrl: string;
  blobName: string;
  userId: string;
  uploadedAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  isStarred: boolean;  tags?: string[];
  description?: string;
  sharedWith?: string[]; // array of user IDs
  isPublic?: boolean;
  shareToken?: string;
  shareExpiry?: Date;
  isYouTube?: boolean;
  youTubeData?: {
    type: 'youtube-video' | 'youtube-playlist';
    videoId?: string;
    playlistId?: string;
    thumbnail?: string;
  };
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },  avatar: {
    type: String,
    default: null
  },
  storageLimit: {
    type: Number,
    default: 5 * 1024 * 1024 * 1024 // 5GB in bytes
  },
  storageUsed: {
    type: Number,
    default: 0
  },
  starredFiles: [{
    type: Schema.Types.ObjectId,
    ref: 'File'
  }]
}, {
  timestamps: true
});

const FileSchema = new Schema<IFile>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['image', 'video', 'pdf', 'document', 'other'],
    required: true
  },
  blobUrl: {
    type: String,
    required: true
  },
  blobName: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true
  },  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    trim: true
  },
  sharedWith: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],  isPublic: {
    type: Boolean,
    default: false
  },
  shareToken: {
    type: String,
    default: null
  },  shareExpiry: {
    type: Date,
    default: null
  },
  isYouTube: {
    type: Boolean,
    default: false
  },
  youTubeData: {
    type: {
      type: String,
      enum: ['youtube-video', 'youtube-playlist']
    },
    videoId: String,
    playlistId: String,
    thumbnail: String
  }
}, {
  timestamps: { createdAt: 'uploadedAt', updatedAt: true }
});

// Create indexes for better query performance
FileSchema.index({ userId: 1, isDeleted: 1 });
FileSchema.index({ name: 'text', description: 'text' });
FileSchema.index({ fileType: 1 });
FileSchema.index({ uploadedAt: -1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const File = mongoose.models.File || mongoose.model<IFile>('File', FileSchema);
