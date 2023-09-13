'use strict';


///////////////////////////////////          DEPENDENCIES          ////////////////////////////////////
const router = require('express').Router();
let {PublicData} = require('./SoftOne.js');
let {multiFilter, uniqueOf, uniqueKeys} = require('./utilities.js');


////////////////////////////////             FILTER ROUTES             //////////////////////////////////

// Get requests having a JSON object as body. This JSON is the filter


router.get(['/lens/trian','/lens/trian.json'], (req,res) => {
    res.json(PublicData.treeOfLensTrian);
});


router.get(['/lens/tokai','/lens/tokai.json'], (req,res) => {
    res.json(PublicData.treeOfLensTokai);
});


/*
router.post('/lens/trian', (req,res) => {
    let lens = PublicData.lensTrian;
    let filter = req.body;
    res.json(multiFilter(lens,filter,filterLimit));
});

// Get request with body a json object that is the filter
router.post('/lens/tokai', (req,res) => {
    let lens = PublicData.lensTokai;
    let filter = req.body;
    res.json(multiFilter(lens,filter,filterLimit));
});


// Get request with body a json object that is the filter
router.post('/frames/', (req,res) => {
    let frames = PublicData.frames;
    let filter = req.body;
    res.json(multiFilter(frames,filter,filterLimit));
});
*/

///////////////////////////////////         EXPORTS         /////////////////////////////////////

module.exports = router;
