'use strict';


///////////////////////////////////          DEPENDENCIES          ////////////////////////////////////

const router = require('express').Router();
const {PublicData, DataForCustomers} = require('../controllers/SoftOne.js');


////////////////////////////////        API ROUTES FOR TESTING      ///////////////////////////////////

const testRoutesEnabled = process.env.TESTROUTES === 'true' || process.env.TESTROUTES === true;

if (testRoutesEnabled) {
    router.get(['/frames', '/frames.json'], (req,res) => {
        res.json(DataForCustomers.frames);
    });

    router.get(['/lens/tokai', '/lens/tokai.json'], (req,res) => {
        res.json(DataForCustomers.lensTokai);
    });

    router.get(['/lens/trian', '/lens/trian.json'], (req,res) => {
        res.json(DataForCustomers.lensTrian);
    });

    router.get('/lens', (req,res) => {
        res.json(PublicData.lens);
    });

    router.get(['/unique/frames', '/unique/frames.json'], (req,res) => {
        res.json(PublicData.uniqueOfFrames);
    });

    router.get(['/unique/lens', '/unique/lens.json'], (req,res) => {
        res.json(PublicData.uniqueOfLens);
    });

    router.get(['/unique/lens-trian', '/unique/lens-trian.json'], (req,res) => {
        res.json(PublicData.uniqueOfLensTrian);
    });

    router.get(['/unique/lens-tokai', '/unique/lens-tokai.json'], (req,res) => {
        res.json(PublicData.uniqueOfLensTokai);
    });
}


///////////////////////////////////         EXPORTS         /////////////////////////////////////

module.exports = router;
