var express     = require('express');
var pg          = require('pg');
var AWS         = require('aws-sdk');

var router = express.Router();

/*
 *  SELECT region data for a specified regionID (fips code)
 *  Params:
 *    regionID=regionID (required; example regionID=US11001)
 */
exports.fetch = function(req, res){
  var regionID = req.query.regionID;
  var datetime = new Date();
  console.log(datetime + ': Running regiondata fetch for specified region ID: ' + regionID);
  console.log(req.query);
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (typeof req.query.regionID === "undefined" || req.query.regionID === null) {
    console.log('  Input error: no regionID specified' );
    return res.status(404).send('Missing regionID');
  }

//  var connectionString = 'pg:dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com:5432/DQ';
  var selectString = "SELECT * FROM region_tags WHERE region_id = '" + regionID + "';";
  var results = [];
  var rows = 0;
  var connectionDef = {
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: 5432
  };

    pg.connect(connectionDef, function(err, client, done) {
      if(err) {
        console.log(err);
        done();
        pg.end();
        return res.status(404).send('Unable to connect to DQ database');
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
            client.end();
            console.log('Read ' + rows)
//            console.log(results);
           done();
           pg.end();
           return res.json(results);
        });

        query.on('error', function(error) {
          //handle the error
            console.log(error);
            done();
            pg.end();
            return res.status(404).send('Unable to read from DQ database');
        });

      }

  });

};

/*
 *  FIND a region (or regions) that contains the given lat/long
 *    long= (required)
 *    lat= (required)
 *    level=regionLevel (optional; example: level=2 for only the county level result, level=1 for county+state, level = 0 for country+state+county
 */
exports.find = function(req, res){
  var longitude = req.query.long;
  var latitude = req.query.lat;
  var regionLevel = req.query.level || 3;   // default to city level (level 3)
  var datetime = new Date();
  console.log(datetime + ": Running query to find region that includes given longitude=" + longitude + "; latitude=" + latitude + " for level >= : " + regionLevel);
//  console.log(req.query);
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (typeof req.query.req.query.long === "undefined" || req.query.req.query.long === null) {
    console.log('  Input error: no longitude (long) specified' );
    return res.status(404).send('Missing longitude (long)');
  }

  if (typeof req.query.req.query.lat === "undefined" || req.query.req.query.lat === null) {
    console.log('  Input error: no latitude (lat) specified' );
    return res.status(404).send('Missing latitude (lat)');
  }

//  var connectionString = 'pg:dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com:5432/DQ';
  var selectString = "Select region_id,region_full_name from region_tags where ST_Contains(wkb_geometry, ST_SetSRID(ST_MakePoint(" + longitude + "," + latitude + "),'4326'));";
  var results = [];
  var rows = 0;
  var connectionDef = {
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: 5432
  };

    pg.connect(connectionDef, function(err, client, done) {
      if(err) {
        console.log(err);
        done();
        pg.end();
        return res.status(404).send('Unable to connect to DQ database');
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
            client.end();
            console.log('Read ' + rows)
//            console.log(results);
           done();
           pg.end();
           return res.json(results);
        });

        query.on('error', function(error) {
          //handle the error
            console.log(error);
            done();
            pg.end();
            return res.status(404).send('Unable to read from DQ database');
        });

      }

  });

};

/*
 *  locate adjoining regions for a specified regionID (fips code)
 *  Params:
 *    regionID=regionID (required; example regionID=US11001)
 *    level= region level (optional, default= 2 (county level)
 */
