const path = require("path");
const serveStatic = require("serve-static");

const assetsPath = path.join(__dirname, "assets");
// Beware the leading `/` before the path!
const pathToServe = "/assets";

module.exports = function (app) {
  app.use(pathToServe, serveStatic(assetsPath));
};
