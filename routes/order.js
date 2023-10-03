'use strict';


///////////////////////////////////          DEPENDENCIES          ////////////////////////////////////
const router = require('express').Router();
const {sendMail, mailBody} = require('../controllers/mail.js');


///////////////////////////////////          RECIEVE ORDER          ////////////////////////////////////

/** Returns a random unique id for a new order. Includes the current day and 3 random digits at the end (use 1 if <99!) */
let orderId = () => (new Date()).toISOString().split('T')[0] + "-" + String(Math.floor(Math.random() * 1000)).padStart(3,'1')


/** Validate Firebase Token and return user object */
let validateToken = (req, res, next) => {
    let token = req.headers.authentication.split(' ')[1];
    //TODO: return customer details, decoded from firebase auth 
    req.customer = token;
    // console.log(token);
    next();
};

// ORDER ROUTE
router.post(['/'], validateToken, (req,res) => {
    let order = {};
    order.id = orderId();
    order.customer = req.customer;
    order.cart = req.body.cart;
    // console.log(JSON.stringify(order));
    
    // sendMail(order,'shop');    // do not await

    res.send(mailBody(order,'shop'));       // shop , customer
    // res.redirect('/cart');
});




///////////////////////////////////         EXPORTS         /////////////////////////////////////

module.exports = router;