exports.adjacent = function(req, res){
  var regionID = req.query.regionID;
  var regionLevel = req.query.level || 2;
  var datetime = new Date();
  console.log(datetime + ': Running nearby region locate for specified region ID: ' + regionID + ' at region level: ' + regionLevel);
  console.log(req.query);
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (typeof req.query.regionID === "undefined" || req.query.regionID === null) {
    console.log('  Input error: no regionID specified' );
    return res.status(404).send('Missing regionID');
  }

  var selectString = "select fgb.region_id,fgb.region_full_name from region_tags as fga, region_tags as fgb " +
    	"WHERE fga.region_id = '" + regionID + "' AND fgb.region_level = '" + regionLevel + "' AND fgb.region_id != '" + regionID + "'" +
		    "AND ST_Intersects(fga.wkb_geometry, fgb.wkb_geometry);";
  var results = [];
  var rows = 0;
  var connectionDef = {
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: 5432
  };

    pg.connect(connectionDef, function(err, client, done) {
      if(err) {
        console.log(err);
        done();
        pg.end();
        return res.status(404).send('Unable to connect to DQ database');
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
            client.end();
            console.log('Read ' + rows)
//            console.log(results);
           done();
           pg.end();
           return res.json(results);
        });

        query.on('error', function(error) {
          //handle the error
            console.log(error);
            done();
            pg.end();
            return res.status(404).send('Unable to read from DQ database');
        });

      }

  });

};

/*
 *  This function takes the fips code for the region and forms the pathname from that needed to access
 *  the assets for that region...
*/
formFolderName = function(regionID, level) {
  var fips_country = regionID.substring(0,2);
  if (level == 0) {
    return process.env.S3_ASSET_FOLDER + '/country/' + fips_country + '/regional/';
  }
  var fips_state = regionID.substring(0,4);
  if (level == 1) {
    return process.env.S3_ASSET_FOLDER + '/country/' + fips_country + '/state/' + fips_state + '/regional/';
  }
  var fips_county = regionID.substring(0,7);
  var fullName = process.env.S3_ASSET_FOLDER + '/country/' + fips_country + '/state/' + fips_state + '/county/' + fips_county + '/regional/';
  if (level == 2) {
    // if here, want full local folders
    return fullName;
  }
  // if here, must want all of it, including city!
  fullName = process.env.S3_ASSET_FOLDER + '/country/' + fips_country + '/state/' + fips_state + '/county/' + fips_county +
    '/city/' + regionID _ '/regional/';
  return fullName;
};

/* getAsset()
 *  recursive function to attempt to read asset at current region level.  If error, go up one level and try again...
 */
getAsset = function(s3, regionID, regionLevel ) {
  var resourceFile = formFolderName(regionID, regionLevel) + resource + '.json';
  var params = {Bucket: process.env.S3_ASSET_BUCKET, Key: resourceFile };
  var s3file = s3.getObject(params, function(err, data) {
    if (err) {
        if (--regionLevel < 0){
          // if here, we have exhausted all of our levels (resource not at any level)
          // report error since could not find resource file
          console.log('Unable to locate DQ regional asset; ' + resource + ' with status: ' + err);
          res.status(404).send('Resource not found: ' + resourceFile);
        }
        else {
          // if here, file may be up one level, try again...
          getAsset( s3, regionID, regionLevel);
        }
    }
    else {
        // found asset, return json object that corresponds to best version available within resource file
        try {
            var jsonData = JSON.parse(data.Body);
            //console.log(jsonData);
            res.send(jsonData);
        }
        catch(e) {
            console.log(e);
            res.status(404).send('Error parsing JSON for resource: ' + resource + " Error: " + e);
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
  if (regionID.length > 2) regionLevel++;
  if (regionID.length > 4) regionLevel++;
  if (regionID.length > 7) regionLevel++;
  var resource = req.query.resource;
  var datetime = new Date();
  console.log(datetime + ': Running region asset fetch for specified region: ' + regionID + ' starting at region level: ' + regionLevel);
  console.log(req.query);
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (typeof req.query.regionID === "undefined" || req.query.regionID === null) {
    console.log('  Input error: no region specified' );
    return res.status(404).send('Missing region');
  }

  if (typeof req.query.resource === "undefined" || req.query.resource === null) {
    console.log('  Input error: no resource specified' );
    return res.status(404).send('Missing resource');
  }

/*
 * This code reads an asset file from remote s3 repository using recursive function getAsset
 *  Note: we try city, then county, then state, then country in that order to fetch asset based on level of regionID provided
 *
 */
  var s3 = new AWS.S3();
  getAsset(s3, regionID, regionlevel);

};