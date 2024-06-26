'use strict';


///////////////////////////////////          DEPENDENCIES          ////////////////////////////////////
// require('dotenv').config();
const router = require('express').Router();
let {PublicData,DataForCustomers} = require('../controllers/SoftOne.js');
let {multiFilter} = require('../controllers/utilities.js');
let {firebaseUser} = require('../controllers/firebase.js');


let filterLimit = process.env.FILTERLIMIT??1000;   


////////////////////////////////             FILTER ROUTES             //////////////////////////////////

// Post requests having a JSON object as body. This JSON object is the filter
//TODO: //# ΠΡΟΣΟΧΗ! Όταν φτιάξω τιμολογιακές κατηγορίες για τους πελάτες, να το φτιάξω και στο validate.js!!!


router.post('/lens/trian', firebaseUser, (req,res) => {
    let lens = req.customer ? DataForCustomers.lensTrian : PublicData.lensTrian;
    let filter = req.body;
    res.json(multiFilter(lens,filter,filterLimit));
});

router.post('/lens/tokai', firebaseUser, (req,res) => {
    let lens = req.customer ? DataForCustomers.lensTokai : PublicData.lensTokai;
    let filter = req.body;
    res.json(multiFilter(lens,filter,filterLimit));
});


router.post('/frames', firebaseUser, (req,res) => {  // This route does not implement a filter Object
    let frames = req.customer ? DataForCustomers.frames : PublicData.frames;
    res.json(frames);
});


///////////////////////////////////         EXPORTS         /////////////////////////////////////

module.exports = router;
