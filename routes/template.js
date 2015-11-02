var express     = require('express');
var fs          = require('fs');
//var http        = require('http');
//var AWS         = require('aws-sdk');
var Github = require('github-api');
var mkdirp = require('mkdirp');
var rmdir = require('rmdir');
var config = require('../config');

var router = express.Router();
var logger = config.logger;

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
    logger.info({msg: 'Check Versions init', objectVersion: objectVersion, currentVersion: currentVersion});
    for (var ii in templateJSON) {
        var version = templateJSON[ii].version;
        logger.info('  Located Version: ' + version );
        // get latest version that is less than or equal to current requested version\
        // NOTE: currently only handles single digit release numbers since doing alphanumeric comparison!
        if (version <= currentVersion && version > objectVersion) {
            logger.info('  Found better Version: ' + version );
            objectVersion = version;
            objectResult = templateJSON[ii].template;
        }
    }
    return (objectResult);
}

/*
 * This code writes a file to local FS
 */
function writeToCache( fs, fd, resourceFile, contents )
{
   logger.info('   writing file to local cache: ' + resourceFile );
   fs.write(fd, contents, 0, 'utf8', function(err, length, result) {
     if (err) {
         // report error since could not find resource file
         logger.info('An error occurred while writing file to local cache with status: ' + err);
     }
     else {
         // return json object that corresponds to best version available within resource file
         logger.info("Wrote " + length + ' bytes to local cache file ' + resourceFile);
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
        logger.info(moreFolders);
        for(var ii=0; ii<moreFolders.length-1; ii++) {
            // iterate through any additional folders that are passed in as part of the resource spec
            // Note: we iterate one less than split since we don't want actual file
            templateFolder = templateFolder + '/' + moreFolders[ii];
        }
        logger.info('   Unable to open file for writing; attepting to create template directory: ' + templateFolder);
        mkdirp(templateFolder, function (err) {
            if (err) {
                console.error('    Error creating folder for template: ' + err);
            }
            else {
              // now have the folder created, lets try opening the file again
              fd = fs.open(resourceFile, 'w', function( err, fd ) {
                if (err) {
                  logger.info('   Unable to open file for writing after attempt at creating folder, aborting attempt');
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

  logger.info('Reading file from github: ' + process.env.GITHUB_TEMPLATE_REPO + '/' + resourceFile + ' on branch: ' + branch);
  repo.read(branch, resourceFile, function(err, data) {
    if (err) {
        // report error since could not find resource file
        logger.info('An error occurred while fetching DQ template resource ' + resource + ' with status: ' + err);
        res.status(500).send('Resource not found: ' + resourceFile);
    }
    else {
        // return json object that corresponds to best version available within resource file
        try {
            var jsonData = JSON.parse(data);
            //logger.info(jsonData);
            var resultObject = findVersion(version, jsonData.versions);
            res.send(resultObject);

            // now that have data, cache it locally!
            writeToLocalCache( resource, branch, region_id, data );
        }
        catch(e) {
            logger.info(e);
            res.status(500).send('Error parsing JSON for resource: ' + resourceFile + " Error: " + e);
       }
    }

  });
}

/*
 *  GET data for a specified template/region/ID
 */
exports.fetch = function(req, res){
  var datetime = new Date();
  logger.info(datetime + ': Running fetch for specified template:');

  // first make sure have required values...
  if (typeof req.query.resource === 'undefined' || req.query.resource === null) {
    logger.info('  Input error: no template specified' );
    return res.status(500).send('Missing resource');
  }
  if (typeof req.query.resource === 'undefined' || req.query.resource === null) {
    logger.info('  Input error: no version specified' );
    return res.status(500).send('Missing version');
  }
  var resource = req.query.resource;
  var version = req.query.version;
  var region_id = req.query.region || 'US11001';                        // use DC if not specified in request
  var cacheFlag = req.query.cache || 'true';                            // use cache if not specified in request
  var branch = req.query.branch || process.env.GITHUB_TEMPLATE_BRANCH;  // use env. branch if not specified in request

  res.setHeader('Access-Control-Allow-Origin', '*');

//  logger.info(req.query);
  logger.info('   requested resource: ' + resource + ' on branch: ' + branch);
//  logger.info("   cache flag: " + cacheFlag);

/*
 * Read file from local cache if using cache
 */
  var resourceFile = '../' + process.env.LOCAL_CACHE + '/' + branch + '/' + region_id + '/template/' + resource + '.json';
  logger.info("   file URL: " + resourceFile );
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
//            logger.info(jsonData);
            var resultObject = findVersion(version, jsonData.versions);
        //    logger.info(resultObject);
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
        logger.info('An error occurred while fetching DQ template resource ' + resource + ' with status: ' + err);
        res.status(500).send('Resource not found: ' + resourceFile);
    }
    else {
        // return json object that corresponds to best version available within resource file
        var jsonData = JSON.parse(data.Body);
        logger.info(jsonData);
        var resultObject = findVersion(version, jsonData.versions);
    //    logger.info(resultObject);
        res.send(resultObject);
    }

  });

/*
 * This code reads template file from local storage
 *
  var resourceFile = '../DQMatchSets/template/' + resource + '.json';
  logger.info("   file URL: " + resourceFile );
  fs.readFile(resourceFile, 'utf8', function(err,data) {
    if (err) {
        // report error since could not find resource file
        logger.info('An error occurred while fetching DQ template resource ' + resource + ' with status: ' + err);
        res.status(500).send('Resource not found: ' + resourceFile);
    }
    else {
        // return json object that corresponds to best version available within resource file
        var jsonData = JSON.parse(data);
        logger.info(jsonData);
        var resultObject = findVersion(version, jsonData.versions);
    //    logger.info(resultObject);
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
  logger.info(datetime + ': Running clear for specified branch in local template cache:');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // first make sure have required values...
  if (typeof req.query.branch === "undefined" || req.query.branch === null) {
    logger.info('  Input error: no branch specified' );
    return res.status(500).send('Missing branch');
  }
  if (typeof req.query.passphrase === "undefined" || req.query.passphrase === null) {
    logger.info('  Input error: no passphrase specified' );
    return res.status(500).send('Missing authorization code');
  }
  var branch = req.query.branch;
  var passphrase = req.query.passphrase;
  if (passphrase != process.env.PASSPHRASE)
  {
    logger.info('  Input error: invalid passphrase.  Received: ' + passphrase );
    return res.status(500).send('Invalid authorization code');
  }

  var branchFolder = '../' + process.env.LOCAL_CACHE  + '/' + branch;
  rmdir( branchFolder, function ( err, dirs, files ){
    if (err) {
      logger.info( '   Error removing branch' + branchFolder + 'from local cache');
      logger.info(err);
      return res.status(500).send('Error removing branch: ' + err);
    }
    else {
      logger.info( '   Branch ' + branchFolder + ' removed from local cache' );
      return res.status(200).send('Branch ' + branchFolder + ' cleared');
    }
  });
};

