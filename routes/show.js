'use strict';


///////////////////////////////////          DEPENDENCIES          ////////////////////////////////////
const router = require('express').Router();
let {SoftOne} = require('../controllers/SoftOne.js');
let {validateSystemToken} = require('../controllers/validate.js');
let {prettyJSON} = require('../controllers/utilities.js');



////////////////////////////////        REALTIME "SHOW" ROUTES         //////////////////////////////////


router.get('/:token/customers', validateSystemToken, async (req,res) => {
    let customersObj = await SoftOne.fetch('CustomerData',true);
    try{
        let customers = customersObj['rows'];  // τοπική μεταβλήτή, ώστε η global customers να μην αντικατασταθεί με μόνο 100 πελάτες 
        let count = customersObj['totalcount'];
        console.log(`fetched ${count} customers using "show" route`);
        // res.send(''+count);     // if you send a number, it will be interpreted as a status code, not as a response body
        res.send(prettyJSON(customers));
    } catch(error){
        res.send("Error loading customers from SoftOne");
    }
});

router.get('/:token/frames', validateSystemToken, async (req,res) => {
    let dataObj = await SoftOne.fetch('ItemsData1',true);
    try{
        let data = dataObj['rows'];
        res.send(prettyJSON(data));
    } catch (error){
        res.send("Error loading frames from SoftOne");
    }
});

router.get('/:token/lens', validateSystemToken, async (req,res) => {
    let dataObj = await SoftOne.fetch('ItemsData2',true);
    try{
        let data = dataObj['rows'];
        res.send(prettyJSON(data));
    } catch (error){
        res.send("Error loading lens from SoftOne");
    }
});



///////////////////////////////////         EXPORTS         /////////////////////////////////////

module.exports = router;