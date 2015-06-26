var express     = require('express');
var fs          = require('fs');
//var http        = require('http');
//var AWS         = require('aws-sdk');
var Github = require('github-api');

var router = express.Router();

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

function writeToLocalCache( resource, fips_code, contents )
{
  var resourceFile = '../' + process.env.LOCAL_CACHE + '/' + fips_code + '/template/' + resource + '.json';
  var fd = fs.open(resourceFile, 'w', function( err, fd ) {
      if (err){
        console.log('   Unable to open file for writing; attepting to create template directory...');
        var regionFolder = '../' + process.env.LOCAL_CACHE  + '/' + fips_code;
        var templateFolder = regionFolder + '/template';
        fs.exists( regionFolder, function(exists) {
            if (!exists) {
                // if here, must create new region folder before create template folder!
                fs.mkdir(regionFolder, function(err) {
                    if (err) {
                        console.log('   Unable to create region directory: ' + regionFolder)
                        return;
                    }
                });
            }
        });
        fs.mkdir(templateFolder, function(err) {
            if (err) {
                console.log('   Unable to create template directory: ' + templateFolder)
                return;
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
function readFromGitHub( res, resource, fips_code, version )
{
  // Note: we get github values (user, token, repo, branch) from global environment specified in dq_env.sh
  var github = new Github({
    token: process.env.GITHUB_TOKEN,
    auth: "oauth"
  });
  var repo = github.getRepo(process.env.GITHUB_OWNER, process.env.GITHUB_TEMPLATE_REPO);
  var resourceFile = fips_code + '/template/' + resource + '.json';

  console.log('Reading file from github: ' + process.env.GITHUB_TEMPLATE_REPO + '/' + resourceFile + ' on branch: ' + process.env.GITHUB_TEMPLATE_BRANCH);
  repo.read(process.env.GITHUB_TEMPLATE_BRANCH, resourceFile, function(err, data) {
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
            writeToLocalCache( resource, fips_code, data );
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
  console.log("Running fetch for specified template:");
  var resource = req.query.resource;
  var version = req.query.version;
  var fips_code = req.query.region || 'US11001';
  var cacheFlag = req.query.cache || 'true';
  console.log(req.query);
  console.log("   requested resource: " + resource );
//  console.log("   cache flag: " + cacheFlag);

  res.setHeader("Access-Control-Allow-Origin", "*");

/*
 * Read file from local cache if using cache
 */
  var resourceFile = '../' + process.env.LOCAL_CACHE + '/' + fips_code + '/template/' + resource + '.json';
  console.log("   file URL: " + resourceFile );
  if (cacheFlag == 'true') {
      fs.readFile(resourceFile, 'utf8', function(err,data) {
        if (err || data.length < 1) {
            // try github since file not available in local cache
            readFromGitHub( res, resource, fips_code, version );
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
    readFromGitHub( res, resource, fips_code, version );
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

