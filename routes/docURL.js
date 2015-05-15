var express     = require('express');
var pg          = require('pg');
var knoxCopy = require('knox-copy');

var router = express.Router();
/*
getFilesFromS3 = function(folderName, type) {
  var fullName = 'phillyvi-test-2/assets/imagesets-/' + folderName
  var client = knoxCopy.createClient({
    key: 'AKIAI2NVER2KEZ67CZFQ',
    secret: '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',
    bucket: 'io.create'
  });

  var results = [];
  client.streamKeys({
    // omit the prefix to list the whole bucket
    prefix: fullName
  }).on('data', function(key) {
    if (key.slice(-3) == type)
    {
        console.log(key);
        results.push(key);
    }
  });
 return results;

}
*/
/*
 *  SELECT data for a specified userdata/propertyID/region/ID
 *      then return the URL to the assets for this propertyID
 */
exports.fetch = function(req, res){
  // this function called after have accumulated all possible site results
  var propertyID = req.query.propertyID;
  var version = req.query.version;
  var type = req.query.type;
  console.log("Running docURL fetch for specified propertyID: " + propertyID);
  console.log(req.query);
  res.setHeader("Access-Control-Allow-Origin", "*");

//  var connectionString = 'pg:dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com:5432/DQ';
  var selectString = "SELECT id,wdceppage AS assets FROM wdcep_retail where property_id = '" + propertyID + "' AND marketable = 'TRUE'";;
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
      done();
      pg.end()
      console.log(err);
    return res.json([{"status":"Error: Unable to connect to DQ database", "count":0, "fileNames":[]}]);
    }

    // retrieve files for the given row that retreived from DB
    function getFiles( rowIndex ) {
      if (rowIndex < rows)
      {
        // if here, we still have another site (returned DB row) to process
        var folder = results[rowIndex].assets;
        var files = [];
        var fileCount = 0;
        if (folder != '') {
          console.log('  Located assets: ' + folder );
          var fullName = 'phillyvi-test-2/assets/imagesets-/' + folder;
          var client = knoxCopy.createClient({
            key: process.env.KC_KEY,
            secret: process.env.KC_SECRET,
            bucket: process.env.S3_BUCKET
          });
          client.streamKeys({
            // omit the prefix to list the whole bucket
            prefix: fullName
          }).on('data', function(key) {
            if (key.slice(-3) == type)
            {
//              console.log(key);
              files.push(key);
              fileCount++;
            }
          }).on('end', function() {
            console.log('Processing end of knoxCopy request for iteration:' + rowIndex);
            console.log(files);
            results[rowIndex].fileNames = files;
            results[rowIndex].status = "success";
            results[rowIndex].count = fileCount;
            getFiles( ++rowIndex );   // process next site returned
          });
        }
        else {
          // if here, have no files for this site
          results[rowIndex].fileNames = [];
          results[rowIndex].status = "success";
          results[rowIndex].count = 0;
          getFiles( ++rowIndex );   // process next site returned
        }
      }
      else {
        // if here, have completed all rows (sites) returned from DB
        if (rows == 0){
            // if here, had no results, return empty set
            results.push({"filenames":[], "status":"success", "count":0});       // set that have success and empty returned set in case nothing returned...
         }
        done();
        pg.end();
        res.json(results);
      }
    };

    // if here, connected successfully to DB
    // SQL Query > Select Data
    var query = client.query(selectString);

    // Stream results back one row at a time
    query.on('row', function(row) {
        results.push(row);
        rows++;
    });

    // After all data is returned, close connection and return results
    query.on('end', function() {
        console.log('Read ' + rows + ' rows');
        console.log(results);
        getFiles( 0 );                  // sequentially go get files for each row returned
    });

    query.on('error', function(error) {
      //handle the error
      console.log(error);
      done();
      pg.end();
      return res.json([{"status":"Error reading from DQ database", "count":0, "fileNames":[]}]);
    });
   });

};

