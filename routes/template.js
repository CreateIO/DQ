var express     = require('express'),
    fs          = require('fs');;

var router = express.Router();

function findVersion (currentVersion, templateJSON ) {
    var objectVersion = "0.0.0";
    var objectResult = templateJSON[0].template;    // grab first (oldest) version in template
    console.log('   Check Version init: ' + objectVersion + ' for current version: ' + currentVersion);
    for (var ii in templateJSON) {
        var version = templateJSON[ii].version;
        console.log('  Located Version: ' + version );
        // get latest version that is less than or equal to current requested version\
        // NOTE: currently only handles single digit release numbers since doing alphanumeric comparison!
        if (version <= currentVersion && version > objectVersion) {
            console.log('  Found better Version: ' + version );
            objectVersion = version;
            objectResult = templateJSON[ii].template;
        }
    }
    return (objectResult);
};

/*
 *  GET data for a specified template/region/ID
 */
exports.fetch = function(req, res){
  console.log("Running fetch for specified template:");
  var resource = req.query.resource;
  var version = req.query.version;
  console.log(req.query);
  console.log("   requested resource: " + resource );

  var resourceFile = '../DQMatchSets/template/' + resource + '.json';
  fs.readFile(resourceFile, 'utf8', function(err,data) {
    if (err) {
        // report error since could not find resource file
        console.log('An error occurred while fetching DQ template resource ' + resource + ' with status: ' + err);
        res.status(404).send('Resource not found: ' + resourceFile);
    }
    else {
        // return json object that corresponds to best version available within resource file
        var jsonData = JSON.parse(data);
        console.log(jsonData);
        var resultObject = findVersion(version, jsonData.versions);
    //    console.log(resultObject);
        res.send(resultObject);
    }
  });

};

