const { PINATA_URL } = require("../consts");

const PINATA_AUTH_TOKEN = process.env.PINATA_AUTH_TOKEN;

const uploadToFileStorage = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    console.log("📤 Uploading file to Pinata...");

    const response = await fetch(PINATA_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_AUTH_TOKEN}`,
      },
      body: formData,
    });

    const responseJson = await response.json();

    if (!response.ok) {
      console.error("❌ Failed to upload to Pinata:", responseJson);
      throw new Error(responseJson?.error || "Upload failed");
    }

    console.log("✅ File uploaded to Pinata:", responseJson.IpfsHash);
    return responseJson.IpfsHash;
  } catch (error) {
    console.error("💥 Error in uploadToFileStorage:", error);
    throw error;
  }
};

const deleteFromFileStorage = async (cid) => {
  try {
    console.log(`🗑️ Deleting file from Pinata: ${cid}`);

    const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
      method: "DELETE",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${PINATA_AUTH_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorJson = await response.json();
      console.error("❌ Failed to delete from Pinata:", errorJson);
      throw new Error(errorJson?.error || "Delete failed");
    }

    console.log("✅ Successfully deleted from Pinata:", cid);
  } catch (error) {
    console.error("💥 Error in deleteFromFileStorage:", error);
    throw error;
  }
};

module.exports = {
  uploadToFileStorage,
  deleteFromFileStorage,
};
