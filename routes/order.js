'use strict';


///////////////////////////////////          DEPENDENCIES          ////////////////////////////////////
const router                        = require('express').Router();
const { sendMail, mailBody }        = require('../controllers/mail.js');
const { validateFirebaseToken }     = require('../controllers/firebase.js');
const { validate }                  = require('../controllers/validate.js');
const Order                         = require('../models/order.js');

let initialIntervalInSeconds = process.env.INITIALINTERVAL??30; 
let orderLimit = process.env.ORDERLIMIT??40;   


///////////////////////////////////          RECIEVE ORDER          ////////////////////////////////////

/** orderId.new() returns a random unique id for a new order. Includes the current date and some random digits at the end */
let orderId = {
    get datePart() { return (new Date()).toISOString().split('T')[0] },                     // today's date
    get randomPart() { return String(Math.floor(Math.random()*100)).padStart(2,'1') },      // 2-digit random number (11-99)
    lastAscendingPart: 11,      // θα αντικατασταθεί από το αντίστοιχο της τελευταίας παραγγελίας
    // ascending, ώστε να μην υπάρχουν διπλότυπα id. Διψήφιο. Για περισσότερες από 40 παραγγελίες τη μέρα, να γίνει τριψήφιο.
    get nextAscendingPart() {    
        let next = this.lastAscendingPart + Math.floor(Math.random()*3) + 1;    // add 1 to 3
        if ( next>99 ) { next = next-90 }           // το αποτέλεσμα να μείνει μεταξύ 10 and 99
        return this.lastAscendingPart = next;       // assign and also return it
    },
    new: function() { 
        return this.datePart + "-" + this.randomPart + this.nextAscendingPart;
    }
} 

// Αντικατάσταση του lastAscendingPart από τον αύξοντα αριθμό της τελευταίας παραγγελίας
setTimeout(async _=>{
    let lastOrder = await Order.findOne({order:[['id','DESC']]});
    orderId.lastAscendingPart = +lastOrder.orderId.slice(-2);       // + converts it to number
},initialIntervalInSeconds*1.8*1000);   // 1.8: magic number, θέλουμε μεγαλύτερο από 1





/** Καταγράφει το email που υποστηρίζει ο πελάτης ότι έχει. Για λόγους troubleshooting, αν πχ το token δεν λειτουργήσει σωστά. */ 
let consoleLogUser = (req,res,next) => {
    console.log(`Λήψη παραγγελίας από ${req.body.customerEmail}`); 
    next();
};





///////////////////////////////////           ORDER ROUTE          ///////////////////////////////////

router.post(['/'], consoleLogUser, validateFirebaseToken, (req,res) => {

    //* Βήμα 1: Επικύρωση των δεδομένων της παραγγελίας
    let order = {};
    order.id = orderId.new();                               // new order id
    order.customer = req.customer;                      // customer validation
    order.cart = validate.cart(req.body.cart);          // cart validation
    order.notes = req.body.notes;   
    // To order.cart είναι validated. Το body.οτιδήποτε όχι!            
    order.costs = validate.costs(req.body.costs, order.cart, req.customer);         // costs validation       
    order.test = req.body.test;
    console.log(`\x1b[36m Ο πελάτης ${req.customer['Επωνυμία']} (${req.customer['email']}) δημιούργησε νέα παραγγελία με κωδικό ${order.id} \x1b[0m`);
    // console.log(JSON.stringify(order));
    
    //* Βήμα 2: Αποστολή email στο κατάστημα και στον πελάτη
    if ( process.env.ENVIRONMENT!=="DEVELOPMENT" ){                 // ίσως && order.test!=true
        sendMail(order,'shop');                                     // do not await this
        setTimeout(_=>{sendMail(order,'customer')},2000);           // do not await this
    }


    //* Βήμα 3: Καταχώριση της παραγγελίας στη βάση 
    Order.create({                                                  // do not await this
        orderId: order.id,
        customer: order.customer.email,
        cart: order.cart,
        costs: order.costs,
        notes: order.notes,
        test: order.test 
    }).then(_=>{
        console.log(`Η παραγγελία ${order.id} καταχωρίστηκε στη βάση δεδομένων`);
    });


    // Respond to client (browser)
    // res.send(mailBody(order,'customer'));       // shop , customer
    res.json(order);
});

// PROFILE ROUTE
router.get(['/profile','/customer','/me'], validateFirebaseToken, (req,res) => {
    res.json(req.customer);
});



/////////////////////////////////       ORDER HISTORY       /////////////////////////////////////

router.get(['/history','/orders'], validateFirebaseToken, async (req,res) => {
    const limit = orderLimit;
    let orders = await Order.findAll({ where: { customer: req.customer.email }, order: [['orderDate', 'DESC']], limit }).catch(err=>{console.error(err)});
    res.json(orders);
});



///////////////////////////////////         EXPORTS         /////////////////////////////////////

module.exports = router;


