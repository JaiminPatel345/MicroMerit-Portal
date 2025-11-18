# Image Upload Implementation - Profile Photos

## Overview
This document describes the implementation of profile photo upload functionality for learner registration (Stage 3) and profile updates. The implementation supports both base64-encoded images and direct S3 URLs.

## Implementation Details

### Option B: Base64 in Registration (Implemented)

The system now automatically detects and handles both base64 images and URLs:

1. **Frontend** sends either:
   - Base64-encoded image (e.g., `data:image/png;base64,...`)
   - Pre-existing S3 URL (e.g., `https://bucket.s3.amazonaws.com/...`)

2. **Backend** automatically:
   - Detects the input type
   - If base64: Uploads to S3 and stores the S3 URL
   - If URL: Validates and stores as-is

## Files Modified

### 1. New File: `server/node-app/src/utils/imageUpload.ts`
Utility functions for handling image uploads:

- `isBase64Image()` - Detects if string is base64 image
- `extractMimeType()` - Extracts MIME type from base64
- `getExtensionFromMimeType()` - Maps MIME type to file extension
- `base64ToBuffer()` - Converts base64 to Buffer
- `generateImageFilename()` - Generates unique S3 filename
- `uploadBase64ImageToS3()` - Uploads base64 image to S3
- `handleProfilePhotoUpload()` - Main function that handles both base64 and URLs

### 2. Modified: `server/node-app/src/modules/learner-registration/schema.ts`
- Changed `profilePhotoUrl` validation from strict `.url()` to `.optional()`
- Now accepts both base64 strings and URLs

### 3. Modified: `server/node-app/src/modules/learner-registration/service.ts`
- Added import for `handleProfilePhotoUpload` utility
- Updated `completeRegistration()` method to:
  - Process profile photo before creating learner
  - Upload base64 to S3 if needed
  - Store S3 URL in database
  - Handle errors gracefully with detailed logging

### 4. Modified: `server/node-app/src/modules/learner/schema.ts`
- Updated `updateLearnerProfileSchema` to accept base64 or URL
- Updated `learnerRegistrationSchema` for consistency

### 5. Modified: `server/node-app/src/modules/learner/service.ts`
- Updated `updateProfile()` method to handle base64 uploads
- Added same upload logic as registration

## Flow Diagram

```
┌─────────────┐
│  Frontend   │
│ (React)     │
└──────┬──────┘
       │
       │ 1. User selects image
       │ 2. Convert to base64
       │ 3. Send to backend
       ▼
┌──────────────────────────────────────┐
│  POST /auth/learner/complete-register │
│                                       │
│  {                                    │
│    name: "John Doe",                  │
│    profilePhotoUrl: "data:image/..."  │
│  }                                    │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Registration Service                 │
│  (completeRegistration)               │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  handleProfilePhotoUpload()           │
│                                       │
│  • Detect base64 vs URL               │
│  • If base64:                         │
│    - Validate format & size           │
│    - Extract MIME type                │
│    - Convert to Buffer                │
│    - Generate unique filename         │
│    - Upload to S3                     │
│    - Return S3 URL                    │
│  • If URL:                            │
│    - Validate URL format              │
│    - Return as-is                     │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  S3 Service                           │
│  (s3Service.uploadFile)               │
│                                       │
│  • Upload to bucket                   │
│  • Path: profile-photos/learner-X/... │
│  • Return public URL                  │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Database (Prisma)                    │
│                                       │
│  learner.profileUrl = "https://..."   │
└───────────────────────────────────────┘
```

## Endpoints Supporting Image Upload

### 1. Registration (Stage 3)
**Endpoint:** `POST /auth/learner/complete-register`

**Headers:**
```
Authorization: Bearer <temp_token_from_verify_otp>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "profilePhotoUrl": "data:image/png;base64,iVBORw0KGgo...",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration completed successfully",
  "data": {
    "learner": {
      "id": 1,
      "email": "john@example.com",
      "profileUrl": "https://bucket.s3.amazonaws.com/profile-photos/learner-temp-abc123/1234567890-abcd1234.png",
      "otherEmails": []
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### 2. Update Profile
**Endpoint:** `PUT /auth/learner/me`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "profileUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "email": "john@example.com",
    "profileUrl": "https://bucket.s3.amazonaws.com/profile-photos/learner-1/1234567890-xyz789.jpg",
    "status": "active"
  }
}
```

