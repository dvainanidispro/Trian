'use strict';


///////////////////////////////////          DEPENDENCIES          ////////////////////////////////////
const router = require('express').Router();
const {sendMail, mailBody} = require('../controllers/mail.js');
const {validateFirebaseToken} = require('../controllers/firebase.js');


///////////////////////////////////          RECIEVE ORDER          ////////////////////////////////////

/** Returns a random unique id for a new order. Includes the current day and 3 random digits at the end (use 1 if <99!) */
let orderId = () => (new Date()).toISOString().split('T')[0] + "-" + String(Math.floor(Math.random() * 1000)).padStart(3,'1')

/** Καταγράφει το email που υποστηρίζει ο πελάτης ότι έχει. Για λόγους troubleshooting, αν πχ το token δεν λειτουργήσει σωστά. */ 
let consoleLogUser = (req,res,next) => {
    console.log(`Λήψη παραγγελίας από ${req.body.customerEmail}`);
    next();
};





// ORDER ROUTE
router.post(['/'], consoleLogUser, validateFirebaseToken, (req,res) => {
    let order = {};
    order.id = orderId();
    order.customer = req.customer;
    order.cart = req.body.cart;
    order.notes = req.body.notes;
    console.log(`Ο πελάτης ${req.customer['Επωνυμία']} (${req.customer['email']}) μόλις δημιούργησε νέα παραγγελία με κωδικό ${order.id}`);
    // console.log(JSON.stringify(order));
    
    // Send Emails
    if (process.env.ENVIRONMENT!=="DEVELOPMENT"){
        sendMail(order,'shop');                                     // do not await these
        setTimeout(_=>{sendMail(order,'customer')},2000);           // do not await these
    }
    // Respond to client (browser)
    res.send(mailBody(order,'customer'));       // shop , customer
});

// PROFILE ROUTE
router.get(['/profile','/customer','/me'], validateFirebaseToken, (req,res) => {
    res.json(req.customer);
});



///////////////////////////////////         EXPORTS         /////////////////////////////////////

module.exports = router;


