var express     = require('express');
var pg          = require('pg');

var router = express.Router();

/*
 *  SELECT data for a specified userdata/propertyID/regionID
 *      NOTE: ###THIS FUNCTION IS INCOMPLETE IN THAT IT IGNORES REGION AND IS SPECIFIC TO WDCEP!
 */
exports.fetch = function(req, res){
  var propertyID = req.query.propertyID;
  var version = req.query.version;
  var datetime = new Date();
  console.log(datetime + ': Running userdata fetch for specified propertyID: ' + propertyID);
  console.log(req.query);
  res.setHeader("Access-Control-Allow-Origin", "*");

//  var connectionString = 'pg:dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com:5432/DQ';
  var selectString = "SELECT * FROM wdcep_retail WHERE property_id = '" + propertyID + "' AND marketable = 'TRUE'";
  var results = [];
  var rows = 0;
  var connectionDef = {
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: 5432
  };
//    var connectionString = '//DQAdmin:lEtmEinplEasE!@dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com/DQ'
//    var connectionString = 'pg://DQAdmin:lEtmEinplEasE!@localhost:5433/DQ';

    pg.connect(connectionDef, function(err, client, done) {
      if(err) {
        console.log(err);
        done();
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
            console.log('Read ' + rows)
//            console.log(results);
           done();
           return res.json(results);
        });

        query.on('error', function(error) {
          //handle the error
            console.log(error);
            done();
            return res.status(404).send('Unable to read from DQ database');
        });

      }

  });

};

