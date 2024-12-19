require('dotenv').config();
const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");

// Enter your storage account name and shared key
const account = process.env.AZURE_STORAGEACCOUNT;
const accountKey = process.env.AZURE_ACCESSKEY;


// Use StorageSharedKeyCredential with storage account and account key
// StorageSharedKeyCredential is only avaiable in Node.js runtime, not in browsers
const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
const blobServiceClient = new BlobServiceClient(
  `https://${account}.blob.core.windows.net`,
  sharedKeyCredential
);

async function blobExists(containerName, blobName) {
    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        if (!(await containerClient.exists())) {
            return Promise.reject(false)
        }
        const blobClient = containerClient.getBlobClient(blobName);
        if (!(await blobClient.exists())) {
            return Promise.reject(false)
        }
        return Promise.resolve(true)
    } catch(e) {
        return Promise.reject(e)
    }
}

async function downloadBlob(containerName, blobName, res) {
    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        
        if (!(await containerClient.exists())) {
            throw new Error(`Error: No container exists with this name: ${containerName}`);
        }

        const blobClient = containerClient.getBlobClient(blobName);
        if (!(await blobClient.exists())) {
            throw new Error(`Error: No blob exists with this name: ${blobName}`);
        }

        const downloadResponse = await blobClient.download();

        res.setHeader('Content-Disposition', `attachment; filename="${blobName}"`);
        res.setHeader('Content-Type', downloadResponse.contentType || 'application/octet-stream');

        downloadResponse.readableStreamBody.pipe(res);
    } catch (e) {
        console.error(`Error downloading blob: ${e.message}`);
        res.status(500).send(`Error downloading blob: ${e.message}`);
    }
}
module.exports = {
    blobExists,
    downloadBlob
}
