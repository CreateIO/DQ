var express     = require('express');
var pg          = require('pg');
pg.defaults.poolSize = 20;
var AWS         = require('aws-sdk');

var router = express.Router();

/*
 *  SELECT all analysis data regionID (region tag) and neighborhood
 *  Params:
 *    regionID=region tag (required; example regionID=US11001)
 *    neighborhood (required: example neighborhood="Adams Morgan"
 */
exports.fetch = function(req, res){
  var regionID = req.query.regionID;
  var neighborhood = req.query.neighborhood;
  var datetime = new Date();
  console.log(datetime + ': Running analysis fetch for specified region ID: ' + regionID + ' and neighborhood ' + neighborhood);
  console.log(req.query);
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (typeof req.query.regionID === "undefined" || req.query.regionID === null) {
    console.log('  Input error: no regionID specified' );
    return res.status(500).send('Missing regionID');
  }

  if (typeof req.query.neighborhood === "undefined" || req.query.neighborhood === null) {
    console.log('  Input error: no neighborhood specified' );
    return res.status(500).send('Missing neighborhood');
  }

//  var connectionString = 'pg:dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com:5432/DQ';
  var selectString = "SELECT * FROM analysis WHERE region_tag = '" + regionID + "' AND nbhd = '" + neighborhood + "';";
  var results = [];
  var rows = 0;

    pg.connect(req.app.locals.pg.connectionDef, function(err, client, done) {
      if(err) {
        console.log(err);
        done();
        return res.status(500).send('Unable to connect to DQ database');
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
            console.log('Analysis: read ' + rows + ' rows(s)')
//            console.log(results);
           return res.json(results);
        });

        query.on('error', function(error) {
          //handle the error
            console.log(error);
            done();
            return res.status(500).send('Unable to read from DQ database');
        });

      }

  });

};
