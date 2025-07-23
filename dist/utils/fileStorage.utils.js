"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromFileStorage = exports.uploadToFileStorage = void 0;
// Assert environment variables
const PINATA_AUTH_TOKEN = process.env.PINATA_AUTH_TOKEN;
const PINATA_URL = process.env.PINATA_URL;
/**
 * Uploads a file to Pinata (IPFS) and returns the resulting IPFS hash.
 * @param file - instance of File from formdata-node
 * @returns IPFS hash string
 */
const uploadToFileStorage = async (file) => {
    try {
        const formData = new FormData();
        // Cast File to Blob to satisfy FormData API
        formData.append('file', file, file.name);
        const response = await fetch(PINATA_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PINATA_AUTH_TOKEN}`,
            },
            body: formData,
        });
        const responseJson = await response.json();
        if (!response.ok) {
            throw new Error(responseJson?.error || 'Upload failed');
        }
        return responseJson.IpfsHash;
    }
    catch (error) {
        console.error('Error in uploadToFileStorage:', error);
        throw error;
    }
};
exports.uploadToFileStorage = uploadToFileStorage;
/**
 * Deletes a file from Pinata (IPFS) by its CID.
 * @param cid - content identifier (IPFS hash)
 */
const deleteFromFileStorage = async (cid) => {
    try {
        const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
            method: 'DELETE',
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${PINATA_AUTH_TOKEN}`,
            },
        });
        if (!response.ok) {
            const errorJson = await response.json();
            throw new Error(errorJson?.error || 'Delete failed');
        }
    }
    catch (error) {
        console.error('Error in deleteFromFileStorage:', error);
        throw error;
    }
};
exports.deleteFromFileStorage = deleteFromFileStorage;
