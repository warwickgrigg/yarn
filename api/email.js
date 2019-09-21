var AWS = require("aws-sdk");
const config = require("./config.js");

var ses = new AWS.SES({ 
  apiVersion: "2010-12-01", 
  region: config.sesRegion,  
  accessKeyId: config.sesAccessKeyId,
  secretAccessKey: config.sesSecretAccessKey
});

const email = ({
  to = [],
  cc = [],
  from,
  replyTo = [],
  htmlBody,
  textBody,
  subject
}) => {
  const Body = {
    ...(textBody ? { Text: { Charset: "UTF-8", Data: textBody } } : {}),
    ...(htmlBody ? { Html: { Charset: "UTF-8", Data: htmlBody } } : {})
  };
  const params = {
    Destination: { CcAddresses: cc, ToAddresses: to },
    Message: { Body, Subject: { Charset: "UTF-8", Data: subject } },
    Source: from,
    ReplyToAddresses: replyTo
  };
  return ses.sendEmail(params).promise();
};

module.exports = email;