## Image Requirements

### Supported Formats
- PNG (`.png`)
- JPEG (`.jpg`, `.jpeg`)
- GIF (`.gif`)
- WebP (`.webp`)
- BMP (`.bmp`)

### Size Limits
- Maximum file size: **5MB**
- Enforced during base64 conversion

### S3 Storage Structure
```
profile-photos/
├── learner-1/
│   ├── 1637123456789-abc123def456.png
│   └── 1637234567890-xyz789ghi012.jpg
├── learner-2/
│   └── 1637345678901-mno345pqr678.png
└── temp-abc12345/
    └── 1637456789012-stu901vwx234.png
```

## Error Handling

### Common Errors

1. **Invalid Base64 Format**
```json
{
  "success": false,
  "message": "Profile photo upload failed: Invalid base64 image format. Expected data:image/[type];base64,...",
  "error": "PROFILE_PHOTO_UPLOAD_FAILED",
  "statusCode": 400
}
```

2. **File Size Exceeded**
```json
{
  "success": false,
  "message": "Profile photo upload failed: Image size exceeds 5MB limit",
  "error": "PROFILE_PHOTO_UPLOAD_FAILED",
  "statusCode": 400
}
```

3. **S3 Upload Failed**
```json
{
  "success": false,
  "message": "Profile photo upload failed: Failed to upload file to S3",
  "error": "PROFILE_PHOTO_UPLOAD_FAILED",
  "statusCode": 400
}
```

4. **Invalid URL**
```json
{
  "success": false,
  "message": "Profile photo upload failed: Profile photo must be either a valid URL or base64 encoded image",
  "error": "PROFILE_PHOTO_UPLOAD_FAILED",
  "statusCode": 400
}
```

## Frontend Integration

### Example: React Component

```javascript
const handleFileChange = (e) => {
  const file = e.target.files?.[0];
  if (file) {
    // Validate size
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ profilePic: 'File size must be less than 5MB' });
      return;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      // This will be in format: data:image/png;base64,...
      setFormData(prev => ({ 
        ...prev, 
        profilePhotoUrl: reader.result 
      }));
    };
    reader.readAsDataURL(file);
  }
};

// On form submit
const handleSubmit = async () => {
  const response = await fetch('/api/auth/learner/complete-register', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tempToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: formData.fullName,
      profilePhotoUrl: formData.profilePhotoUrl, // Base64 string
      password: formData.password,
    }),
  });
  
  const data = await response.json();
  console.log('Profile URL from S3:', data.data.learner.profileUrl);
};
```

## Environment Variables

Ensure these are set in your `.env`:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=micromerit-certificates

# JWT Configuration
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
```

## Testing

Run the image upload tests:
```bash
npm test -- image-upload.test.ts
```

## Performance Considerations

1. **Base64 Size**: Base64 encoding increases file size by ~33%. A 1MB image becomes ~1.33MB in base64.

2. **Request Size**: Ensure your API can handle larger request bodies:
   ```javascript
   // In Express app.ts
   app.use(express.json({ limit: '10mb' }));
   ```

3. **Upload Time**: Base64 uploads are synchronous and block the registration request. For production, consider:
   - Client-side compression before base64 conversion
   - Async upload with progress indicators
   - Alternative: Direct S3 upload with presigned URLs (Option A)

## Security Considerations

1. **File Type Validation**: Only accepts image MIME types
2. **Size Limits**: 5MB maximum enforced
3. **Unique Filenames**: Prevents overwrites and conflicts
4. **S3 Permissions**: Files are public-read by default (ACL: 'public-read')
5. **User Isolation**: Photos stored in user-specific folders

## Future Improvements

1. **Image Optimization**: Resize/compress images before storing
2. **CDN Integration**: Serve images through CloudFront
3. **Thumbnail Generation**: Create multiple sizes
4. **Presigned URLs**: Allow direct S3 uploads (Option A)
5. **Old Image Cleanup**: Delete old profile photos when updated
6. **Image Validation**: Check for malicious content

## Rollback Plan

If issues arise, you can revert to URL-only validation:

1. Revert schema changes to use `.url()` validation
2. Remove `handleProfilePhotoUpload` calls
3. Require frontend to upload images separately
4. Document the separate upload endpoint requirement
