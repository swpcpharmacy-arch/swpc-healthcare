export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
  previewUrl: string;
}

/**
 * Client-side image compression using HTML5 Canvas
 * Resizes max dimension to 1400px and encodes to JPEG/WebP with 0.82 quality
 * Decreases typical 4-10MB mobile photos down to 100-250KB without noticeable quality loss
 */
export async function compressImage(
  file: File,
  maxDimension: number = 1400,
  quality: number = 0.82
): Promise<CompressionResult> {
  // If file is not an image or already under 100KB, return as is
  if (!file.type.startsWith('image/') || file.size < 100 * 1024) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      reductionPercentage: 0,
      previewUrl: URL.createObjectURL(file),
    };
  }

  return new Promise((resolve) => {
    const originalSize = file.size;
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calculate proportional scale
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if canvas context fails
          resolve({
            file,
            originalSize,
            compressedSize: originalSize,
            reductionPercentage: 0,
            previewUrl: URL.createObjectURL(file),
          });
          return;
        }

        // Fill white background in case of transparent PNG converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Try webp or jpeg
        const outputMime = 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= originalSize) {
              // If compression didn't save space, keep original
              resolve({
                file,
                originalSize,
                compressedSize: originalSize,
                reductionPercentage: 0,
                previewUrl: URL.createObjectURL(file),
              });
              return;
            }

            const cleanFileName = file.name.replace(/\.[^/.]+$/, '.jpg');
            const compressedFile = new File([blob], cleanFileName, {
              type: outputMime,
              lastModified: Date.now(),
            });

            const reductionPercentage = Math.round(
              ((originalSize - blob.size) / originalSize) * 100
            );

            resolve({
              file: compressedFile,
              originalSize,
              compressedSize: blob.size,
              reductionPercentage,
              previewUrl: URL.createObjectURL(blob),
            });
          },
          outputMime,
          quality
        );
      };

      img.onerror = () => {
        resolve({
          file,
          originalSize,
          compressedSize: originalSize,
          reductionPercentage: 0,
          previewUrl: URL.createObjectURL(file),
        });
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      resolve({
        file,
        originalSize,
        compressedSize: originalSize,
        reductionPercentage: 0,
        previewUrl: URL.createObjectURL(file),
      });
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes into human readable format (KB, MB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
