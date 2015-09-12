var express     = require('express');
var fs          = require('fs');
//var http        = require('http');
//var AWS         = require('aws-sdk');
var Github = require('github-api');
var mkdirp = require('mkdirp');
var rmdir = require('rmdir');

var router = express.Router();

/*
    Sample CURL to get to git using API:
    curl -i -uBreighton:password "https://api.github.com/repos/CreateIO/DQMatchSets/contents/US11001/template/tabsNEW-.json?ref=test-regions"
*/

/*
 *  This function finds the version in the template that is less than or equal to the requested version
*/
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
 * This code writes a file to local FS
 */
function writeToCache( fs, fd, resourceFile, contents )
{
   console.log('   writing file to local cache: ' + resourceFile );
   fs.write(fd, contents, 0, 'utf8', function(err, length, result) {
     if (err) {
         // report error since could not find resource file
         console.log('An error occurred while writing file to local cache with status: ' + err);
     }
     else {
         // return json object that corresponds to best version available within resource file
         console.log("Wrote " + length + ' bytes to local cache file ' + resourceFile);
     }
     fs.closeSync(fd);
   });
}

function writeToLocalCache( resource, branch, region_id, contents )
{
  var resourceFile = '../' + process.env.LOCAL_CACHE + '/' + branch + '/' + region_id + '/template/' + resource + '.json';
  var fd = fs.open(resourceFile, 'w', function( err, fd ) {
      if (err){
        var regionFolder = '../' + process.env.LOCAL_CACHE  + '/' + branch + '/' + region_id;
        var moreFolders = resource.split("/");  // any more folders?
        var templateFolder = regionFolder + '/template';
        console.log(moreFolders);
        for(var ii=0; ii<moreFolders.length-1; ii++) {
            // iterate through any additional folders that are passed in as part of the resource spec
            // Note: we iterate one less than split since we don't want actual file
            templateFolder = templateFolder + '/' + moreFolders[ii];
        }
        console.log('   Unable to open file for writing; attepting to create template directory: ' + templateFolder);
        mkdirp(templateFolder, function (err) {
            if (err) {
                console.error('    Error creating folder for template: ' + err);
            }
            else {
              // now have the folder created, lets try opening the file again
              fd = fs.open(resourceFile, 'w', function( err, fd ) {
                if (err) {
                  console.log('   Unable to open file for writing after attempt at creating folder, aborting attempt');
                }
                else {
                  writeToCache( fs, fd, resourceFile, contents );
                }
              });
            }
        });
      }
      else {
         writeToCache( fs, fd, resourceFile, contents );
      }
  });
}

/*
 * This code reads template file from a github repository for a specific branch or tag
 */
function readFromGitHub( res, resource, branch, region_id, version )
{
  // Note: we get github values (user, token, repo, branch) from global environment specified in dq_env.sh
  var github = new Github({
    token: process.env.GITHUB_TOKEN,
    auth: "oauth"
  });
  var repo = github.getRepo(process.env.GITHUB_OWNER, process.env.GITHUB_TEMPLATE_REPO);
  var resourceFile = process.env.GITHUB_FOLDER + region_id + '/template/' + resource + '.json';

  console.log('Reading file from github: ' + process.env.GITHUB_TEMPLATE_REPO + '/' + resourceFile + ' on branch: ' + branch);
  repo.read(branch, resourceFile, function(err, data) {
    if (err) {
        // report error since could not find resource file
        console.log('An error occurred while fetching DQ template resource ' + resource + ' with status: ' + err);
        res.status(404).send('Resource not found: ' + resourceFile);
    }
    else {
        // return json object that corresponds to best version available within resource file
        try {
            var jsonData = JSON.parse(data);
            //console.log(jsonData);
            var resultObject = findVersion(version, jsonData.versions);
            res.send(resultObject);

            // now that have data, cache it locally!
            writeToLocalCache( resource, branch, region_id, data );
        }
        catch(e) {
            console.log(e);
            res.status(404).send('Error parsing JSON for resource: ' + resourceFile + " Error: " + e);
       }
    }

  });
}

/*
 *  GET data for a specified template/region/ID
 */
exports.fetch = function(req, res){
  var datetime = new Date();
  console.log(datetime + ': Running fetch for specified template:');

  // first make sure have required values...
  if (typeof req.query.resource === 'undefined' || req.query.resource === null) {
    console.log('  Input error: no template specified' );
    return res.status(404).send('Missing resource');
  }
  if (typeof req.query.resource === 'undefined' || req.query.resource === null) {
    console.log('  Input error: no version specified' );
    return res.status(404).send('Missing version');
  }
  var resource = req.query.resource;
  var version = req.query.version;
  var region_id = req.query.region || 'US11001';                        // use DC if not specified in request
  var cacheFlag = req.query.cache || 'true';                            // use cache if not specified in request
  var branch = req.query.branch || process.env.GITHUB_TEMPLATE_BRANCH;  // use env. branch if not specified in request

  res.setHeader('Access-Control-Allow-Origin', '*');

//  console.log(req.query);
  console.log('   requested resource: ' + resource + ' on branch: ' + branch);
//  console.log("   cache flag: " + cacheFlag);

/*
 * Read file from local cache if using cache
 */
  var resourceFile = '../' + process.env.LOCAL_CACHE + '/' + branch + '/' + region_id + '/template/' + resource + '.json';
  console.log("   file URL: " + resourceFile );
  if (cacheFlag == 'true') {
      fs.readFile(resourceFile, 'utf8', function(err,data) {
        if (err || data.length < 1) {
            // try github since file not available in local cache
            readFromGitHub( res, resource, branch, region_id, version );
        }
        else {
            // return json object that corresponds to best version available within resource file
            // NOTE: since this is cached, we know that the JSON.parse will never throw an error here
            var jsonData = JSON.parse(data);
//            console.log(jsonData);
            var resultObject = findVersion(version, jsonData.versions);
        //    console.log(resultObject);
            res.send(resultObject);
        }
      });
  }
  else {
    // if here, don't want cached result (for dev and testing purposes)
    // go grab github file directly
    readFromGitHub( res, resource, branch, region_id, version );
  }

/*
 * This code reads template file from remote s3 repository
 *

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

/*
 *  Clear local cache for the specified branch data.  This will force a clean fetch from github for all template resources
 */
exports.clear = function(req, res){
  var datetime = new Date();
  console.log(datetime + ': Running clear for specified branch in local template cache:');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // first make sure have required values...
  if (typeof req.query.branch === "undefined" || req.query.branch === null) {
    console.log('  Input error: no branch specified' );
    return res.status(404).send('Missing branch');
  }
  if (typeof req.query.passphrase === "undefined" || req.query.passphrase === null) {
    console.log('  Input error: no passphrase specified' );
    return res.status(404).send('Missing authorization code');
  }
  var branch = req.query.branch;
  var passphrase = req.query.passphrase
  if (passphrase != process.env.PASSPHRASE)
  {
    console.log('  Input error: invalid passphrase.  Received: ' + passphrase );
    return res.status(404).send('Invalid authorization code');
  }

  var branchFolder = '../' + process.env.LOCAL_CACHE  + '/' + branch;
  rmdir( branchFolder, function ( err, dirs, files ){
    if (err) {
      console.log( '   Error removing branch' + branchFolder + 'from local cache');
      console.log(err);
      return res.status(404).send('Error removing branch: ' + err);
    }
    else {
      console.log( '   Branch ' + branchFolder + ' removed from local cache' );
      return res.status(200).send('Branch ' + branchFolder + ' cleared');
    }
  });
};

