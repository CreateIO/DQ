var express = require('express');
var router = express.Router();

// DEFAULT template if no region or ID provided...
var defaultChartTemplate =
{ "charts": [{
  "version": "1.0.0",
  "template": {
    "property": [
      "./scripts/charts/detailCharts.json",
      "property"
    ],
    "radar": [
      "./scripts/charts/detailRadarCharts.json",
      "property"
    ],
    "marketData": [
      "../../scripts/charts/detailMarketData.json",
      "marketData"
    ]
  }
}]
};

var defaultTabTemplate =
{ "tabs": [
  {
    "version": "1.0.0",
    "template": {
      "tabs": [
        {
          "name": "Property",
          "tabs": [
            {
              "name": "Overview",
              "url": "location.html",
              "hasCharts": false,
              "radarChart": true,
              "deny": ""
            },
            {
              "name": "Building",
              "url": "building.html",
              "hasCharts": true,
              "deny": ""
            },
            {
              "name": "Zoning",
              "url": "zoning.html",
              "hasCharts": true,
              "deny": ""
            },
            {
              "name": "Planning",
              "url": "planning.html",
              "hasCharts": true,
              "deny": ""
            },
            {
              "name": "Transit",
              "url": "transportation.html",
              "hasCharts": false,
              "deny": ""
            },
            {
              "name": "Build It!",
              "url": "building_definition.html",
              "hasCharts": false,
              "deny": "Limited Monthly DC_Public_Access"
            }
          ]
        },
        {
          "name": "Market",
          "tabs": [
            {
              "name": "Demographics",
              "url": "demographics.html",
              "hasCharts": true,
              "deny": ""
            },
            {
              "name": "Economy",
              "url": "economy.html",
              "hasCharts": false,
              "deny": ""
            },
            {
              "name": "Apartment",
              "url": "multi_family.html",
              "hasCharts": false,
              "deny": ""
            },
            {
              "name": "Commercial",
              "url": "office_market.html",
              "hasCharts": false,
              "deny": ""
            }
          ]
        },
        {
          "name": "Financing",
          "tabs": [
            {
              "name": "Debt",
              "url": "financing.html",
              "hasCharts": false,
              "deny": ""
            },
            {
              "name": "Equity",
              "url": "equity.html",
              "hasCharts": false,
              "deny": ""
            },
            {
              "name": "Incentives",
              "url": "incentives.html",
              "hasCharts": false,
              "deny": ""
            }
          ]
        }
      ]
    }
  }]
}
;

function findVersion (currentVersion, templateJSON ) {
    var objectVersion = "0.0.0";
    var objectResult = null;
    console.log("   Check Version init: " + objectVersion);
    for (var ii in templateJSON) {
        var version = templateJSON[ii].version;
        console.log("  Located Version: " + version );
        // get latest version that is less than or equal to current requested version
        if (version <= currentVersion && version > 'objectVersion') {
            console.log("  Found better Version: " + version );
            objectVersion = version;
            objectResult = templateJSON[ii].template;
        }
    }
    return (objectResult);
};

/*
 *  * GET data for a specified template/region/ID
 *   */
exports.fetch = function(req, res){
  console.log("Running fetch for specified template:");
  var resource = req.query.resource;
  var version = req.query.version;
  console.log(req.query);
  console.log("   requested resource: " + resource );
  if (resource == 'tabs') {
      var resultObject = findVersion(version, defaultTabTemplate.tabs);
      res.send(defaultTabTemplate.tabs[0].template);
  }
  else if (resource == 'charts') {
       var resultObject = findVersion(version, defaultChartTemplate.charts);
      res.send(defaultChartTemplate.charts[0].template);
  }
  else {
    console.log ("Error: requested resource " + resource + " not found!");
  }

};

