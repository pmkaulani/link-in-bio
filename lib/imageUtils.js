/**
 * Client-side image compression and downscaling utility.
 * Resizes images to avatar dimensions (default 320x320) and compresses
 * to efficient WebP/JPEG, reducing 5MB+ mobile photos down to ~15-30KB.
 */
export async function compressAvatarImage(file, maxSize = 320, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Determine center square crop coordinates
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        const targetSize = Math.min(maxSize, minDim);
        canvas.width = targetSize;
        canvas.height = targetSize;

        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw cropped center square
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);

        // Export as WebP or JPEG fallback
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl || dataUrl.startsWith('data:image/png')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Also convert to a File/Blob for storage upload
        canvas.toBlob(
          (blob) => {
            const compressedFile = blob
              ? new File([blob], 'avatar.webp', { type: blob.type || 'image/webp' })
              : file;
            resolve({ dataUrl, file: compressedFile });
          },
          'image/webp',
          quality
        );
      } catch (err) {
        // Fallback to original reader result on error
        resolve({ dataUrl: img.src, file });
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image file.'));
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file.'));
    };

    reader.readAsDataURL(file);
  });
}
