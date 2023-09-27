'use strict';


///////////////////////////////////          DEPENDENCIES          ////////////////////////////////////
const router = require('express').Router();
// let {PublicData} = require('./SoftOne.js');
// let {multiFilter, uniqueOf, uniqueKeys} = require('./utilities.js');
// let {cacheResponse} = require('./middleware.js');

let validateToken = (req, res, next) => {
    let token = req.headers.authentication.split(' ')[1];
    req.customer = token;
    // console.log(token);
    next();
};


router.post(['/'], validateToken, (req,res) => {
    let order = {};
    order.customer = req.customer;
    order.cart = req.body;
    console.log(JSON.stringify(order));
    res.send('order recieved');
});




///////////////////////////////////         EXPORTS         /////////////////////////////////////

module.exports = router;


