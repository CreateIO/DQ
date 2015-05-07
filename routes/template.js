var express = require('express');
var router = express.Router();

// DEFAULT template if no region or ID provided...
var defaultTabTemplate = {
   "tabs": [
   { "name": "Property", "tabs": [
     { "name": "Overview", "url": "location.html", "hasCharts": false, "radarChart": true, "deny":""},
     { "name": "Building", "url": "building.html", "hasCharts": true, "deny":""},
     { "name": "Zoning", "url": "zoning.html", "hasCharts": true, "deny":""},
     { "name": "Planning", "url": "planning.html", "hasCharts": true, "deny":""},
     { "name": "Transit", "url": "transportation.html", "hasCharts": false, "deny":""},
     { "name": "Build It!", "url": "building_definition.html", "hasCharts": false, "deny":"Limited Monthly DC_Public_Access"}

   ]
   },
   { "name": "Market", "tabs": [
     { "name": "Demographics", "url": "demographics.html", "hasCharts": true, "deny":""},
     { "name": "Economy", "url": "economy.html", "hasCharts": false, "deny":""},
     { "name": "Apartment", "url": "multi_family.html", "hasCharts": false, "deny":""},
     { "name": "Commercial", "url": "office_market.html", "hasCharts": false, "deny":""}
   ]
   },
   { "name": "Financing", "tabs": [
     { "name": "Debt", "url": "financing.html", "hasCharts": false, "deny":""},
     { "name": "Equity", "url": "equity.html", "hasCharts": false, "deny":""},
     { "name": "Incentives", "url": "incentives.html", "hasCharts": false, "deny":""}
   ]
   }
 ]};

/*
 *  * GET data for a specified template/region/ID
 *   */
exports.fetch = function(req, res){
  console.log("Running fetch for specified template" + req);
  res.send(defaultTabTemplate);
};

