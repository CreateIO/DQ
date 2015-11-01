var express     = require('express');
var pg          = require('pg');
var config      = require('../config');
var AWS         = require('aws-sdk');

var router = express.Router();
var logger = config.logger;

/*
 *  SELECT all region data (less geometry) for a specified regionID (region tag)
 *  Params:
 *    regionID=region tag (required; example regionID=US11001)
 */
exports.fetch = function(req, res){
  var regionID = req.query.regionID;
  var datetime = new Date();
  logger.debug({
      msg: 'Running regiondata fetch for specified region ID', 
      regionId: regionID, 
      query: req.query
  });
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (typeof req.query.regionID === "undefined" || req.query.regionID === null) {
    var msg='Input error: Missing regionID';
    logger.error(msg);
    return res.status(500).send(msg);
  }

//  var connectionString = 'pg:dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com:5432/DQ';
  var selectString = "SELECT region_level, region_typename, region_child_typename, region_full_name, region_name, " +
    "region_abbrev, intpt_lat , intpt_lon, num_children, tag_country, tag_level1, tag_level2, tag_level3, " +
    "region_id, area_land, area_water FROM region_tags WHERE region_id = '" + regionID + "';";
  var results = [];
  var rows = 0;

    pg.connect(config.pg.connectionDef, function(err, client, done) {
      if(err) {
        done();
        var msg='Unable to read from DQ database';
        logger.error({msg: msg, error: err});
        return res.status(500).send(msg);
      }
      else {
        // SQL Query > Select Data
        var query = client.query(selectString);

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
            rows++;
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
            logger.info({msg: 'Read rows', count: rows});
            logger.debug(results);
           return res.json(results);
        });

        query.on('error', function(error) {
          //handle the error
            done();
            var msg='Unable to read from DQ database';
            logger.error({msg: msg, error: error});
            return res.status(500).send(msg);
        });

      }

  });

};

/*
 *  Locate all regions (at all levels) that contains the given lat/long
 *    long= (required)
 *    lat= (required)
 */
exports.locate = function(req, res){
  var longitude = req.query.long;
  var latitude = req.query.lat;
  var datetime = new Date();
  var msg;
  logger.info({
      msg:'Running query to find region that includes coordinates', 
      longitude: longitude, latitude: latitude, query: req.query});
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (typeof req.query.long === "undefined" || req.query.long === null) {
    msg='Input error: no longitude (long) specified';
    logger.error(msg);
    return res.status(500).send(msg);
  }

  if (typeof req.query.lat === "undefined" || req.query.lat === null) {
    msg='Input error: no latitude (lat) specified';
    logger.error(msg);
    return res.status(500).send(msg);
  }

//  var connectionString = 'pg:dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com:5432/DQ';
  var selectString = "Select region_id,region_full_name,region_level from region_tags where " +
    "ST_Contains(wkb_geometry, ST_SetSRID(ST_MakePoint(" + longitude + "," + latitude + "),'4326'));";
  var results = [];
  var rows = 0;

    pg.connect(config.pg.connectionDef, function(err, client, done) {
      if(err) {
        done();
        var msg='Unable to connect to DQ database';
        logger.error({msg: msg, err: err});
        return res.status(500).send(msg);
      }
      else {
        // SQL Query > Select Data
        var query = client.query(selectString);

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
            rows++;
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
            logger.info({msg: 'Read rows', count: rows});
            logger.debug(results);
           return res.json(results);
        });

        query.on('error', function(error) {
          //handle the error
            done();
            var msg='Unable to read from DQ database';
            logger.info({msg: msg, error: error});
            return res.status(500).send(msg);
        });

      }

  });

};

/*
 *  RETURN region(s) that match the specified name string(s)
 *      Note: depending on which params are provided, this can be a general matching algorithm, or very specific...
 *      All matching regions at all levels will be returned that match the given input params (zero or more)
 *  Params:
 *    name= region name string (could match anything -- state, country, abbreviation, etc.) (optional)
 *    nameCountry = country name or abbreviation (optional)
 *    nameState = state name or abbreviation (optional)
 *    countyName = county name or abbreviation (optional)
 *    cityName = city name (optional)
 *    level = level (0-3) of regions would like returned (optional).
 */
