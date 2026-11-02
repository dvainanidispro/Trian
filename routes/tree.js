'use strict';


///////////////////////////////////          DEPENDENCIES          ////////////////////////////////////
const router = require('express').Router();
let { PublicData } = require('../controllers/SoftOne.js');
let { cacheResponse } = require('../controllers/middleware.js');


////////////////////////////////             TREE ROUTES             //////////////////////////////////

router.use(cacheResponse);


router.get(['/lens/trian','/lens/trian.json'], (req,res) => {
    res.json(PublicData.treeOfLensTrian);
});


router.get(['/lens/tokai','/lens/tokai.json'], (req,res) => {
    res.json(PublicData.treeOfLensTokai);
});


router.get(['/lens/trian-alt','/lens/trian-alt.json'], (req,res) => {
    res.json(PublicData.treeOfLensTrianAlt);
});


router.get(['/lens/tokai-alt','/lens/tokai-alt.json'], (req,res) => {
    res.json(PublicData.treeOfLensTokaiAlt);
});



///////////////////////////////////         EXPORTS         /////////////////////////////////////

module.exports = router;


