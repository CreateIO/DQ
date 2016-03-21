var express = require('express');
var pg = require('pg');
var knoxCopy = require('knox-copy');
var config = require('../config');


var router = express.Router();
var logger = config.logger;

/*
 *  This function takes the region ID for the region and forms the pathname from that needed to access
 *  the assets for that region...
*/
formRegionFolderName = function(region_id) {
  if (region_id == 'null') {
    region_id = 'US11001';  // in case don't supply region_id, default to Washington DC (COUNTY level)
    logger.info({region_id: region_id, message: 'Using default region'});
  }
  var region_country = region_id.substring(0,2);
  var region_state = region_id.substring(0,4);
  var region_county = region_id.substring(0,7);
  var fullName = process.env.S3_ASSET_FOLDER + '/country/' + region_country + '/state/' + region_state + '/county/' + region_county;
  if (region_id.length > 7){
    // may be a city spec name, if so, add city to path
    fullName += '/city/' + region_id;
  }

 return fullName;

};

/*
 *  SELECT data for a specified userdata/propertyID/region/ID
 *      then return the URL to the assets for this propertyID
 */
exports.fetch = function(req, res){
  // this function called after have accumulated all possible site results
  var propertyID = req.query.propertyID;
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (!propertyID){
    return res.json([{"fileNames":[], "status":"success", "count":0}]);
  }
  var version = req.query.version;
  var type = req.query.type;
  var type2 = '';   // if type jpg or png make sure check both
  if (type == 'jpg')
    type2 = 'png';
  if (type == 'png')
    type2 = 'jpg';
  var resource = req.query.resource || 'WDCEP';    // default = WDCEP
  var region_id = req.query.region || 'US11001';
  logger.info({message: "Running docURL fetch", propertyId: propertyID, region_id: region_id, resource: resource});

  var selectString = "SELECT id,wdceppage AS assets FROM wdcep_retail where property_id = $1 AND marketable = 'TRUE'";
  if (resource == 'NGKF'){
    // replace default WDCEP with NGKF table resources
    selectString = "SELECT id,assets FROM ngkf_sites where property_id = $1";
  }
  var results = [];
  var rows = 0;
  pg.connect(config.pg.connectionDef, function(err, client, done) {
    if(err) {
      done();
      logger.error(err);
      return res.json([{"status":"Error: Unable to connect to DQ database", "count":0, "fileNames":[]}]);
    }

    // retrieve files for the given row that retreived from DB
    function getFiles( rowIndex ) {
      if (rowIndex < rows)
      {
        // if here, we still have another site (returned DB row) to process
        var folder = results[rowIndex].assets;
        var files = [];
        var fileCount = 0;
        if (folder !== '') {
          var fullName = formRegionFolderName(region_id) + '/imagesets-/' + folder;
          if (resource == 'NGKF'){
            // replace default WDCEP with NGKF table resources
            fullName = formRegionFolderName(region_id) + '/NGKF/' + folder;
          }
          logger.info({message:'Located assets', fullName: fullName});
          var client = knoxCopy.createClient({
            key: process.env.KC_KEY,
            secret: process.env.KC_SECRET,
            bucket: process.env.S3_ASSET_BUCKET
          });
          client.streamKeys({
            // omit the prefix to list the whole bucket
            prefix: fullName
          }).on('data', function(key) {
            //logger.info({message: "Data from knoxCopy request", key: key});
            if (key.slice(-3) == type || key.slice(-3) == type2)
            {
              files.push(key);
              fileCount++;
            }
          }).on('end', function() {
            logger.info({message: 'Processing end of knoxCopy request for iteration', rowIndex: rowIndex, files: files});
            results[rowIndex].fileNames = files;
            results[rowIndex].status = "success";
            results[rowIndex].count = fileCount;
            getFiles( ++rowIndex );   // process next site returned
          }).on('error', function(err) {
            var msg = {status:"Error: Unable to connect to S3 repository on knoxCopy request", "count":0, "fileNames":[], err:err};
            logger.error(msg);
            return res.json(msg);
          });
        }
        else {
          // if here, have no files for this site
          results[rowIndex].fileNames = [];
          results[rowIndex].status = "success";
          results[rowIndex].count = 0;
          getFiles( ++rowIndex );   // process next site returned
        }
      }
      else {
        // if here, have completed all rows (sites) returned from DB
        if (rows === 0){
            // if here, had no results, return empty set
            results.push({"fileNames":[], "status":"success", "count":0});       // set that have success and empty returned set in case nothing returned...
         }
        done();
        res.json(results);
      }
    }

    // if here, connected successfully to DB
    // SQL Query > Select Data
    var query = client.query(selectString, [propertyID]);

    // Stream results back one row at a time
    query.on('row', function(row) {
        results.push(row);
        rows++;
    });

    // After all data is returned, close connection and return results
    query.on('end', function() {
        //client.end();
        done();
        //logger.info({message: "Read rows", count: rows, results: results});
        getFiles( 0 );                  // sequentially go get files for each row returned
    });

    query.on('error', function(error) {
      //handle the error
      logger.error(error);
      done();
      return res.json([{"status":"Error reading from DQ database", "count":0, "fileNames":[]}]);
    });
   });
};

