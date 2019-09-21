const http = require("http");
const micro = require("micro");
const { router, get, post } = require("microrouter");
const handler = require("serve-handler");
const skus = require("./api/skus.js");
const enquiry = require("./api/enquiry.js");
//const charge = require("./index.js");
//const authql = require("./authql/index.js");

const app = router(
  get("/api/hello*", () => "Hello world!"),
  get("/api/json*", req => ({ a: 1 })),
  //get("/api/skus*", skus),
  post("/api/enquiry*", enquiry),
  get("/*", async (req, res) => await handler(req, res, { public: "public" }))

  //get("/(authql)", authql),
  //post("/(authql)", authql)
);

const server = new http.Server(micro(app)).listen(8080);
/*
//create a server object:
http
  .createServer((req, res) => {
    res.write("Hello World!"); //write a response to the client
    res.end(); //end the response
  })
  .listen(8080); //the server object listens on port 8080
*/
