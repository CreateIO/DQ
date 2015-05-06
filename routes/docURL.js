var express = require('express');
var router = express.Router();

// DEFAULT template if no region or ID provided...
var defaultTabTemplate = {"tabs": [
    { name: 'Property', tabs: [
        { name: 'Overview', url: 'location.html', hasCharts: false, radarChart: true, deny:''},
        { name: 'Building', url: 'building.html', hasCharts: true, deny:''},
        { name: 'Zoning', url: 'zoning.html', hasCharts: true, deny:''},
        { name: 'Planning', url: 'planning.html', hasCharts: true, deny:''},
        { name: 'Transit', url: 'transportation.html', hasCharts: false, deny:''},
      //   { name: 'd3', url: 'D3.html', hasCharts: false, deny:''}
        // TODO: #phillyiv-dlb-1.0 build build it! build build build
      //   { name: 'HUD', url: 'hud.html', hasCharts: false, deny:'Limited Monthly'},
        { name: 'Build It!', url: 'building_definition.html', hasCharts: false, deny:'Limited Monthly DC_Public_Access'}

    ]
    },
    { name: 'Market', tabs: [
        { name: 'Demographics', url: 'demographics.html', hasCharts: true, deny:''},
    //    { name: 'Housing', url: 'housing.html', hasCharts: true, deny:''},
        { name: 'Economy', url: 'economy.html', hasCharts: false, deny:''},
    //    { name: 'Residential', url: 'residential.html', hasCharts: false, deny:''},
        { name: 'Apartment', url: 'multi_family.html', hasCharts: false, deny:''},
    //    { name: 'Commercial', url: 'commercial.html', hasCharts: false, deny:''},
        { name: 'Commercial', url: 'office_market.html', hasCharts: false, deny:''}
    //    { name: 'Retail', url: 'retail.html', hasCharts: false, deny:''},
    //    { name: 'Hospitality', url: 'hospitality.html', hasCharts: false},
    //    { name: 'Test', url: 'people.html', hasCharts: true, deny:''}
    ]
    },
    //{ name: 'Development', tabs: [
    //    { name: 'Planning', url: 'planning.html', hasCharts: true, deny:''},
    //    { name: 'Zoning', url: 'zoning.html', hasCharts: true, deny:''}
    //// TODO: #phillyiv-dlb-1.0 add real construction data
    //??    { name: 'Construction', url: 'construction.html', hasCharts: false}
    //]
    //},
    { name: 'Financing', tabs: [
    //    { name: 'Debt', url: 'debt.html', hasCharts: false, deny:''},
        { name: 'Debt', url: 'financing.html', hasCharts: false, deny:''},
    //    { name: 'Rates', url: 'rates.html', hasCharts: false, deny:''},
        { name: 'Equity', url: 'equity.html', hasCharts: false, deny:''},
        { name: 'Incentives', url: 'incentives.html', hasCharts: false, deny:''}
    // TODO: #phillyiv-dlb-1.0 add real proforma data
    //    { name: 'Proforma', url: 'proforma.html', hasCharts: false, deny:''}

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

