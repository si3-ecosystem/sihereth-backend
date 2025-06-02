const { PINATA_URL } = require("../consts");

const PINATA_AUTH_TOKEN = process.env.PINATA_AUTH_TOKEN;

const uploadToFileStorage = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(PINATA_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_AUTH_TOKEN}`,
      },
      body: formData,
    });
    const responseJson = await response.json();
    if (!response.ok) {
      throw new Error(responseJson?.error || "Upload failed");
    }
    return responseJson.IpfsHash;
  } catch (error) {
    console.error("Error in uploadToFileStorage:", error);
    throw error;
  }
};

const deleteFromFileStorage = async (cid) => {
  try {
    const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
      method: "DELETE",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${PINATA_AUTH_TOKEN}`,
      },
    });
    if (!response.ok) {
      const errorJson = await response.json();
      throw new Error(errorJson?.error || "Delete failed");
    }
  } catch (error) {
    console.error("Error in deleteFromFileStorage:", error);
    throw error;
  }
};

module.exports = {
  uploadToFileStorage,
  deleteFromFileStorage,
};
