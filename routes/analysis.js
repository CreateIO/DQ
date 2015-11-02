var express     = require('express');
var pg          = require('pg');
var AWS         = require('aws-sdk');
var config      = require('../config');

var router = express.Router();
var logger = config.logger;

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
  var msg;
  logger.info({msg: 'Running analysis fetch', regionID: regionID, neighborhood: neighborhood});
  logger.debug(req.query);
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (typeof req.query.regionID === "undefined" || req.query.regionID === null) {
    msg = 'Input error: no regionID specified';
    logger.error(msg);
    return res.status(500).send(msg);
  }

  if (typeof req.query.neighborhood === "undefined" || req.query.neighborhood === null) {
    msg = 'Input error: no neighborhood specified';
    logger.error(msg);
    return res.status(500).send(msg);
  }

//  var connectionString = 'pg:dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com:5432/DQ';
  var selectString = "SELECT * FROM analysis WHERE region_tag = '" + regionID + "' AND nbhd = '" + neighborhood + "';";
  var results = [];
  var rows = 0;

    pg.connect(config.pg.connectionDef, function(err, client, done) {
      if(err) {
        done();
        var msg = 'Unable to connect to DQ database';
        logger.error(msg);
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
            var msg = 'Unable to connect to DQ database';
            logger.error(msg);
            return res.status(500).send(msg);
        });

      }

  });

};
