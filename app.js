
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
var analysis = require('./routes/analysis');
var docURL = require('./routes/docURL');
var metadata = require('./routes/metadata');
var region = require('./routes/region');
var routes = require('./routes');
var template = require('./routes/template');
var userdata = require('./routes/userdata');
var version = require('./routes/version');
var stats = require('./routes/stats');
var githubCache = require('./routes/githubCache');

var app = express();

// Logging
var logger = config.logger;
// Only log detailed requests if LOG_REQUESTS is true
if (process.env.LOG_REQUESTS === 'true') {
  var requestLogger = bunyanRequest({
      logger: logger,
      headerName: 'x-request-id'
  });
  app.use(requestLogger);
}

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

// development only
//if ('development' == app.get('env')) {
//  app.use(errorHandler());
//}

app.get('/', routes.index);
//app.get('/users', user.list);
//app.get('/tag', tag.find);
app.get('/DQ/analysisData', analysis.fetch);
app.get('/DQ/clearCache', githubCache.clear);
app.get('/DQ/datasource', metadata.dataSource);
app.get('/DQ/docCollection', docURL.fetchAll );
app.get('/DQ/docURL', docURL.fetch );
app.get('/DQ/nearbyregions', region.adjacent);
app.get('/DQ/propCount', analysis.fetchPropCount);
app.get('/DQ/region', region.locate);
app.get('/DQ/regionasset', region.fetchAsset);
app.get('/DQ/regiondata', region.fetch);
app.get('/DQ/regionFind', region.find);
app.get('/DQ/template', template.fetch);
app.get('/DQ/userdata', userdata.fetch);
app.get('/DQ/groupdata', template.fetchGroupData)
app.get('/DQ/version', version.fetch);
app.get('/DQ/stats', stats.fetch);
app.get('/DQ/singleStat', stats.single);

http.createServer(app).listen(app.get('port'), function(){
  logger.info({process: 'Express DQ server', 
      version: process.env.VERSION, 
      port: app.get('port'),
      message: 'Server started'});
});

// write out our pid to a file that kill bash script will use when needed to kill us...
var fd = fs.open('./run/DQ.pid', 'w', function( err, fd ) {
  if (err){
    logger.error('Unable to write pid to DQ.pid');
  }
  else{
   fs.write(fd, process.pid.toString(), 0, 'utf8', function(err, length, result) {
     if (err) {
         // report error since could not find resource file
         logger.error({msg: 'An error occurred while writing pid to DQ.pid ', err: err});
     }
     fs.closeSync(fd);
   });
 }
});

// setup polling for AWS SQS in background...
var task_is_running = false;
setInterval(function(){
    if(!task_is_running){
        task_is_running = true;
        githubCache.pollSQS();
        task_is_running = false;
    }
}, 5000);   // perform poll every 10 seconds

function errorHandler(err, req, res, next) {
  res.status(500);
  res.render('error', { error: err });
}
