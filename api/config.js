const awsAccessKeyId = process.env.AWSID || process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWSKEY || process.env.AWS_SECRET_ACCESS_KEY;
const stripeSKTest = process.env.STRIPE_SK_TLA_TEST;
const stripeSKLive = process.env.STRIPE_SK_TLA_LIVE;

module.exports = {
  "productionHost": "buy.telanova.com",
  "s3AccessKeyId": awsAccessKeyId,
  "s3SecretAccessKey": awsSecretAccessKey,
  "s3Region": "eu-west-2",
  "s3BucketName": "storedb.telanova.com",
  "sesAccessKeyId": awsAccessKeyId,
  "sesSecretAccessKey": awsSecretAccessKey,
  "sesRegion": "eu-west-1",
  "sesSender": "warwick.grigg@telanova.com",
  "sesTo": ["warwick.grigg@telanova.com"],
  "sesToTest": ["warwick.grigg+test@telanova.com"],
  "recaptchaSecretKey": process.env.RECAPTCHA_SECRET_KEY,
  "stripeSKTest": stripeSKTest,
  "stripeSKLive": stripeSKLive,
};

/*
aws.config.update({
  'accessKeyId': config.access_key,
  'secretAccessKey': config.secret_key,
  'region': config.region,
  'bucketname': config.bucket_name
})
*/
