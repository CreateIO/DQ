var express     = require('express');
var pg          = require('pg');
var config      = require('../config');

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
            logger.info(results);
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

