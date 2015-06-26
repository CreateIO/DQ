var express     = require('express');
var pg          = require('pg');

var router = express.Router();

/*
 *  SELECT region data for a specified regionID (fips code)
 *  Params:
 *    regionID=fips_code (required; example regionID=US11001)
 */
exports.fetch = function(req, res){
  var regionID = req.query.regionID;
  console.log("Running regiondata fetch for specified fips code: " + regionID);
  console.log(req.query);
  res.setHeader("Access-Control-Allow-Origin", "*");

//  var connectionString = 'pg:dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com:5432/DQ';
  var selectString = "SELECT * FROM region_fips WHERE fips_code = '" + regionID + ";";
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
  var regionLevel = req.query.level || 2;   // default to county level (level 2)
  console.log("Running query to find region that includes given longitude=" + longitude + "; latitude=" + latitude + " for level >= : " + regionLevel + ";");
  console.log(req.query);
  res.setHeader("Access-Control-Allow-Origin", "*");

//  var connectionString = 'pg:dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com:5432/DQ';
  var selectString = "Select fips_code,region_full_name from region_fips where ST_Contains(wkb_geometry, ST_SetSRID(ST_MakePoint(" + longitude + "," + latitude + "),'900914'));";
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
 *    regionID=fips_code (required; example regionID=US11001)
 */
exports.adjacent = function(req, res){
  var regionID = req.query.regionID;
  console.log("Running regiondata fetch for specified fips code: " + regionID);
  console.log(req.query);
  res.setHeader("Access-Control-Allow-Origin", "*");

//  var connectionString = 'pg:dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com:5432/DQ';
  var selectString = "select fgb.fips_code,fgb.region_full_name from region_fips as fga, region_fips as fgb " +
    	"WHERE fga.fips_code = '" + regionID + "' AND fgb.region_level = 2 AND fgb.fips_code != '" + regionID + "'" +
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

