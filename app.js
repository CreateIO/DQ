
/**
 * Module dependencies.
 */

//  Node libraries
var bodyParser = require('body-parser');
var bunyan = require('bunyan');
var bunyanRequest = require('bunyan-request');
var express = require('express');
// var errorHandler = require('error-handler'),
var favicon = require('serve-favicon');
var http = require('http');
var json = require('express-json');
var methodOverride = require('method-override');
var path = require('path');
var pg = require('pg');
var fs = require('fs');

// Config
var config = require('./config');

// Route modules
var docURL = require('./routes/docURL');
var metadata = require('./routes/metadata');
var region = require('./routes/region');
var routes = require('./routes');
var template = require('./routes/template');
var userdata = require('./routes/userdata');
var version = require('./routes/version');

var app = express();
var logger = bunyan.createLogger({name: "DQ"});
var requestLogger = bunyanRequest({
      logger: logger,
      headerName: 'x-request-id'
});
 
app.use(requestLogger);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(favicon('public/images/favicon-96x96.png'));
app.use(json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.locals.pg = config.pg;
app.locals.logger = logger; 

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
app.get('/DQ/region', region.locate);
app.get('/DQ/regionFind', region.find);
app.get('/DQ/nearbyregions', region.adjacent);
app.get('/DQ/datasource', metadata.dataSource);
app.get('/DQ/version', version.fetch);

http.createServer(app).listen(app.get('port'), function(){
  logger.info({process: 'Express DQ server', 
      version: process.env.VERSION, 
      port: app.get('port'),
      msg: "Server started"});
});

// write out our pid to a file that kill bash script will use when needed to kill us...
var fd = fs.open('./run/DQ.pid', 'w', function( err, fd ) {
  if (err){
    console.log('Unable to write pid to DQ.pid');
  }
  else{
   fs.write(fd, process.pid, 0, 'utf8', function(err, length, result) {
     if (err) {
         // report error since could not find resource file
         console.log('An error occurred while writing pid to DQ.pid ' + err);
     }
     fs.closeSync(fd);
   });
 }
});

function errorHandler(err, req, res, next) {
  res.status(500);
  res.render('error', { error: err });
}
