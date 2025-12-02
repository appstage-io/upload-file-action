const core = require("@actions/core");
const axios = require("axios");
const https = require('https');
const fs = require('fs/promises');
const crypto = require('crypto');
const path = require('path');

const token = core.getInput('token');
const filename = core.getInput('filename');
const host = core.getInput('host') || 'https://www.appstage.io';

const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

async function calculateChecksum(filepath) {
  const fileBuffer = await fs.readFile(filepath);
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);
  return hashSum.digest('base64');
}

async function requestDirectUpload(filename, fileSize, checksum) {
  const { data } = await instance.post(
    `${host}/api/direct_uploads`,
    {
      blob: {
        filename: path.basename(filename),
        byte_size: fileSize,
        checksum: checksum,
        content_type: 'application/octet-stream'
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  );
  return data;
}

async function uploadToCDN(filepath, directUploadData) {
  const fileBuffer = await fs.readFile(filepath);
  const uploadUrl = directUploadData.direct_upload.url;
  const uploadHeaders = directUploadData.direct_upload.headers;

  await axios.put(uploadUrl, fileBuffer, {
    headers: uploadHeaders,
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  });
}

async function createReleaseFile(signedBlobId) {
  const { data } = await instance.post(
    `${host}/api/live_builds`,
    {
      signed_blob_id: signedBlobId
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  );
  return data;
}

(async () => {
  try {
    console.log(`Uploading ${filename}...`)

    const stats = await fs.stat(filename);
    const fileSize = stats.size;

    const checksum = await calculateChecksum(filename);
    const directUploadData = await requestDirectUpload(filename, fileSize, checksum);

    await uploadToCDN(filename, directUploadData);

    const releaseFile = await createReleaseFile(directUploadData.signed_id);

    console.log(`File ${releaseFile.display_name} uploaded`)
    core.setOutput("file", releaseFile);
  } catch (error) {
    console.log(`File upload failed - ${error.message}`)
    core.setFailed(`File upload failed - ${error.message}`);
  }
})();
  