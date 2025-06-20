# Drive Clone - Modern Cloud Storage Solution

A feature-rich Google Drive clone built with Next.js 15, React 19, and modern web technologies. This application provides a complete cloud storage solution with file upload, preview, search, and management capabilities.

![Drive Clone Demo](https://via.placeholder.com/800x400/0f172a/ffffff?text=Drive+Clone+Dashboard)

## 🚀 Features

### Core Functionality
- **File Upload**: Drag-and-drop interface with multiple file support
- **File Management**: Organize, rename, delete, and manage your files
- **File Preview**: 
  - Images: High-quality lightbox preview
  - Videos: HTML5 video player with controls
  - PDFs: In-browser PDF viewer
  - Documents: Download and external viewing options
- **Search & Filter**: Fuzzy search with category filters (Images, Videos, PDFs, Documents)
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### User Experience
- **Dark/Light Mode**: System preference detection with manual toggle
- **Real-time Upload Progress**: Visual feedback during file uploads
- **Intuitive Interface**: Clean, modern design inspired by Google Drive
- **Table & Grid Views**: Switch between detailed table and visual grid layouts

### Technical Features
- **Authentication**: Secure email/password authentication with NextAuth.js
- **File Storage**: Azure Blob Storage for reliable file storage
- **Database**: MongoDB for metadata and user management
- **Type Safety**: Full TypeScript implementation
- **Modern UI**: shadcn/ui components with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React features and performance improvements
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern, accessible UI components
- **Lucide React** - Beautiful, customizable icons

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **NextAuth.js** - Authentication solution
- **MongoDB & Mongoose** - Database and ODM
- **Azure Blob Storage** - Cloud file storage
- **bcryptjs** - Password hashing

### Development Tools
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing
- **React Dropzone** - File upload interface

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB database (local or Atlas)
- Azure Storage Account

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/drive-clone.git
cd drive-clone
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/google-drive-clone
MONGODB_DB=google-drive-clone

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=your-azure-storage-connection-string
AZURE_STORAGE_CONTAINER_NAME=drive-files
```

### 4. Set Up Azure Blob Storage
1. Create an Azure Storage Account
2. Get your connection string from the Azure portal
3. Update the `AZURE_STORAGE_CONNECTION_STRING` in your `.env.local`

### 5. Set Up MongoDB
Either use MongoDB Atlas (cloud) or local MongoDB:

**For MongoDB Atlas:**
1. Create a cluster at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Get your connection string
3. Update `MONGODB_URI` in `.env.local`

**For Local MongoDB:**
```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 6. Generate NextAuth Secret
```bash
# Generate a secure secret
openssl rand -base64 32
```
Add the generated secret to `NEXTAUTH_SECRET` in `.env.local`

### 7. Run the Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## 🚀 Deployment

### Deploy to Vercel
The easiest way to deploy is using [Vercel](https://vercel.com):

```bash
npm install -g vercel
vercel
```

Make sure to add all your environment variables in the Vercel dashboard.

### Deploy to Other Platforms
This Next.js application can be deployed to any platform that supports Node.js:
- Netlify
- Railway
- Render
- AWS
- Google Cloud Platform

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── files/        # File management endpoints
│   │   ├── upload/       # File upload endpoint
│   │   └── register/     # User registration
│   ├── auth/             # Authentication pages
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── providers.tsx     # Context providers
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── files/            # File management components
│   ├── layout/           # Layout components
│   └── ui/               # UI components (shadcn/ui)
├── lib/                  # Utility functions
│   ├── azure-storage.ts  # Azure Blob Storage utilities
│   ├── db.ts            # Database connection
│   ├── file-utils.ts    # File processing utilities
│   └── utils.ts         # General utilities
├── models/               # MongoDB models
│   └── index.ts         # User and File models
└── types/               # TypeScript type definitions
    └── index.ts         # Application types
```

## 🔧 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### File Management
- `GET /api/files` - Retrieve user files with filtering and search
- `POST /api/upload` - Upload new files
- `DELETE /api/files/[id]` - Delete a file

### Query Parameters for `/api/files`
- `filter`: Filter by file type (`all`, `images`, `videos`, `pdfs`, `docs`)
- `search`: Search query for file names and descriptions
- `page`: Page number for pagination
- `limit`: Items per page

## 🎨 Customization

### Theming
The application uses Tailwind CSS with CSS variables for theming. You can customize the color scheme in:
- `src/app/globals.css` - CSS variables for light/dark themes
- `tailwind.config.ts` - Tailwind configuration

### File Upload Limits
Modify file size limits in:
- `src/components/files/file-upload.tsx` - Frontend validation
- `src/app/api/upload/route.ts` - Backend validation

### Storage Configuration
Change storage providers by modifying:
- `src/lib/azure-storage.ts` - Current Azure implementation
- Create alternative storage utilities for AWS S3, Google Cloud Storage, etc.

## 🔒 Security

- **Password Security**: Passwords are hashed using bcryptjs
- **Session Management**: Secure JWT sessions with NextAuth.js
- **File Access Control**: Files are associated with user accounts
- **Input Validation**: Server-side validation for all API endpoints
- **Environment Variables**: Sensitive data stored in environment variables

## 🧪 Testing

Run the application locally and test the following scenarios:

### File Upload Testing
1. Single file upload
2. Multiple file upload
3. Large file upload (test size limits)
4. Different file types (images, videos, PDFs, documents)

### File Management Testing
1. File preview for different types
2. File download
3. File deletion
4. Search functionality
5. Filter functionality

### Authentication Testing
1. User registration
2. User login
3. Session persistence
4. Logout functionality

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Issues:**
```bash
# Check if MongoDB is running
mongosh --host localhost:27017

# For connection string issues, ensure proper URL encoding
```

**Azure Storage Issues:**
- Verify your connection string is correct
- Check that the storage container exists
- Ensure proper permissions are set

**NextAuth Issues:**
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Ensure all callback URLs are configured

**File Upload Issues:**
- Check file size limits
- Verify Azure storage configuration
- Check network connectivity

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you have any questions or need help with setup, please open an issue in the GitHub repository.

---

**Built with ❤️ using Next.js, React, and modern web technologies**
