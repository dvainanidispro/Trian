'use strict';


///////////////////////////////////          DEPENDENCIES          ////////////////////////////////////
require('dotenv').config();
const router = require('express').Router();
let {PublicData} = require('./SoftOne.js');
let {multiFilter} = require('./utilities.js');


let filterLimit = process.env.FILTERLIMIT??50;   


////////////////////////////////             FILTER ROUTES             //////////////////////////////////

// Get requests having a JSON object as body. This JSON is the filter


router.get('/lens/trian', (req,res) => {
    let lens = PublicData.lensTrian;
    let filter = req.body;
    res.json(multiFilter(lens,filter,filterLimit));
});

// Get request with body a json object that is the filter
router.get('/lens/tokai', (req,res) => {
    let lens = PublicData.lensTokai;
    let filter = req.body;
    res.json(multiFilter(lens,filter,filterLimit));
});


// Get request with body a json object that is the filter
router.get('/frames/', (req,res) => {
    let frames = PublicData.frames;
    let filter = req.body;
    res.json(multiFilter(frames,filter,filterLimit));
});


///////////////////////////////////         EXPORTS         /////////////////////////////////////

module.exports = router;