exports.find = function(req, res){
  var generalName = req.query.name || '';
  var countryName = req.query.nameCountry || '';
  var stateName = req.query.nameState || '';
  var countyName = req.query.nameCounty || '';
  var cityName = req.query.nameCity || '';
  var level = req.query.level || -1;
  logger.debug({
      msg:'Running region name search for specified name strings...',
      generalName: generalName,
      countryName: countryName,
      stateName: stateName,
      countyName: countyName,
      level: level
  });
  logger.info(req.query);
  res.setHeader("Access-Control-Allow-Origin", "*");

  if ((typeof req.query.name === "undefined" || req.query.name === null) &&
    (typeof req.query.nameCountry === "undefined" || req.query.nameCountry === null) &&
    (typeof req.query.nameState === "undefined" || req.query.nameState === null) &&
    (typeof req.query.nameCounty === "undefined" || req.query.nameCounty === null) &&
    (typeof req.query.nameCity === "undefined" || req.query.nameCity === null)) {
    var msg='Input error: no name string(s)s specified';
    logger.error(msg);
    return res.status(500).send(msg);
  }

  var regionSelect = '';
  var countrySelect = '';
  var stateSelect = '';
  var countySelect = '';
  var citySelect = '';
  var generalSelect = '';
  var selectString = "SELECT region_id,region_full_name,region_level from region_tags WHERE ";
  if (level >= 0)
  {
    selectString += "region_level = '" + level + "' AND ";
  }

  if (countryName.length > 0){
    countrySelect = "tag_country IN (SELECT tag_country from region_tags WHERE region_level = 0 AND (region_name = '" +
        countryName + "' OR region_abbrev = '" + countryName + "')) ";
    selectString += countrySelect;
  }
  if (stateName.length > 0){
    stateSelect = "tag_level1 IN (SELECT tag_level1 from region_tags WHERE region_level = 1 AND (region_name = '" +
        stateName + "' OR region_abbrev = '" + stateName + "') ";
    if (countrySelect.length > 0) {
        stateSelect += " AND " + countrySelect;
        selectString += " AND ";
    }
    stateSelect += ") ";
    selectString += stateSelect;
  }
  if (countyName.length > 0){
    countySelect = "tag_level2 IN (SELECT tag_level2 from region_tags WHERE region_level = 2 AND (region_name = '" +
        countyName + "' OR region_abbrev = '" + countyName + "') ";
    if (stateSelect.length > 0) {
        countySelect += "AND " + stateSelect;
        selectString += " AND ";
    }
    else if (countrySelect.length > 0){
        countySelect += "AND " + countrySelect;
        selectString += " AND ";
    }
    countySelect += ") ";
    selectString += countySelect;
  }
  if (cityName.length > 0){
    citySelect = "tag_level3 IN (SELECT tag_level3 from region_tags WHERE region_level = 3 AND (region_name = '" +
        cityName + "' OR region_abbrev = '" + cityName + "') ";
    if (countySelect.length > 0) {
        citySelect += "AND " + countySelect;
        selectString += " AND ";
    }
    else if (stateSelect.length > 0) {
        citySelect += "AND " + stateSelect;
        selectString += " AND ";
    }
    else if (countrySelect.length > 0){
        citySelect += "AND " + countrySelect;
        selectString += " AND ";
    }
    citySelect += ") ";
    selectString += citySelect;
  }
  if (generalName.length > 0){
    generalSelect = "(region_full_name LIKE '%" + generalName + "%' OR region_name LIKE '%" + generalName + "%' OR region_abbrev = '" + generalName + "')";
    if (countrySelect.length > 0 || stateSelect.length > 0 || countySelect.length > 0 || citySelect.length) selectString += " AND ";
    selectString += generalSelect;
  }
  selectString += ";";
  logger.debug({query:  selectString});

  var results = [];
  var rows = 0;

    pg.connect(config.pg.connectionDef, function(err, client, done) {
      if(err) {
        done();
        var msg='Unable to connect to DQ database';
        logger.error({msg: msg, error: err});
        return res.status(500).send(msg);
      }
      else {
        // SQL Query > Select Data
        var query = client.query(selectString);

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
            rows++;
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
            logger.info({msg: 'Read rows', count: rows});
            logger.debug(results);
            return res.json(results);
        });

        query.on('error', function(error) {
          //handle the error
            done();
            msg = 'Unable to read from DQ database';
            logger.error({msg: msg, error: error});
            return res.status(500).send(msg);
        });

      }

  });

};

/*
 *  locate adjoining regions for a specified regionID (region code)
 *  Params:
 *    regionID=regionID (required; example regionID=US11001)
 *    level= region level (optional, default= 2 (county level)
 */
