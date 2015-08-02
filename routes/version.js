var express     = require('express');
var pg          = require('pg');

var router = express.Router();

/*
 *  Fetch current DQ version and selected env. vars
 */
exports.fetch = function(req, res){
  var datetime = new Date();
  console.log(datetime + ': Returning DQ version: ' + process.env.VERSION);
  res.setHeader('Access-Control-Allow-Origin', ''*'');

  var result = '{"version":"' + process.env.VERSION + '",' +
                '"DB_HOST":"' + process.env.DB_HOST + '",' +
                '"S3_ASSET_BUCKET":"' + process.env.S3_ASSET_BUCKET + '",' +
                '"S3_ASSET_FOLDER":"' + process.env.S3_ASSET_FOLDER + '",' +
                '"GITHUB_TEMPLATE_REPO":"' + process.env.GITHUB_TEMPLATE_REPO + '",' +
                '"GITHUB_TEMPLATE_BRANCH":"' + process.env.GITHUB_TEMPLATE_BRANCH + '"}';

  return result;
};

