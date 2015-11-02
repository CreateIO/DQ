var express     = require('express');
var pg          = require('pg');
pg.defaults.poolSize = 20;

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

  var selectString = "SELECT * FROM wdcep_retail WHERE property_id = '" + propertyID + "' AND marketable = 'TRUE'";
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
            //client.end();
            done();
            console.log('Userdata: read ' + rows);
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

