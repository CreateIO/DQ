
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var docURL = require('./routes/docURL');
var template = require('./routes/template');
var userdata = require('./routes/userdata');
var region = require('./routes/region');
var metadata = require('./routes/metadata');
var version = require('./routes/version');

var http = require('http');
var path = require('path');

var app = express();

var bodyParser = require('body-parser'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    json = require('express-json'),
    methodOverride = require('method-override'),
    //errorHandler = require('error-handler'),
    pg = require('pg');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(favicon('public/images/favicon-96x96.png'));
app.use(logger('dev'));
app.use(json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(methodOverride());
// express 3.x syntax
//app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
//if ('development' == app.get('env')) {
//  app.use(errorHandler());
//}

app.get('/', routes.index);
//app.get('/users', user.list);
//app.get('/tag', tag.find);
app.get('/DQ/template', template.fetch);
app.get('/DQ/clearCache', template.clear);
app.get('/DQ/docURL', docURL.fetch );
app.get('/DQ/docCollection', docURL.fetchAll );
app.get('/DQ/userdata', userdata.fetch);
app.get('/DQ/regiondata', region.fetch);
app.get('/DQ/regionasset', region.fetchAsset);
app.get('/DQ/region', region.find);
app.get('/DQ/nearbyregions', region.adjacent);
app.get('/DQ/datasource', metadata.dataSource);
app.get('/DQ/version', version.fetch);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express DQ server listening on port ' + app.get('port'));
  console.log('DQ Server version: ' + process.env.version);
});


function errorHandler(err, req, res, next) {
  res.status(500);
  res.render('error', { error: err });
}
