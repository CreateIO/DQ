var express     = require('express');
var fs          = require('fs');
//var http        = require('http');
//var AWS         = require('aws-sdk');
var Github = require('github-api');
var mkdirp = require('mkdirp');
var rmdir = require('rmdir');
var config = require('../config');
var deepExtend = require('deep-extend');

var router = express.Router();
var logger = config.logger;

/*
    Sample CURL to get to git using API:
    curl -i -uBreighton:password "https://api.github.com/repos/CreateIO/DQMatchSets/contents/US11001/template/tabsNEW-.json?ref=test-regions"
*/

/*
 *  This function finds the version in the template that is less than or equal to the requested version
 *  NOTE: this is only here for backward compatibility and should go away once we no longer are using the old format...
*/
function findVersion (currentVersion, inputJSON ) {
    if (!inputJSON.versions  )
    {
        // new format, no version metadata required...
        //logger.info('New refactored template format');
        return inputJSON;
    }
    // if here, we must extranct version data...
    //logger.info('Old template format');
    var templateJSON = inputJSON.versions;
    var objectVersion = "0.0.0";
    var objectResult = templateJSON[0].template;    // grab first (oldest) version in template
//    logger.info({message: 'Check Versions init', objectVersion: objectVersion, currentVersion: currentVersion});
    for (var ii in templateJSON) {
        var version = templateJSON[ii].version;
//        logger.info('  Located Version: ' + version );
        // get latest version that is less than or equal to current requested version\
        // NOTE: currently only handles single digit release numbers since doing alphanumeric comparison!
        if (version <= currentVersion && version > objectVersion) {
//            logger.info('  Found better Version: ' + version );
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
//   logger.info('   writing file to local cache: ' + resourceFile );
   fs.write(fd, contents, 0, 'utf8', function(err, length, result) {
     if (err) {
         // report error since could not write resource file
         logger.error({message: 'An error occurred while writing file to local cache with status: ', error: err,
            file: resourceFile, "content": contents});
     }
     else {
//         logger.info("Wrote " + length + ' bytes to local cache file ' + resourceFile);
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
        //logger.info(moreFolders);
        for(var ii=0; ii<moreFolders.length-1; ii++) {
            // iterate through any additional folders that are passed in as part of the resource spec
            // Note: we iterate one less than split since we don't want actual file
            templateFolder = templateFolder + '/' + moreFolders[ii];
        }
        logger.info('   Unable to open file for writing; attepting to create template directory: ' + templateFolder);
        mkdirp(templateFolder, function (err) {
            if (err) {
                logger.error({message: '    Error creating folder for template: ', error: err});
            }
            else {
              // now have the folder created, lets try opening the file again
              fd = fs.open(resourceFile, 'w', function( err, fd ) {
                if (err) {
                  logger.error({message: '   Unable to open file for writing after attempt at creating folder, aborting attempt', error: err});
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
function readFromGitHub( res, version, resource, branch, regionCountry, regionTag, callback )
{
  // Note: we get github values (user, token, repo, branch) from global environment specified in dq_env.sh
  var github = new Github({
    token: process.env.GITHUB_TOKEN,
    auth: "oauth"
  });
  var repo = github.getRepo(process.env.GITHUB_OWNER, process.env.GITHUB_TEMPLATE_REPO);

  // we read first from national/global resource...
  var resourceFile = process.env.GITHUB_FOLDER + regionCountry + '/template/' + resource + '.json';
  var resultObject = {};    // assume did not find file in github

  logger.info('Reading file from github: ' + process.env.GITHUB_TEMPLATE_REPO + '/' + resourceFile + ' on branch: ' + branch);
  repo.read(branch, resourceFile, function(err, data) {
    if (err) {
        // file does not exist on github -- write empty JSON object to local cache for next call to this resource
        //logger.error({message: "Unable to read national file from github", error: err})
        writeToLocalCache( resource, branch, regionCountry, '{}' );
    }
    else {
        try {
            var JSONdata =  JSON.parse(data);
            resultObject = findVersion(version, JSONdata);

            // now that have data, cache it locally!
            writeToLocalCache( resource, branch, regionCountry, data );
        }
        catch(e) {
            logger.info({message: 'Error parsing JSON for resource', error: e});
            writeToLocalCache( resource, branch, regionCountry, '{}' ); // write empty object to local cache until user pushes branch again
       }
    }

    // now read again from local region
    resourceFile = process.env.GITHUB_FOLDER + regionTag + '/template/' + resource + '.json';
    var regionalResultObject = {};    // assume did not find file in github

    logger.info('Reading file from github: ' + process.env.GITHUB_TEMPLATE_REPO + '/' + resourceFile + ' on branch: ' + branch);
    repo.read(branch, resourceFile, function(err, data) {
        if (err) {
            // file does not exist on github -- write empty JSON object to local cache for next call to this resource
            //logger.error({message: "Unable to read regional file from github", error: err})
            writeToLocalCache( resource, branch, regionTag, '{}' );
        }
        else {
            try {
                var JSONdata =  JSON.parse(data);
                regionalResultObject = findVersion(version, JSONdata);
                 // now that have data, cache it locally!
                writeToLocalCache( resource, branch, regionTag, data );
            }
            catch(e) {
                logger.info({message: 'Error parsing JSON for resource', error: e});
                writeToLocalCache( resource, branch, regionTag, '{}' ); // write empty object to local cache until user pushes branch again
           }
        }
        // now "absorb" regional into national...
        //logger.info(resultObject);
        //logger.info(regionalResultObject);
        deepExtend(resultObject, regionalResultObject);
        //logger.info(resultObject);
        // return the JSON result (or null object if not present in github)
        res.send(resultObject);
    });
  });
};

/*
 *  GET data for a specified template/region/ID
 */
exports.fetch = function(req, res){
  var datetime = new Date();
  res.setHeader('Access-Control-Allow-Origin', '*');

  logger.info({message: 'Running fetch for specified template'});

  // first make sure have required values...
  if (typeof req.query.resource === 'undefined' || req.query.resource === null) {
    logger.error('  Input error: no template specified' );
    return res.status(500).send('Missing resource');
  }
  var resource = req.query.resource;
  var version = req.query.version || '1.0.0';
  var regionTag = req.query.region || 'US11001';                        // use region not specified in request, default to DC
  var branch = req.query.branch || process.env.GITHUB_TEMPLATE_BRANCH;  // use env. branch if not specified in request

/*
 * Backward compatiblity check (are we using old template schem or new?)
 *  If "US" folder is not present, then us
 */



/*
 * Fetch national/global template first
 *  (will attempt to read file from local cache, then grab from github if not present)
 *  This is a "lazy load" method and will only ever read from github if file does not exist in local cache
 *  Local cache is cleared when receive notice from github that branch has been merged or pushed...
 */
  var regionCountry = regionTag.substring(0,2);
  var resourceFile = '../' + process.env.LOCAL_CACHE + '/' + branch + '/' + regionCountry + '/template/' + resource + '.json';
  logger.info({resource: resource, branch: branch, url: resourceFile});
  fs.readFile(resourceFile, 'utf8', function(err,data) {
    if (err || data.length < 1) {
        // try github since file not available in local cache
        readFromGitHub( res, version, resource, branch, regionCountry, regionTag );
    }
    else {
        // NOTE: since this is cached, we know that the JSON.parse will never throw an error here
        var JSONdata =  JSON.parse(data);
        var resultObject = findVersion(version, JSONdata);
        //    logger.info(resultObject);
        /*
         * Now read file from regional template location and "absorb" into national template...
         *  Like national fetch, this will read form local cache first, then go to github if not found.
         *  Note that when a template is NOT found in github, an empty JSON object is stored to local cache so that we
         *      don't keep trying to get it from github on each resource request (and so we know it should be here now).
         */
        resourceFile = '../' + process.env.LOCAL_CACHE + '/' + branch + '/' + regionTag + '/template/'+ resource + '.json';
        logger.info({resource: resource, branch: branch, url: resourceFile});
        fs.readFile(resourceFile, 'utf8', function(err,data) {
            var regionalResultObject = {};
            if (err || data.length < 1) {
                // should not have this error, but we already have a national object... just log it...
                logger.error({message: 'Error reading local region file', file: resourceFile, error: err});
            }
            else {
                // NOTE: since this is cached, we know that the JSON.parse will never throw an error here
                var JSONdata = JSON.parse(data);
                regionalResultObject = findVersion(version, JSONdata);
            }

            // now absorb local into national
            //logger.info(resultObject);
            //logger.info(regionalResultObject);
            deepExtend(resultObject, regionalResultObject);
            //logger.info(resultObject);
            res.send(resultObject);
        });
    }
  });
};
