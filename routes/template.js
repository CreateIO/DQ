var express     = require('express');
var fs          = require('fs');
//var http        = require('http');
//var AWS         = require('aws-sdk');
var Github = require('github-api');
var mkdirp = require('mkdirp');
var rmdir = require('rmdir');
var config = require('../config');
var _ = require('lodash'); //underscore's ok too..
var extendify = require('extendify');
var deepExtend = require('deep-extend');
_.extend = extendify({
  //options
  arrays : "concat"
})

var router = express.Router();
var logger = config.logger;

/*
    Sample CURL to get to git using API:
    curl -i -uBreighton:password "https://api.github.com/repos/CreateIO/DQMatchSets/contents/US11001/template/tabsNEW-.json?ref=test-regions"
*/

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

function writeToLocalCache( resourceType, resource, branch, region_id, contents )
{
  var resourceFile = '../' + process.env.LOCAL_CACHE + '/' + branch + '/' + region_id + '/' + resourceType + '/' + resource + '.json';
  var fd = fs.open(resourceFile, 'w', function( err, fd ) {
      if (err){
        var regionFolder = '../' + process.env.LOCAL_CACHE  + '/' + branch + '/' + region_id;
        var moreFolders = resource.split("/");  // any more folders?
        var templateFolder = regionFolder + '/' + resourceType;
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
function readFromGitHub( callback, resourceType, resource, branch, regionCountry, regionTag, countryData )
{
  // Note: we get github values (user, token, repo, branch) from global environment specified in dq_env.sh
  var github = new Github({
    token: process.env.GITHUB_TOKEN,
    auth: "oauth"
  });
  var repo = github.getRepo(process.env.GITHUB_OWNER, process.env.GITHUB_TEMPLATE_REPO);

  // we read first from local file...
  var regionResourceFile = process.env.GITHUB_FOLDER + regionTag + '/' + resourceType + '/' + resource + '.json';
  var regionResultObject = {};    // assume did not find file in github

  logger.info('Reading file from github: ' + process.env.GITHUB_TEMPLATE_REPO + '/' + regionResourceFile + ' on branch: ' + branch);
  repo.read(branch, regionResourceFile, function(err, data) {
    if (err) {
        // file does not exist on github -- write empty JSON object to local cache for next call to this resource
        logger.error({message: "Unable to read regional file from github, writing empty file to cache", error: err})
        writeToLocalCache( resourceType, resource, branch, regionTag, '{}' );
    }
    else {
        try {
            regionResultObject = JSON.parse(data);
            // now that have data, cache it locally!
            writeToLocalCache( resourceType, resource, branch, regionTag, data );
        }
        catch(e) {
            logger.info({message: 'Error parsing JSON for resource', error: e});
            writeToLocalCache( resourceType, resource, branch, regionTag, '{}' ); // write empty object to local cache until user pushes branch again
       }
    }

    // now see if need national and read again from national region if so (otherwise, already have data present)
    var nationalResultObject = {};    // assume did not find file in github
    if (regionCountry){
      // if here, we need to check github for national data
      nationalResourceFile = process.env.GITHUB_FOLDER + regionCountry + '/' + resourceType + '/' + resource + '.json';

      logger.info('Reading file from github: ' + process.env.GITHUB_TEMPLATE_REPO + '/' + nationalResourceFile + ' on branch: ' + branch);
      repo.read(branch, nationalResourceFile, function(err, data) {
        if (err) {
            // file does not exist on github -- write empty JSON object to local cache for next call to this resource
            logger.error({message: "Unable to read national file from github, writing empty file to cache", error: err})
            writeToLocalCache( resourceType, resource, branch, regionCountry, '{}' );
        }
        else {
          try {
            nationalResultObject =  JSON.parse(data);
             // now that have data, cache it locally!
            writeToLocalCache( resourceType, resource, branch, regionCountry, data );
          }
          catch(e) {
              logger.info({message: 'Error parsing JSON for resource', error: e});
              writeToLocalCache( resourceType, resource, branch, regionCountry, '{}' ); // write empty object to local cache until user pushes branch again
          }
        }
        // now "absorb" regional into national...
        //logger.info(nationalResultObject);
        //logger.info(regionResultObject);
//        _.extend(nationalResultObject, regionResultObject);
        deepExtend(nationalResultObject, regionResultObject);
        //logger.info(resultObject);
        // return the JSON result (or null object if not present in github)
        callback(nationalResultObject);   // return result to calling party
      });
    }
    else{
      // if here, we have already read national data, use what we found
      nationalResourceObject = countryData; // grab what we passed us that have already read from cache
      // now "absorb" regional into national...
//      _extend(nationalResultObject, regionResultObject);
      deepExtend(nationalResultObject, regionResultObject);
      //logger.info(resultObject);
      // return the JSON result (or null object if not present in github)
      callback(nationalResultObject);   // return result to calling party
    }
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
  var regionTag = req.query.region || 'US11001';                        // use region not specified in request, default to DC
  var branch = req.query.branch || process.env.GITHUB_TEMPLATE_BRANCH;  // use env. branch if not specified in request

  /* prepare callback function for readFromGithub.  Not really needed for the single template fetch, but allows us to
   * use the same function when we have multiple templates to merge
   */
  function rghResult(result) {
    // send result back to app
      res.send(result);
  }

  /*
   * Fetch national/global template first
   *  (will attempt to read file from local cache, then grab from github if not present)
   *  This is a "lazy load" method and will only ever read from github if file does not exist in local cache
   *  Local cache is cleared when receive notice from github that branch has been merged or pushed...
   */
  var regionCountry = regionTag.substring(0,2);
  var resourceFile = '../' + process.env.LOCAL_CACHE + '/' + branch + '/' + regionCountry + '/template/' + resource + '.json';
  logger.info({resource: resource, branch: branch, url: resourceFile});
  var resultObject = null;
  fs.readFile(resourceFile, 'utf8', function(err,data) {
    if (err || data.length < 1) {
        // try github since file not available in local cache
        readFromGitHub( rghResult, 'template', resource, branch, regionCountry, regionTag, null );
    }
    else {
        // NOTE: since this is cached, we know that the JSON.parse will never throw an error here
        resultObject = JSON.parse(data);
        //    logger.info(resultObject);
        /*
         * Now read file from national template location and "absorb" into national template...
         *  Like national fetch, this will read form local cache first, then go to github if not found.
         *  Note that when a template is NOT found in github, an empty JSON object is stored to local cache so that we
         *      don't keep trying to get it from github on each resource request (and so we know it should be here now).
         */
        resourceFile = '../' + process.env.LOCAL_CACHE + '/' + branch + '/' + regionTag + '/template/'+ resource + '.json';
        logger.info({resource: resource, branch: branch, url: resourceFile});
        fs.readFile(resourceFile, 'utf8', function(err,data) {
            var regionalResultObject = {};
            if (err || data.length < 1) {
                // if here, already have national object cached, but may have fetched when looked at a different region
                // do github call for regional ONLY (no countryTag given tells function this)
                readFromGitHub( rghResult, 'template', resource, branch, null, regionTag, resultObject );
            }
            else {
                // NOTE: since this is cached, we know that the JSON.parse will never throw an error here
                regionalResultObject= JSON.parse(data);
                // now absorb local into national
                //logger.info(resultObject);
                //logger.info(regionalResultObject);
//                _.extend(resultObject, regionalResultObject);
                deepExtend(resultObject, regionalResultObject);
                //logger.info(resultObject);
                res.send(resultObject);
           }
        });
    }
  });
};

/*
 *  GET template data for the specified group(s)
 *  Input:
 *    groupBin = required array of 1 or more group IDs to return combined templates from
 *    region = optional region tag (default = US11001)
 *    branch = optional (debug) specification of which DQMatchSetBranch to use in retreiving template data
 *            (default = GITHUB_TEMPLATE_BRANCH as specified in env. file for server)
 */
exports.fetchGroupData = function(req, res){
  var datetime = new Date();
  res.setHeader('Access-Control-Allow-Origin', '*');

  logger.info({message: 'Running fetch for specified group(s)'});

  // first make sure have required values...
  var groupIDArray = req.query.groupBin;
  if (!groupIDArray){
    logger.error('  Input error: group bin array empty' );
    return res.status(500).send('Missing group IDs');
  }
  var regionTag = req.query.region || 'US11001';                        // use region not specified in request, default to DC
  var branch = req.query.branch || process.env.GITHUB_TEMPLATE_BRANCH;  // use env. branch if not specified in request

  var resultObject = {};  // start with NULL results

  // retrieve files for the next groupID passed to function
  function getGroupFiles( groupIndex ) {
    if (groupIndex < groupIDArray.length ) {
      // if here, we have more group templates to grab and merge
      var groupID = groupIDArray[groupIndex];
      var resource = 'group_' + groupID;
      /* prepare callback function for readFromGithub.  Not really needed for the single template fetch, but allows us to
       * use the same function when we have multiple templates to merge
       */
      function rghResult(result) {
        // send result back to app
          _.extend(resultObject, result); // concat/merge with existing group results
          getGroupFiles(++groupIndex);    // get next group template to merge
      }

      /*
       * Fetch national/global group data template first
       *  (will attempt to read file from local cache, then grab from github if not present)
       *  This is a "lazy load" method and will only ever read from github if file does not exist in local cache
       *  Local cache is cleared when receive notice from github that branch has been merged or pushed...
       */
      var regionCountry = regionTag.substring(0,2);
      var resourceFile = '../' + process.env.LOCAL_CACHE + '/' + branch + '/' + regionCountry + '/group/' + resource + '.json';
      logger.info({resource: resource, branch: branch, url: resourceFile});
      fs.readFile(resourceFile, 'utf8', function(err,data) {
        if (err || data.length < 1) {
            // try github since file not available in local cache
            readFromGitHub( rghResult, 'group', resource, branch, regionCountry, regionTag, null );
        }
        else {
            // NOTE: since this is cached, we know that the JSON.parse will never throw an error here
            var groupObject = JSON.parse(data);
            //    logger.info(groupObject);
            /*
             * Now read file from national template location and "absorb" into national template...
             *  Like national fetch, this will read form local cache first, then go to github if not found.
             *  Note that when a template is NOT found in github, an empty JSON object is stored to local cache so that we
             *      don't keep trying to get it from github on each resource request (and so we know it should be here now).
             */
            resourceFile = '../' + process.env.LOCAL_CACHE + '/' + branch + '/' + regionTag + '/group/'+ resource + '.json';
            logger.info({resource: resource, branch: branch, url: resourceFile});
            fs.readFile(resourceFile, 'utf8', function(err,data) {
                var regionalResultObject = {};
                if (err || data.length < 1) {
                    // if here, already have national object cached, but may have fetched when looked at a different region
                    // do github call for regional ONLY (no countryTag given tells function this)
                    readFromGitHub( rghResult, 'group', resource, branch, null, regionTag, groupObject );
                }
                else {
                    // NOTE: since this is cached, we know that the JSON.parse will never throw an error here
                    regionalResultObject= JSON.parse(data);
                    // now absorb local into national
                    //logger.info(groupObject);
                    //logger.info(regionalResultObject);
                    _.extend(groupObject, regionalResultObject);
                    _.extend(resultObject, groupObject);    // now absorb local/national of this group with prev. groups
                    //logger.info(groupObject);
                    getGroupFiles(++groupIndex);    // get next group template to merge
               }
            });
        }
      });
    }
    else
    {
      // if here, have finished accumulating results, send them off...
      res.json(resultObject);
    }
  }

  getGroupFiles(0);    // fetch all group files and combine into single JSON return object

};