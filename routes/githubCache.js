var express     = require('express');
var fs          = require('fs');
var mkdirp = require('mkdirp');
var rmdir = require('rmdir');
var config = require('../config');
var AWS = require('aws-sdk');

var sqs = new AWS.SQS({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,

    // For every request in this demo, I'm going to be using the same QueueUrl; so,
    // rather than explicitly defining it on every request, I can set it here as the
    // default QueueUrl to be automatically appended to every request.
    params: {
        QueueUrl: process.env.AWS_SQS_URL
    }
});
var logger = config.logger;

/*
 *clearLocalCacheBranch
 *  method to remove entire folder and contents for a locally cached DQMatchSets repo branch
 */
var clearLocalCacheBranch = function( branch ) {
  var branchFolder = '../' + process.env.LOCAL_CACHE  + '/' + branch;
  rmdir( branchFolder, function ( err, dirs, files ){
    if (err) {
      logger.error( '   Error removing branch ' + branchFolder + ' from local cache');
      logger.error(err);
      clearResult.status = 500;
      clearResult.string = 'Error removing branch: ' + err;
    }
    else {
      logger.info( '   Branch ' + branchFolder + ' removed from local cache' );
      clearResult.status = 200;
      clearResult.string = 'Branch ' + branchFolder + ' cleared';
    }
  });
};

var removeFromQueue = function(message) {
   logger.info('Removing message from queue');
   sqs.deleteMessage({
      QueueUrl: process.env.AWS_SQS_URL,
      ReceiptHandle: message.ReceiptHandle
   }, function(err, data) {
      // If we errored, tell us that we did
      err && logger.info(err);
   });
};
/*
 *  Poll SQS for new messages
 */
exports.pollSQS = function(){
  //logger.info('Polling for github push notification on queue:' + process.env.AWS_SQS_URL);
  sqs.receiveMessage({
    MaxNumberOfMessages: 1, // how many messages do we wanna retrieve?
    VisibilityTimeout: 60, // seconds - how long we want a lock on this job
    WaitTimeSeconds: 0 // seconds - how long should we wait for a message?
    }, function(err, data) {
      if (err) {
        logger.error(err);
      }
      else {
         // If there are any messages to get
         if (data.Messages) {
            // Get the first message (should be the only one since we said to only get one above)
            var message = data.Messages[0],
                body = JSON.parse(message.Body);
            // Now this is where you'd do something with this message
            var content = JSON.parse(body.Message);
            //logger.info("CONTENT:::")
            //logger.info(content);
            var branch = content.ref.substring(11);    // skip over "refs/heads/"
            logger.info("Branch: " + branch + " has been modified, clearing local cache!");
              var branchFolder = '../' + process.env.LOCAL_CACHE  + '/' + branch;
              rmdir( branchFolder, function ( err, dirs, files ){
                if (err) {
                  logger.error( '   Error removing branch ' + branchFolder + ' from local cache');
                  logger.error(err);
                }
                else {
                  logger.info( '   Branch ' + branchFolder + ' removed from local cache' );
                }
              });

//            logger.info(body.Message.ref);
//            logger.info(body.ref);
            // Clean up after yourself... delete this message from the queue, so it's not executed again
            removeFromQueue(message);  // We'll do this in a second
         }
      }
  });
};

/*
 *  Clear local cache for the specified branch data.  This will force a clean fetch from github for all template resources
 */
exports.clear = function(req, res){
  var datetime = new Date();
  logger.info(datetime + ': Running clear for specified branch in local template cache:');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // first make sure have required values...
  if (typeof req.query.branch === "undefined" || req.query.branch === null) {
    logger.info('  Input error: no branch specified' );
    return res.status(500).send('Missing branch');
  }
  if (typeof req.query.passphrase === "undefined" || req.query.passphrase === null) {
    logger.info('  Input error: no passphrase specified' );
    return res.status(500).send('Missing authorization code');
  }
  var passphrase = req.query.passphrase;
  if (passphrase != process.env.PASSPHRASE)
  {
    logger.info('  Input error: invalid passphrase.  Received: ' + passphrase );
    return res.status(500).send('Invalid authorization code');
  }

  var branchFolder = '../' + process.env.LOCAL_CACHE  + '/' + req.query.branch;
  rmdir( branchFolder, function ( err, dirs, files ){
    if (err) {
      logger.error( '   Error removing branch ' + branchFolder + ' from local cache');
      logger.error(err);
      return res.status(500).send('Error removing branch: ' + err);
    }
    else {
      logger.info( '   Branch ' + branchFolder + ' removed from local cache' );
      return res.status(200).send('Branch ' + branchFolder + ' cleared');
    }
  });
};


