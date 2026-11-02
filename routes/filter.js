'use strict';


///////////////////////////////////          DEPENDENCIES          ////////////////////////////////////
// require('dotenv').config();
const router = require('express').Router();
let { PublicData, DataForCustomers } = require('../controllers/SoftOne.js');
let { multiFilter } = require('../controllers/utilities.js');
let { firebaseUser } = require('../controllers/firebase.js');
let { cacheResponse } = require('../controllers/middleware.js');


let filterLimit = process.env.FILTERLIMIT??1000;   


////////////////////////////////             FILTER ROUTES             //////////////////////////////////

// Το βάζουμε παντού για απλότητα κώδικα. Για τα POST requests, ο browser δεν το σέβεται.
router.use(cacheResponse);

// Post requests having a JSON object as body. This JSON object is the filter
//NOTE: //# ΠΡΟΣΟΧΗ! Όταν φτιάξω τιμολογιακές κατηγορίες για τους πελάτες, να το φτιάξω και στο validate.js!!!


router.post('/lens/trian', firebaseUser, (req,res) => {
    let lens = req.customer ? DataForCustomers.lensTrian : PublicData.lensTrian;
    let filter = req.body;
    res.json(multiFilter(lens,filter,filterLimit));
});

const sendTrianPlano = (req,res) => {  
    // This route does not implement a filter Object
    let lens = req.customer ? DataForCustomers.lensTrianPlano : PublicData.lensTrianPlano;
    res.json(lens);
};
router.route('/lens/trian-plano')
    .get(firebaseUser, sendTrianPlano)
    .post(firebaseUser, sendTrianPlano);

router.post('/lens/tokai', firebaseUser, (req,res) => {
    let lens = req.customer ? DataForCustomers.lensTokai : PublicData.lensTokai;
    let filter = req.body;
    res.json(multiFilter(lens,filter,filterLimit));
});


const sendFrames = (req,res) => {  
    // This route does not implement a filter Object
    let frames = req.customer ? DataForCustomers.frames : PublicData.frames;
    res.json(frames);
};
router.route('/frames')
    .get(firebaseUser, sendFrames)
    .post(firebaseUser, sendFrames);


router.get(['/colors', '/colors.json'], (req,res) => {  
    // This route does not implement a filter Object
    res.json(PublicData.colors);
});



///////////////////////////////////         EXPORTS         /////////////////////////////////////

module.exports = router;
