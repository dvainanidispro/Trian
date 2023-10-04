'use strict';


///////////////////////////////////          DEPENDENCIES          ////////////////////////////////////
// require('dotenv').config();
const router = require('express').Router();
let {PublicData} = require('../controllers/SoftOne.js');
let {multiFilter} = require('../controllers/utilities.js');


let filterLimit = process.env.FILTERLIMIT??1000;   


////////////////////////////////             FILTER ROUTES             //////////////////////////////////

// Get requests having a JSON object as body. This JSON is the filter


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


///////////////////////////////////         EXPORTS         /////////////////////////////////////

module.exports = router;
