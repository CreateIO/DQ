var express     = require('express');
var pg          = require('pg');
var AWS         = require('aws-sdk');

var router = express.Router();

/*
 *  SELECT all region data (less geometry) for a specified regionID (region tag)
 *  Params:
 *    regionID=region tag (required; example regionID=US11001)
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
  var selectString = "SELECT region_level, region_typename, region_child_typename, region_full_name, region_name, " +
    "region_abbrev, intpt_lat , intpt_lon, num_children, tag_country, tag_level1, tag_level2, tag_level3, " +
    "region_id, area_land, area_water FROM region_tags WHERE region_id = '" + regionID + "';";
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
 *  Locate all regions (at all levels) that contains the given lat/long
 *    long= (required)
 *    lat= (required)
 */
exports.locate = function(req, res){
  var longitude = req.query.long;
  var latitude = req.query.lat;
  var datetime = new Date();
  console.log(datetime + ": Running query to find region that includes given longitude=" + longitude + "; latitude=" + latitude);
//  console.log(req.query);
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (typeof req.query.long === "undefined" || req.query.long === null) {
    console.log('  Input error: no longitude (long) specified' );
    return res.status(404).send('Missing longitude (long)');
  }

  if (typeof req.query.lat === "undefined" || req.query.lat === null) {
    console.log('  Input error: no latitude (lat) specified' );
    return res.status(404).send('Missing latitude (lat)');
  }

//  var connectionString = 'pg:dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com:5432/DQ';
  var selectString = "Select region_id,region_full_name,region_level from region_tags where " +
    "ST_Contains(wkb_geometry, ST_SetSRID(ST_MakePoint(" + longitude + "," + latitude + "),'4326'));";
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
 *  RETURN region(s) that match the specified name string(s)
 *      Note: depending on which params are provided, this can be a general matching algorithm, or very specific...
 *      All matching regions at all levels will be returned that match the given input params (zero or more)
 *  Params:
 *    name= region name string (could match anything -- state, country, abbreviation, etc.) (optional)
 *    nameCountry = country name or abbreviation (optional)
 *    nameState = state name or abbreviation (optional)
 *    countyName = county name or abbreviation (optional)
 *    cityName = city name (optional)
 */
exports.find = function(req, res){
  var generalName = req.query.name || '';
  var countryName = req.query.nameCountry || '';
  var stateName = req.query.nameState || '';
  var countyName = req.query.nameCounty || '';
  var cityName = req.query.nameCity || '';
  var datetime = new Date();
  console.log(datetime + ': Running region name search for specified name strings...');
  console.log(req.query);
  res.setHeader("Access-Control-Allow-Origin", "*");

  if ((typeof req.query.name === "undefined" || req.query.name === null) &&
    (typeof req.query.nameCountry === "undefined" || req.query.nameCountry === null) &&
    (typeof req.query.nameState === "undefined" || req.query.nameState === null) &&
    (typeof req.query.nameCounty === "undefined" || req.query.nameCounty === null) &&
    (typeof req.query.nameCity === "undefined" || req.query.nameCity === null)) {
    console.log('  Input error: no name string(s)s specified' );
    return res.status(404).send('Missing name string(s)');
  }

  var regionSelect = '';
  var countrySelect = '';
  var stateSelect = '';
  var countySelect = '';
  var citySelect = '';
  var generalSelect = '';
  var selectString = "SELECT region_id,region_full_name,region_level from region_tags WHERE "

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
  console.log("Query: " + selectString);

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
 *  locate adjoining regions for a specified regionID (region code)
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
 *  This function takes the region code for the region and forms the pathname from that needed to access
 *  the assets for that region...
*/
formFolderName = function(regionID, level) {
  var region_country = regionID.substring(0,2);
  if (level == 0) {
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
          console.log('Unable to locate DQ regional asset; ' + resource + ' with status: ' + err);
          res.status(404).send('Resource not found: ' + resourceFile);
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

  if (typeof req.query.region === "undefined" || req.query.region === null) {
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
  getAsset(res, s3, regionID, regionLevel, resource);

};