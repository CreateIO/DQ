var express     = require('express');
var pg          = require('pg');
var AWS         = require('aws-sdk');

var router = express.Router();

// Temporary mock json result for data sources...
var mockResults = '{"abrev": "OTR","source": "Example: Office of Tax and Revenue",' +
                       '"pull date": "2015-07-01",' +
                       '"learnMoreURL": "http://otr.cfo.dc.gov/",' +
                       '"docs": [{"docName": "OTRRecord","docURL": "https: //www.taxpayerservicecenter.com/?search_type=Sales"},' +
                            '{"docName": "OTRRecord","docURL": "https: //www.taxpayerservicecenter.com/?search_type=Sales"}]}';

/*
 *  SELECT region data for a specified regionID (fips code)
 *  Params:
 *    regionID=fips_code (required; example regionID=US11001)
 */
exports.dataSource = function(req, res){
  var regionID = req.query.regionID || 'US11001';
  var dataName = req.query.source_name;
  console.log('Running data source query for ' + dataName + ' in fips code: ' + regionID);
  console.log(req.query);
  res.setHeader("Access-Control-Allow-Origin", "*");

  // temporary mock data result return...
  return res.json(JSON.parse(mockResults));

/*
//  var connectionString = 'pg:dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com:5432/DQ';
  var selectString = "SELECT * FROM data_source WHERE fips_code = '" + regionID + ";";
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
*/
};
