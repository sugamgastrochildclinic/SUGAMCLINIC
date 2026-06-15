import ImageKit from "imagekit";

const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || "";
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || "";
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || "";

let imagekitInstance: ImageKit | null = null;

export function getImageKitInstance() {
  if (imagekitInstance) return imagekitInstance;

  if (!publicKey || !privateKey || !urlEndpoint) {
    console.warn("ImageKit variables missing in .env.local. File uploads might fail or use mock storage.");
  }

  imagekitInstance = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });

  return imagekitInstance;
}

// Helper to check if credentials are valid
export function isImageKitConfigured() {
  return !!(publicKey && privateKey && urlEndpoint && publicKey !== "public_mock_key_value");
}
