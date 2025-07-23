// src/utils/fileStorage.utils.ts
import { File } from 'formdata-node';

// Assert environment variables
const PINATA_AUTH_TOKEN: string = process.env.PINATA_AUTH_TOKEN!;
const PINATA_URL: string = process.env.PINATA_URL!;

/**
 * Uploads a file to Pinata (IPFS) and returns the resulting IPFS hash.
 * @param file - instance of File from formdata-node
 * @returns IPFS hash string
 */
export const uploadToFileStorage = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    // Cast File to Blob to satisfy FormData API
    formData.append('file', file as unknown as Blob, file.name);

    const response = await fetch(PINATA_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_AUTH_TOKEN}`,
      },
      body: formData as unknown as BodyInit,
    });

    const responseJson = await response.json();
    if (!response.ok) {
      throw new Error(responseJson?.error || 'Upload failed');
    }

    return responseJson.IpfsHash as string;
  } catch (error: unknown) {
    console.error('Error in uploadToFileStorage:', error);
    throw error;
  }
};

/**
 * Deletes a file from Pinata (IPFS) by its CID.
 * @param cid - content identifier (IPFS hash)
 */
export const deleteFromFileStorage = async (cid: string): Promise<void> => {
  try {
    const response = await fetch(
      `https://api.pinata.cloud/pinning/unpin/${cid}`,
      {
        method: 'DELETE',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${PINATA_AUTH_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      const errorJson = await response.json();
      throw new Error(errorJson?.error || 'Delete failed');
    }
  } catch (error: unknown) {
    console.error('Error in deleteFromFileStorage:', error);
    throw error;
  }
};
