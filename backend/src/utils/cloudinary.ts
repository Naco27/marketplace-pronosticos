import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Verificar si las credenciales están configuradas y no son los marcadores de posición predeterminados
const isCloudinaryConfigured = !!(
  cloudName &&
  apiKey &&
  apiSecret &&
  cloudName !== 'cloudinary_cloud_placeholder' &&
  apiKey !== 'cloudinary_api_key_placeholder' &&
  apiSecret !== 'cloudinary_api_secret_placeholder'
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  console.log('Cloudinary service initialized successfully.');
} else {
  console.log('Cloudinary not configured. Defaulting to local disk storage fallback.');
}

/**
 * Sube un archivo local a Cloudinary.
 * @param filePath Ruta absoluta del archivo local.
 * @param folder Nombre de la carpeta en Cloudinary.
 * @returns URL segura de Cloudinary o null si Cloudinary no está configurado.
 */
export const uploadToCloudinary = async (filePath: string, folder: string = 'betmarket'): Promise<string | null> => {
  if (!isCloudinaryConfigured) {
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    throw error;
  }
};

export { isCloudinaryConfigured };
