var express     = require('express');
//var fs          = require('fs');
//var http        = require('http');
var AWS         = require('aws-sdk');
//var Github = require('github-api');

var router = express.Router();

function findVersion (currentVersion, templateJSON ) {
    var objectVersion = "0.0.0";
    var objectResult = templateJSON[0].template;    // grab first (oldest) version in template
    console.log('   Check Version init: ' + objectVersion + ' for current version: ' + currentVersion);
    for (var ii in templateJSON) {
        var version = templateJSON[ii].version;
        console.log('  Located Version: ' + version );
        // get latest version that is less than or equal to current requested version\
        // NOTE: currently only handles single digit release numbers since doing alphanumeric comparison!
        if (version <= currentVersion && version > objectVersion) {
            console.log('  Found better Version: ' + version );
            objectVersion = version;
            objectResult = templateJSON[ii].template;
        }
    }
    return (objectResult);
};

/*
 *  GET data for a specified template/region/ID
 */
exports.fetch = function(req, res){
  console.log("Running fetch for specified template:");
  var resource = req.query.resource;
  var version = req.query.version;
  console.log(req.query);
  console.log("   requested resource: " + resource );

  res.setHeader("Access-Control-Allow-Origin", "*");

/*
 * This code reads template file from a github repository for a specific branch or tag
 *
//  var s3base = "http://s3.amazonaws.com/io.create/phillyvi-test-2/dqmatchsets/template/";
    var github = new Github({
      username: "YOU_USER",
      password: "YOUR_PASSWORD",
      auth: "basic"
    });
  var resourceFile = 'phillyvi-test-2/dqmatchsets/template/' + resource + '.json'
  var params = {Bucket: process.env.S3_BUCKET, Key: resourceFile };
  var s3file = s3.getObject(params, function(err, data) {
    if (err) {
        // report error since could not find resource file
        console.log('An error occurred while fetching DQ template resource ' + resource + ' with status: ' + err);
        res.status(404).send('Resource not found: ' + resourceFile);
    }
    else {
        // return json object that corresponds to best version available within resource file
        var jsonData = JSON.parse(data.Body);
        console.log(jsonData);
        var resultObject = findVersion(version, jsonData.versions);
    //    console.log(resultObject);
        res.send(resultObject);
    }

  });
*/


/*
 * This code reads template file from remote s3 repository
 */

//  var s3base = "http://s3.amazonaws.com/io.create/phillyvi-test-2/dqmatchsets/template/";
  var resourceFile = 'phillyvi-test-2/dqmatchsets/template/' + resource + '.json'
  var s3 = new AWS.S3();
  var params = {Bucket: process.env.S3_BUCKET, Key: resourceFile };
  var s3file = s3.getObject(params, function(err, data) {
    if (err) {
        // report error since could not find resource file
        console.log('An error occurred while fetching DQ template resource ' + resource + ' with status: ' + err);
        res.status(404).send('Resource not found: ' + resourceFile);
    }
    else {
        // return json object that corresponds to best version available within resource file
        var jsonData = JSON.parse(data.Body);
        console.log(jsonData);
        var resultObject = findVersion(version, jsonData.versions);
    //    console.log(resultObject);
        res.send(resultObject);
    }

  });

/*
 * This code reads template file from local storage
 *
  var resourceFile = '../DQMatchSets/template/' + resource + '.json';
  console.log("   file URL: " + resourceFile );
  fs.readFile(resourceFile, 'utf8', function(err,data) {
    if (err) {
        // report error since could not find resource file
        console.log('An error occurred while fetching DQ template resource ' + resource + ' with status: ' + err);
        res.status(404).send('Resource not found: ' + resourceFile);
    }
    else {
        // return json object that corresponds to best version available within resource file
        var jsonData = JSON.parse(data);
        console.log(jsonData);
        var resultObject = findVersion(version, jsonData.versions);
    //    console.log(resultObject);
        res.send(resultObject);
    }
  });
*/
};

