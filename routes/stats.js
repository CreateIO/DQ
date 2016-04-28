var express     = require('express');
var pg          = require('pg');
var config      = require('../config');
var converter   = require('json-2-csv');

var router = express.Router();
var logger = config.logger;

/*
 *  SELECT scraped stats data from DQ RDBS
 */
exports.fetch = function(req, res){
  var month = req.query.month || -1;  // default to summary stats
  var year = req.query.year || -1;
  var start_row = req.query.start || 0;
  var return_count = req.query.rows || -1;
  var return_format = req.query.format || 'json';   // default is normal JSON format return

  logger.info({message: 'Running stats fetch', month: month, year: year, start: start_row, rows: return_count});
  logger.debug(req.query);
  res.setHeader("Access-Control-Allow-Origin", "*");

  // assume we want ALL rows of query returned
  var selectString = "SELECT * FROM piwik_user_stats WHERE coverage_month = $1 AND coverage_year = $2 ORDER BY total_actions DESC";
  if (return_count != -1){
    selectString = "SELECT * FROM piwik_user_stats WHERE coverage_month = $1 AND coverage_year = $2 ORDER BY total_actions DESC LIMIT $3 OFFSET $4";
  }
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
      var query = "";
      if (return_count != -1){
        query = client.query(selectString,[month, year, return_count, start_row]);
      }
      else {
        query = client.query(selectString,[month, year]);
      }

      // Stream results back one row at a time
      query.on('row', function(row) {
          results.push(row);
          rows++;
      });

      // After all data is returned, close connection and return results
      query.on('end', function() {
          done();
            logger.info({message: 'Number of rows read for stat fetch', count: rows});
//            logger.info(results);
          if (return_format == 'csv'){
            // if here, returning in csv format (stored in json)
            converter.json2csv(results, function(error, csv){
              if(error){
                msg = 'Error converting stat results into csv format';
                logger.error({ message: msg, err: error});
                return res.status(500).send(msg);
              }
              // if here, have valid results for csv conversion
              //logger.info(csv);
              return res.send(csv);
            });
          }
          else {
            // if here, returning in normal json format
            var full_results = '{"count":' + rows + ',"stats":' + JSON.stringify(results) + '}'; // add additional params for count
            var resultObject = JSON.parse(full_results);    // turn back into object
            return res.json(resultObject);
          }
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

/*
 *  SELECT a single user's summary stat data from DQ RDBS
 */
exports.singleStat = function(req, res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  // first make sure have required values...
  if (typeof req.query.user_id === 'undefined' || req.query.user_id === null) {
    logger.error('  Input error: no user_id' );
    return res.status(500).send('Missing user_id');
  }
  var user = req.query.user_id;

  logger.info({message: 'Running stats fetch', month: month, year: year, start: start_row, rows: return_count});
  logger.debug(req.query);

  // assume we want ALL rows of query returned
  var selectString = "SELECT * FROM piwik_user_stats WHERE coverage_month = -1 AND coverage_year = -1 AND user_id = $1";
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
      var query = "";
      query = client.query(selectString,[user]);

      // Stream results back one row at a time
      query.on('row', function(row) {
          results.push(row);
          rows++;
      });

      // After all data is returned, close connection and return results
      query.on('end', function() {
        done();
        logger.info({message: 'Number of rows read for single stat fetch', count: rows});
//          logger.info(results);
        // if here, returning in normal json format
        var full_results = '{"count":' + rows + ',"stats":' + JSON.stringify(results) + '}'; // add additional params for count
        var resultObject = JSON.parse(full_results);    // turn back into object
        return res.json(resultObject);
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

