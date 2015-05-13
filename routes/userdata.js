var express     = require('express');
var pg          = require('pg');

var router = express.Router();

/*
 *  SELECT data for a specified userdata/propertyID/region/ID
 */
exports.fetch = function(req, res){
  var propertyID = req.query.propertyID;
  var version = req.query.version;
  console.log("Running userdata fetch for specified propertyID: " + propertyID);
  console.log(req.query);

//  var connectionString = 'pg:dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com:5432/DQ';
  var selectString = "SELECT * FROM wdcep_retail where property_id = '" + propertyID + "';";
  var results = [];
  var rows = 0;
  var connectionDef = {
    user: 'DQAdmin',
    password: 'lEtmEinplEasE!',
    database: 'DQ',
//    host: 'localhost',
    host: 'dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com',
    port: 5432
  };
//    var connectionString = '//DQAdmin:lEtmEinplEasE!@dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com/DQ'
//    var connectionString = 'pg://DQAdmin:lEtmEinplEasE!@localhost:5433/DQ';

    pg.connect(connectionDef, function(err, client, done) {
      if(err) {
        console.log(err);
        res.status(404).send('Unable to connect to DQ database');
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
           return res.json(results);
        });

        query.on('error', function(error) {
          //handle the error
            console.log(error);
            res.status(404).send('Unable to read from DQ database');
        });

      }

    pg.end();
  });

};