/*
 *  SELECT data for a specified userdata/propertyIdBin/region/ID
 *      then return all the file assets for this propertyID collection
 */
exports.fetchAll = function(req, res){
  // this function called after have accumulated all possible site results
  res.setHeader("Access-Control-Allow-Origin", "*");
  var propertyIdBin = req.query.propertyIdBin;
  if (!propertyIdBin){
    return res.json([{"status":"Error no propertyIdBin specified", "count":0, "fileNames":[]}]);
  }
  var version = req.query.version;
  var type = req.query.type;
  var type2 = '';   // if type jpg or png make sure check both
  if (type == 'jpg')
    type2 = 'png';
  if (type == 'png')
    type2 = 'jpg';
  var resource = req.query.resource || 'WDCEP';    // default = WDCEP
  var region_id = req.query.region || 'US11001';
  logger.info({message: 'Running docURL fetchAll for collection', propertyIDBin: propertyIdBin, region: region_id, resource: resource});
  logger.info(req.query);

  var results = [];
  var rows = 0;
  pg.connect(config.pg.connectionDef, function(err, client, done) {
    if(err) {
      done();
      logger.error(err);
      return res.json([{"fileNames":[], "status":"success", "count":0}]);
    }

    // retrieve files for the given row that retreived from DB
    function getFiles( rowIndex ) {
      if (rowIndex < rows)
      {
        // if here, we still have another site (returned DB row) to process
        var folder = results[rowIndex].assets;
        var files = [];
        var fileCount = 0;
        if (folder !== '') {
          var fullName = formRegionFolderName(region_id) + '/imagesets-/' + folder;
          if (resource == 'NGKF'){
            // replace default WDCEP with NGKF table resources
            fullName = formRegionFolderName(region_id) + '/NGKF/' + folder;
          }
          logger.info({message: 'Located assets', fullName: fullName});
          var client = knoxCopy.createClient({
            key: process.env.KC_KEY,
            secret: process.env.KC_SECRET,
            bucket: process.env.S3_ASSET_BUCKET
          });
          client.streamKeys({
            // omit the prefix to list the whole bucket
            prefix: fullName
          }).on('data', function(key) {
            //logger.info({message: "Data from knoxCopy request", key: key});
            if (key.slice(-3) == type || key.slice(-3) == type2)
            {
              files.push(key);
              fileCount++;
            }
          }).on('end', function() {
            logger.info({message: 'Processing end of knoxCopy request',
                iteration:  rowIndex, 
                files: files});
            results[rowIndex].fileNames = files;
            results[rowIndex].status = "success";
            results[rowIndex].count = fileCount;
            getFiles( ++rowIndex );   // process next site returned
          }).on('error', function(err) {
            logger.error({message: 'Encountered error on knoxCopy request', err: err});
            return res.json([{"status":"Error: Unable to connect to S3 repository", "count":0, "fileNames":[]}]);
          });
        }
        else {
          // if here, have no files for this site
          results[rowIndex].fileNames = [];
          results[rowIndex].status = "success";
          results[rowIndex].count = 0;
          getFiles( ++rowIndex );   // process next site returned
        }
      }
      else {
        // if here, have completed all rows (sites) returned from DB
        if (rows === 0){
            // if here, had no results, return empty set
            results.push({"fileNames":[], "status":"success", "count":0});       // set that have success and empty returned set in case nothing returned...
         }
        done();
        res.json(results);
      }
    }

    // retreive rows of assets from all propertyIDs in bin
    function getRows( propIDIndex ) {
      if (propIDIndex < propertyIdBin.length ) {
        // if here, have another propertyID to process
        // SQL Query > Select Data
        var propertyID = propertyIdBin[propIDIndex];
        logger.info("Processing DB request for propertyID: " + propertyID);
        var selectString = "SELECT id,property_id,wdceppage AS assets FROM wdcep_retail where property_id = $1 AND marketable = 'TRUE'";
        if (resource == 'NGKF'){
          // replace default WDCEP with NGKF table resources
          selectString = "SELECT id,assets FROM ngkf_sites where property_id = $1";
        }
        var query = client.query(selectString, [propertyID]);

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
            rows++;
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            //client.end();
            done();
            logger.info({message: 'Read rows', count: rows });
            logger.debug(results);
            getRows( ++propIDIndex );   // process next site returned
        });

        query.on('error', function(error) {
          //handle the error
          logger.error(error);
          done();
          return res.json([{"status":"Error reading from DQ database", "count":0, "fileNames":[]}]);
        });
      }
      else {
        // if here, have completed reading all rows from DB, now get assets
          getFiles(0);
      }
    }


    // if here, connected successfully to DB
    getRows(0);     // get all rows from DB for all property IDs in bin, starting with index=0

   });
};

