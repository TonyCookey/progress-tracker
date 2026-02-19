import imageCompression from "browser-image-compression";

export async function compressImage(file: File): Promise<File> {
  //Compress the image to a max of 800KB and max dimensions of 800px, while maintaining quality of 80%
  const options = {
    maxSizeMB: 0.7,
    maxWidthOrHeight: 800,
    initialQuality: 0.8,
    useWebWorker: true,
  };

  const compressedFile = await imageCompression(file, options);
  return compressedFile;
}
