import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';

cloudinary.config({
     cloud_name: process.env.NEXt_PUBLIC_CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET
});

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = {
    image: ['image/jpeg', 'image/png',
      'image/gif', 'image/webp', 'image/svg*xml'
    ],
    video: ['video/mp4', 'video/webm', 'video/ogg'],
    file: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

export async function POST(req: NextRequest) {
    try {
      
      const formData = await req.formData();
      const file = formData.get("file") as File

      if (!file) {
          return NextResponse.json({ error: `No file uploaded` }, { status: 400 })
      }

      if(file.size > MAX_FILE_SIZE){
           return NextResponse.json({ error: "File size is to large. It should less than 10MB "}, { status: 400 })
      }

      const mimeType = file.type
      const allAllowedTypes = [...ALLOWED_TYPES.image, ...ALLOWED_TYPES.video, ...ALLOWED_TYPES.file]

      if (!allAllowedTypes.includes(mimeType) && !mimeType.startsWith("image/")) {
          return NextResponse.json({ error: "File type not allowed" }, { status: 400 })
      }

      // Conver file to Buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      let folder = "chat-files";
      if(ALLOWED_TYPES.image.includes(mimeType) || mimeType.startsWith("image/")){
            folder = "chat-images";
      }else if(ALLOWED_TYPES.video.includes(mimeType) || mimeType.startsWith("image/")){
            folder = "chat-videos";
      }

      const timestamp = Date.now();
      const fileName = file.name.split(".")[0].replace(/[^a-zA-Z0-9]/g, "_")
      const publicId = `${folder}/${timestamp}_${fileName}`
      
      const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({
               folder,
               resource_type: "auto",
               public_id: publicId
          },
             (error, result) => {
                 if (error) reject(error)
                 else resolve(result)
             }
        ).end(buffer)
      })
      
      let type = "file"
      if (ALLOWED_TYPES.image.includes(mimeType) || mimeType.startsWith("image/")) type = "image"
      else if (ALLOWED_TYPES.video.includes(mimeType) || mimeType.startsWith("video/")) type = "video"

      return NextResponse.json({
          url: (result as any).secure_url,
          type,
          publicId: (result as any).public_id,
          format: (result as any).format,
          bytes: (result as any).bytes
      })

    } catch (error) {
      
    }
}