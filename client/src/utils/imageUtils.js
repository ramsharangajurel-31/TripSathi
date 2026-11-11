// Reads an image file in the browser and shrinks it, so uploads stay small
// enough to keep in localStorage (about 5 MB for the whole app).

export const MAX_IMAGE_FILE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Resolves with a JPEG data URL no wider than `maxWidth`.
 * Rejects with a message that can be shown to the user.
 */
export function fileToResizedDataUrl(file, maxWidth = 900, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      reject(new Error("Choose a JPG, PNG or WebP image."));
      return;
    }
    if (file.size > MAX_IMAGE_FILE_MB * 1024 * 1024) {
      reject(new Error(`The image must be smaller than ${MAX_IMAGE_FILE_MB} MB.`));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const scale = Math.min(1, maxWidth / image.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext("2d");
      // Transparent PNGs would turn black as JPEG, so paint white first.
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("This image could not be read. Try a different file."));
    };

    image.src = objectUrl;
  });
}