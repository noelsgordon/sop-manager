import imageCompression from 'browser-image-compression';

export async function compressImage(file) {
  const options = {
    maxSizeMB: 0.4,              // Target ~400KB
    maxWidthOrHeight: 1280,     // Ideal for SOP clarity + device zoom
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Image compression failed:", error);
    return file; // fallback to original if compression fails
  }
}
