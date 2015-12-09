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
  logger.info({message: 'Running analysis fetch', regionID: regionID, neighborhood: neighborhood});
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
  var selectString = "SELECT * FROM analysis WHERE region_tag = $1 AND nbhd = $2;";
  var results = [];
  var rows = 0;

    pg.connect(config.pg.connectionDef, function(err, client, done) {
      if(err) {
        done();
        var msg = 'Unable to connect to DQ database for analysis query';
        logger.error(msg);
        return res.status(500).send(msg);
      }
      else {
        // SQL Query > Select Data
        var query = client.query(selectString, [regionID,neighborhood]);

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
            rows++;
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
            logger.info({message: 'Read rows', count: rows});
            logger.debug(results);
            return res.json(results);
        });

        query.on('error', function(error) {
          //handle the error
            done();
            var msg = 'Unable to read from DQ database for analysis query';
            logger.error(msg);
            return res.status(500).send(msg);
        });

      }

  });

};

/*
 *  SELECT property count values (plus address, long, lat) for all address within specified date range and regionID (region tag)
 *  Params:
 *    regionID=region tag (required; example regionID=US11001)
 *    range=month range (optional: example range=3 to retrieve last 3 months of data (including all dates in current month), default = ALL data
 *    envelope=bounding box array -- 4 long/lat points (optional: default = all of region, example: [minLon, minLat, maxLon, maxLat])
 *    top=value (optional: return only the top N counts for query), default = ALL data
 */
exports.fetchPropCount = function(req, res){
  var regionID = req.query.regionID;
  var range = req.query.range;
  var envelope = req.query.envelope;
  var top = req.query.top;
  var datetime = new Date();
  var msg;
  logger.info({message: 'Running property count fetch', regionID: regionID, range: range});
  logger.debug(req.query);
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (typeof req.query.regionID === "undefined" || req.query.regionID === null) {
    msg = 'Input error: no regionID specified';
    logger.error(msg);
    return res.status(500).send(msg);
  }

  var selectString = "SELECT count,address,ST_X(coordinates),ST_Y(coordinates) FROM site_count WHERE region_tag = $1";
  if !(typeof req.query.range === "undefined" || req.query.range === null) {
    // format query to include range condition
    selectString += " AND count_date"
  }
  if !(typeof req.query.envelope === "undefined" || req.query.envelope === null) {
    // format query to include range condition
    selectString += " AND ST_Within(coordinates, ST_MakeEnvelope(envelope[0], envelope[1], envelope[2], envelope[3], 4326))"
  }
  selectString += " ORDER BY select_count DESC"
  if !(typeof req.query.top === "undefined" || req.query.top === null) {
    // format query to include limit amount
    selectString += " LIMIT $4"
  }
  selectString +=";"

  var results = [];
  var rows = 0;

  pg.connect(config.pg.connectionDef, function(err, client, done) {
    if(err) {
      done();
      var msg = 'Unable to connect to DQ database for property count query';
      logger.error(msg);
      return res.status(500).send(msg);
    }
    else {
      // SQL Query > Select Data
      logger.info({message: 'Query String', query: selectString});
      var query = client.query(selectString, [regionID,range,extent,top]);

      // Stream results back one row at a time
      query.on('row', function(row) {
          results.push(row);
          rows++;
      });

      // After all data is returned, close connection and return results
      query.on('end', function() {
          done();
          logger.info({message: 'Read rows', count: rows});
          logger.debug(results);
          return res.json(results);
      });

      query.on('error', function(error) {
        //handle the error
          done();
          var msg = 'Unable to read from DQ database for property count query';
          logger.error(msg);
          return res.status(500).send(msg);
      });

    }

  });

};
