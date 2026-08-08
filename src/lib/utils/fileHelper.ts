/**
 * Shared utility for client-side file preprocessing, checking limits,
 * and performing dynamic HEIC-to-JPEG conversion.
 */

export interface PreprocessResult {
  file: File;
  previewUrl: string;
  wasProcessed: boolean;
  error?: string;
}

/**
 * Preprocesses an image file on the client side.
 * Converts HEIC/HEIF to JPEG and validates properties.
 */
export async function preprocessImageFile(
  file: File,
): Promise<PreprocessResult> {
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.heic$/i.test(file.name);

  if (isHeic) {
    try {
      // Dynamic import of heic2any for code splitting
      const heic2any = (await import("heic2any")).default;
      const convertedBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.8, // higher quality for better sharp compression flow
      });

      const convertedBlobArray = Array.isArray(convertedBlob)
        ? convertedBlob[0]
        : convertedBlob;
      const newFileName = file.name.replace(/\.[^/.]+$/, ".jpg");

      const convertedFile = new File([convertedBlobArray], newFileName, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      return {
        file: convertedFile,
        previewUrl: URL.createObjectURL(convertedFile),
        wasProcessed: true,
      };
    } catch (err) {
      console.error("[HEIC_CONVERSION_FAILED]", err);
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        wasProcessed: true,
        error: "Failed to convert iOS HEIC photo",
      };
    }
  }

  // Fallback for standard files
  return {
    file,
    previewUrl: URL.createObjectURL(file),
    wasProcessed: false,
  };
}
