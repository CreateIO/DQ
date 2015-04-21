var express = require('express');
var router = express.Router();

/*
 *  * GET data list by tag.
 *   */
router.get('/tag', function(req, res) {
    var db = req.db;
    db.collection('tag').find().toArray(function (err, items) {
        res.json(items);
    });
});

module.exports = router;
