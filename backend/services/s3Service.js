const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { s3Bucket, s3Region, s3AccessKeyId, s3SecretAccessKey } = require('../config/keys');

const readFile = promisify(fs.readFile);

const s3 = new S3Client({
  region: s3Region,
  credentials: {
    accessKeyId: s3AccessKeyId,
    secretAccessKey: s3SecretAccessKey,
  },
});

async function uploadFileToS3(localFilePath, s3Key, mimetype) {
  const fileContent = await readFile(localFilePath);
  const command = new PutObjectCommand({
    Bucket: s3Bucket,
    Key: s3Key,
    Body: fileContent,
    ContentType: mimetype,
  });
  await s3.send(command);
  return `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${s3Key}`;
}

module.exports = { uploadFileToS3 }; 