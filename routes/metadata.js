var express     = require('express');
var pg          = require('pg');
var config      = require('../config');

var logger = config.logger;
var router = express.Router();

var fault_inject_client_end = function(client) {
    if (process.env.FAULT_INJECT_CLIENT_END === "true") {
        client.end();
    }
};

/*
// Temporary mock json result for data sources...
var mockResults = '{"abrev": "OTR","source": "Example: Office of Tax and Revenue",' +
                       '"pullDate": "2015-07-01",' +
                       '"learnMoreURL": "http://otr.cfo.dc.gov/",' +
                       '"contact":"suggest@create.io",' +
                       '"docs": [{"docName": "OTRRecord","docURL": "https: //www.taxpayerservicecenter.com/?search_type=Sales"},' +
                            '{"docName": "OTRRecord","docURL": "https: //www.taxpayerservicecenter.com/?search_type=Sales"}]}';
*/
/*
 *  SELECT region data for a specified regionID (fips code)
 *  Params:
 *    regionID=region tag (required; example regionID=US11001)
 *    source_name=fieldname for field want source metadata of
 *  Example call: http://dq-test/DQ/datasource?dataName=property.address&regionID=US11001
 */
exports.dataSource = function(req, res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (typeof req.query.source_name === "undefined" || req.query.source_name === null) {
    logger.error('Input error: no source_name specified' );
    return res.status(500).send('Missing source_name');
  }
  var regionID = req.query.regionID || 'US11001';
  var fieldName = req.query.source_name;
  var datetime = new Date();
  
  logger.info({message:'Running data source query', fieldName: fieldName, region: regionID, query: req.query});

  var selectString = "select * from field_source INNER JOIN data_source USING (source) WHERE $1 = ANY(field_source.field_name) AND field_source.regionid = $2;";
  var results = [];
  var rows = 0;
    pg.connect(config.pg.connectionDef, function(err, client, done) {
      if(err) {
        done();
        logger.error(err);
        return res.status(500).send('Unable to connect to DQ database');
      }
      else {
        // SQL Query > Select Data
        var query = client.query(selectString, [fieldName,regionID]);

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
            rows++;
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            // For test purposes, you can add this environment
            // variable and the load tests will start failing.
            // FAULT_INJECT_CLIENT_END=true
            fault_inject_client_end(client);
            done();
            if (rows === 0){
                logger.info({message: "requested source_name not found in field_sources DB", fieldName: fieldName});
            } else {
                logger.info({message: 'Read rows', count: rows});
            }
           logger.debug(results);
           return res.json(results);
        });

        query.on('error', function(error) {
          //handle the error
            done();
            logger.error(error);
            return res.status(500).send('Unable to read from DQ database');
        });

      }

  });

};
