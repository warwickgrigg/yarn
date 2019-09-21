const { buffer, text, json } = require("micro");
const fetch = require("node-fetch");
const email = require("./email.js");
const kvs3 = require("./kvs3.js");
const config = require("./config.js");

const kvdb = kvs3(config.s3BucketName);

const handler = async (req, res) => {
  const j = await json(req);
  const { recaptchaToken: token, ...submitted } = j;
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",").pop() ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress;
  fetch(
    "https://www.google.com/recaptcha/api/siteverify?" +
      `secret=${config.recaptchaSecretKey}` +
      `&response=${token}` +
      `&remoteip=${ip}`,
    { method: "POST" }
  )
    .then(r => r.json())
    .then(r => {
      const random = ("0000" + Math.floor(Math.random() * 10000)).slice(4);
      const key = new Date().toJSON().replace(/[^0-9.]/g, "") + random;
      const host = req.headers.host;
      const isProduction = host === config.productionHost;
      const data = { submitted, ip, host, recaptcha: r };
      const json = JSON.stringify({ ...data, key }, null, 2);
      if (r.success && r.score >= 0.5 && r.action === j.action) {
        //console.log({key,data});
        Promise.all([
          kvdb.put(key, data),
          email({
            to: config[isProduction ? "sesTo" : "sesToTest"],
            from: "warwick.grigg@telanova.com",
            textBody: json,
            subject: "sales enquiry - telanova store"
          })
        ])
          .catch(e => console.log("AWS S3 or SES error", e))
          .finally(f => res.end("OK"));
      }
    });
};

module.exports = handler;
