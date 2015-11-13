var express     = require('express');
var pg          = require('pg');
var config      = require('../config');

var router = express.Router();
var logger = config.logger;

/*
 *  SELECT data for a specified userdata/propertyID/regionID
 *      NOTE: ###THIS FUNCTION IS INCOMPLETE IN THAT IT IGNORES REGION AND IS SPECIFIC TO WDCEP!
 */
exports.fetch = function(req, res){
  var propertyID = req.query.propertyID;
  var version = req.query.version;
  var datetime = new Date();
  logger.info({message: 'Running userdata fetch', propertyID: propertyID});
  logger.debug(req.query);
  res.setHeader("Access-Control-Allow-Origin", "*");

  var selectString = "SELECT * FROM wdcep_retail WHERE property_id = $1 AND marketable = 'TRUE'";
  var results = [];
  var rows = 0;
  var msg;

    pg.connect(config.pg.connectionDef, function(err, client, done) {
      if(err) {
        done();
        msg = 'Unable to connect to DQ database';
        logger.error({ message: msg, err: err});
        return res.status(500).send(msg);
      }
      else {
        // SQL Query > Select Data
        var query = client.query(selectString,[propertyID]);

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
            rows++;
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
//            logger.info({message: 'Read rows', count: rows});
//            logger.debug(results);
            return res.json(results);
        });

        query.on('error', function(error) {
          //handle the error
            done();
            msg='Unable to read from DQ database';
            logger.error({message: msg, error: error});
            return res.status(500).send(msg);
        });

      }

  });

};

