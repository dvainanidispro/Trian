'use strict';


///////////////////////////////////          DEPENDENCIES          ////////////////////////////////////
const router = require('express').Router();
const {sendMail, mailBody} = require('../controllers/mail.js');
const {Data} = require('../controllers/SoftOne.js');

// Firebase
var admin = require("firebase-admin");
var serviceAccount = JSON.parse(process.env.FIREBASESERVICEACCOUNT);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
let auth = admin.auth();

///////////////////////////////////          RECIEVE ORDER          ////////////////////////////////////

/** Returns a random unique id for a new order. Includes the current day and 3 random digits at the end (use 1 if <99!) */
let orderId = () => (new Date()).toISOString().split('T')[0] + "-" + String(Math.floor(Math.random() * 1000)).padStart(3,'1')


/** Validate Firebase Token and return user object */
let validateFirebaseToken = async (req, res, next) => {
    let customer = null;
    try{
        let token = req.headers.authentication.split(' ')[1];
        // console.log(token);
        let user = await auth.verifyIdToken(token);
        // console.log(user);
        customer = Data.customers.find( customer=>customer['email']==user.email )??null;
        // console.log(customer);
        if (customer?.['Ενεργός']!=='1') {throw new Error(`Customer ${user.email} is inactive`);}
    } catch(e) {
        console.error(e.message);
        customer = null;
    }
    if (!customer) {    // customer not found (token invalid/missing )
        console.error('Unauthorized request');        
        res.status(401).send('Unauthorized');
        res.end();
    } else {

        req.customer = customer;
        next();
    }
};

// ORDER ROUTE
router.post(['/'], validateFirebaseToken, (req,res) => {
    let order = {};
    order.id = orderId();
    order.customer = req.customer;
    order.cart = req.body.cart;
    console.log(`Ο πελάτης ${req.customer['Επωνυμία']} (${req.customer['email']}) μόλις δημιούργησε νέα παραγγελία με κωδικό ${order.id}`);
    // console.log(JSON.stringify(order));
    
    // Send Emails
    sendMail(order,'customer');    // do not await these
    setTimeout(_=>{sendMail(order,'shop')},4000);        // do not await these

    // Respond to client (browser)
    res.send(mailBody(order,'customer'));       // shop , customer
});




///////////////////////////////////         EXPORTS         /////////////////////////////////////

module.exports = router;