exports.adjacent = function(req, res){
  var regionID = req.query.regionID;
  var regionLevel = req.query.level || 2;
  var datetime = new Date();
  var msg;
  logger.info({msg: 'Running nearby region locate', regionID: regionID, regionLevel: regionLevel});
  logger.debug(req.query);
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (typeof req.query.regionID === "undefined" || req.query.regionID === null) {
    msg = 'Input error: no regionID specified';
    logger.error(msg);
    return res.status(500).send(msg);
  }

  var selectString = "select fgb.region_id,fgb.region_full_name from region_tags as fga, region_tags as fgb " +
    	"WHERE fga.region_id = '" + regionID + "' AND fgb.region_level = '" + regionLevel + "' AND fgb.region_id != '" + regionID + "'" +
		    "AND ST_Intersects(fga.wkb_geometry, fgb.wkb_geometry);";
  var results = [];
  var rows = 0;

    pg.connect(config.pg.connectionDef, function(err, client, done) {
      if(err) {
        done();
        msg = 'Unable to connect to DQ database';
        logger.error({msg: msg, err: err});
        return res.status(500).send(msg);
      }
      else {
        // SQL Query > Select Data
        var query = client.query(selectString);

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
            rows++;
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
           done();
           logger.info({msg: 'Read rows', count: rows});
           logger.debug(results);
           return res.json(results);
        });

        query.on('error', function(error) {
          //handle the error
            done();
            var msg = 'Unable to read from DQ database';
            logger.error({msg: msg, error: err});
            return res.status(500).send(msg);
        });

      }

  });

};

/*
 *  This function takes the region code for the region and forms the pathname from that needed to access
 *  the assets for that region...
*/
formFolderName = function(regionID, level) {
  var region_country = regionID.substring(0,2);
  if (level === 0) {
    return process.env.S3_ASSET_FOLDER + '/country/' + region_country + '/regional/';
  }
  var region_state = regionID.substring(0,4);
  if (level == 1) {
    return process.env.S3_ASSET_FOLDER + '/country/' + region_country + '/state/' + region_state + '/regional/';
  }
  var region_county = regionID.substring(0,7);
  var fullName = process.env.S3_ASSET_FOLDER + '/country/' + region_country + '/state/' + region_state + '/county/' + region_county + '/regional/';
  if (level == 2) {
    // if here, want full local folders
    return fullName;
  }
  // if here, must want all of it, including city!
  fullName = process.env.S3_ASSET_FOLDER + '/country/' + region_country + '/state/' + region_state + '/county/' + region_county +
    '/city/' + regionID + '/regional/';
  return fullName;
};

/* getAsset()
 *  recursive function to attempt to read asset at current region level.  If error, go up one level and try again...
 */
getAsset = function(res, s3, regionID, regionLevel, resource ) {
  var resourceFile = formFolderName(regionID, regionLevel) + resource + '.json';
  var params = {Bucket: process.env.S3_ASSET_BUCKET, Key: resourceFile };
  var s3file = s3.getObject(params, function(err, data) {
    if (err) {
        if (--regionLevel < 0){
          // if here, we have exhausted all of our levels (resource not at any level)
          // report error since could not find resource file
          logger.error({
              msg: 'Unable to locate DQ regional asset', 
              resource: resource, error: err});
          res.status(500).send('Resource not found: ' + resourceFile);
        }
        else {
          // if here, file may be up one level, try again...
          getAsset( res, s3, regionID, regionLevel, resource);
        }
    }
    else {
        // found asset, return json object that corresponds to best version available within resource file
        try {
            var jsonData = JSON.parse(data.Body);
            //logger.info(jsonData);
            res.send(jsonData);
        }
        catch(e) {
            var msg = 'Error parsing JSON for resource: ' + resource + " Error: " + e;
            logger.error(e);
            res.status(500).send(msg);
        }
    }
  });
};

/*
 *  return a regional asset file (.json) back to client
 *  Params:
 *    region=regionID (required; example regionID=US11001)
 *    resource = name of asset that are requesting
 *  Sample Query:
 *    http://localhost:3000/DQ/regionAsset?region=US11001&resource=fredRecessionDates
 */
exports.fetchAsset = function(req, res){
  var regionID = req.query.region || 'US11001';
  // determine region level requesting data from by length of regionID
  var regionLevel = 0;
  var msg;
  if (regionID.length > 2) regionLevel++;
  if (regionID.length > 4) regionLevel++;
  if (regionID.length > 7) regionLevel++;
  var resource = req.query.resource;
  logger.debug({msg: 'Running region asset fetch', 
          region: regionID, regionLevel: regionLevel, query: req.query});
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (typeof req.query.region === "undefined" || req.query.region === null) {
    msg = 'Input error: no region specified';
    logger.error(msg);
    return res.status(500).send(msg);
  }

  if (typeof req.query.resource === "undefined" || req.query.resource === null) {
    msg = 'Input error: no resource specified';
    logger.err(msg);
    return res.status(500).send(msg);
  }

/*
 * This code reads an asset file from remote s3 repository using recursive function getAsset
 *  Note: we try city, then county, then state, then country in that order to fetch asset based on level of regionID provided
 *
 */
  var s3 = new AWS.S3();
  getAsset(res, s3, regionID, regionLevel, resource);

};
