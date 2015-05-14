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
  var fileCount = 0;
  var connectionDef = {
    user: 'DQAdmin',
    password: 'lEtmEinplEasE!',
    database: 'DQ',
    host: 'dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com',
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
            console.log('Read ' + rows + ' rows');
            console.log(results);
            var gotData = false;
            for (var ii in results) {
                var folder = results[ii].assets;
                if (folder != '') {
                  gotData = true;
                  console.log('  Located assets: ' + folder );
                  var fullName = 'phillyvi-test-2/assets/imagesets-/' + folder;
                  var client = knoxCopy.createClient({
                    key: 'AKIAI2NVER2KEZ67CZFQ',
                    secret: '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',
                    bucket: 'io.create'
                  });
                  var files = [];
                  client.streamKeys({
                    // omit the prefix to list the whole bucket
                    prefix: fullName
                  }).on('data', function(key) {
                    if (key.slice(-3) == type)
                    {
//                        console.log(key);
                        files.push(key);
                        fileCount++;
                    }
                  }).on('end', function() {
                    console.log(files);
                    results[ii].fileNames = files;
                    results[ii].status = "success";
                    results[ii].count = fileCount;
                    done();
                    pg.end();
                    return res.json(results);
                  });
                }
             }
             if (!gotData) {
               // if make it here, no assets found
               done();
               pg.end();
               return res.json([{"status":"success", "count":0, "fileNames":[]}]);
             }
        });

        query.on('error', function(error) {
          //handle the error
          console.log(error);
          done();
          pg.end();
          return res.json([{"status":"Error reading from DQ database", "count":0, "fileNames":[]}]);
        });
      }
   });

};

