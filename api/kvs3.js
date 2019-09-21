var AWS = require("aws-sdk");
const config = require("./config.js");

const s3 = new AWS.S3({ 
  apiVersion: "2006-03-01", 
  region: config.s3Region,  
  accessKeyId: config.s3AccessKeyId,
  secretAccessKey: config.s3SecretAccessKey
});

const kv = bucket => {
  const key2s3 = key => ({ Bucket: bucket, Key: key });
  const body = obj => ({ Body: JSON.stringify(obj, null, 2) });

  const deleteObject = key => s3.deleteObject(key2s3(key)).promise();

  const info = key =>
    s3
      .headObject(key2s3(key))
      .promise()
      .catch(e => false);

  const exists = key => info(key).then(info => !!info);

  const get = key =>
    s3
      .getObject(key2s3(key))
      .promise()
      .then(d => JSON.parse(d.Body.toString()))
      .catch(e => null);

  const put = (key, value) =>
    s3
      .putObject({
        ...key2s3(key),
        ...body(value)
      })
      .promise();

  return { put, get, delete: deleteObject, info, exists };
};

module.exports = kv;
