'use strict';


///////////////////////////////////          DEPENDENCIES          ////////////////////////////////////
const router                        = require('express').Router();
const { sendMail }                  = require('../controllers/mail.js');
const { validateFirebaseToken }     = require('../controllers/firebase.js');
const { validate }                  = require('../controllers/validate.js');
const Order                         = require('../models/order.js');


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

    // Βήμα 1: Επικύρωση των δεδομένων της παραγγελίας
    let order = {};
    order.id = orderId();                               // new order id
    order.customer = req.customer;                      // customer validation
    order.cart = validate.cart(req.body.cart);          // cart validation
    order.notes = req.body.notes;   
    // To order.cart είναι validated. Το body.οτιδήποτε όχι!            
    order.costs = validate.costs(req.body.costs, order.cart, req.customer);         // costs validation       
    order.test = req.body.test;
    console.log(`\x1b[36m Ο πελάτης ${req.customer['Επωνυμία']} (${req.customer['email']}) δημιούργησε νέα παραγγελία με κωδικό ${order.id} \x1b[0m`);
    // console.log(JSON.stringify(order));
    
    // Βήμα 2: Αποστολή email στο κατάστημα και στον πελάτη
    if (process.env.ENVIRONMENT!=="DEVELOPMENT"){
        sendMail(order,'shop');                                     // do not await this
        setTimeout(_=>{sendMail(order,'customer')},2000);           // do not await this
    }


    // Βήμα 3: Καταχώριση της παραγγελίας στη βάση 
    Order.create({                                                  // do not await this
        orderId: order.id,
        customer: order.customer.email,
        cart: order.cart,
        costs: order.costs,
        notes: order.notes,
        test: order.test 
    }).then(_=>{
        console.log(`Η παραγγελία ${order.id} καταχωρήθηκε στη βάση δεδομένων`);
    });



    // Respond to client (browser)
    // res.send(mailBody(order,'customer'));       // shop , customer
    res.json(order);
});

// PROFILE ROUTE
router.get(['/profile','/customer','/me'], validateFirebaseToken, (req,res) => {
    res.json(req.customer);
});



///////////////////////////////////         EXPORTS         /////////////////////////////////////

module.exports = router;


