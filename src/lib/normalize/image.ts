/**
 * Client-side image downscaling utility.
 * Downscales images to max 1600px on the longest dimension (JPEG quality 0.85).
 * Ensures files are <= 1.5MB and total request stays < 4.0MB (within Vercel 4.5MB ceiling).
 */

export const MAX_DIMENSION = 1600;
export const JPEG_QUALITY = 0.85;
export const MAX_FILE_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5 MB
export const MAX_TOTAL_SIZE_BYTES = 4.0 * 1024 * 1024; // 4.0 MB

export interface ProcessedUpload {
  file: File | Blob;
  fileName: string;
  fileSize: number;
  previewUrl: string;
  mimeType: string;
  isDownscaled: boolean;
}

export async function processUploadFile(file: File): Promise<ProcessedUpload> {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (!isImage && !isPdf) {
    throw new Error('Unsupported file format. Please upload PDF, PNG, or JPEG documents.');
  }

  // If PDF: enforce 1.5MB cap directly
  if (isPdf) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`PDF exceeds 1.5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please compress the file or upload page images.`);
    }
    return {
      file,
      fileName: file.name,
      fileSize: file.size,
      previewUrl: URL.createObjectURL(file),
      mimeType: 'application/pdf',
      isDownscaled: false,
    };
  }

  // If Image: downscale using HTML5 Canvas in browser
  if (typeof window === 'undefined') {
    return {
      file,
      fileName: file.name,
      fileSize: file.size,
      previewUrl: '',
      mimeType: file.type,
      isDownscaled: false,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Downscale if either dimension exceeds MAX_DIMENSION
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve({
          file,
          fileName: file.name,
          fileSize: file.size,
          previewUrl: URL.createObjectURL(file),
          mimeType: file.type,
          isDownscaled: false,
        });
        return;
      }

      // Draw white background then image (handles transparent PNGs)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to process image blob.'));
            return;
          }

          if (blob.size > MAX_FILE_SIZE_BYTES) {
            reject(
              new Error(
                `Image exceeds 1.5MB limit even after compression (${(blob.size / (1024 * 1024)).toFixed(1)}MB).`
              )
            );
            return;
          }

          const downscaledFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
          });

          resolve({
            file: downscaledFile,
            fileName: downscaledFile.name,
            fileSize: downscaledFile.size,
            previewUrl: URL.createObjectURL(blob),
            mimeType: 'image/jpeg',
            isDownscaled: true,
          });
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for downscaling.'));
    };

    img.src = url;
  });
}
