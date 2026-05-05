import { toast } from "react-hot-toast";

export interface MediaOptions {
  video?: boolean;
  audio?: boolean;
}

let cachedStream: MediaStream | null = null;

/**
 * Requests access to camera and microphone.
 * Reuses existing stream if already acquired.
 */
export async function getLocalMedia(options: MediaOptions = { video: true, audio: true }): Promise<MediaStream> {
  if (cachedStream) {
    return cachedStream;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(options);
    cachedStream = stream;
    return stream;
  } catch (err: unknown) {
    console.error("Failed to get local media:", err);

    // Show a toast message for the user
    if (err instanceof Error) {
      console.error("Failed to get local media:", err);

      if (err.name === "NotAllowedError") {
        toast.error("Camera/microphone access denied.");
      } else if (err.name === "NotFoundError") {
        toast.error("No camera or microphone found.");
      } else if (err.name === "NotReadableError") {
        toast.error("Device in use. Close other apps using camera/microphone.");
      } else {
        toast.error("Cannot access camera/microphone.");
      }
    } else {
      toast.error("Unknown error accessing media.");
    }

    throw err;
  }
}

/**
 * Stops cached media stream and clears cache.
 */
export function stopLocalMedia() {
  if (!cachedStream) return;
  cachedStream.getTracks().forEach(track => track.stop());
  cachedStream = null;
}