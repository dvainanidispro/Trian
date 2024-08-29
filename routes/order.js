'use strict';


///////////////////////////////////          DEPENDENCIES          ////////////////////////////////////
const router                            = require('express').Router();
const { sendMail, mailBody }            = require('../controllers/mail.js');
const { validateFirebaseToken }         = require('../controllers/firebase.js');
const { validate, validateSystemToken } = require('../controllers/validate.js');
const { getCustomer }                   = require('../controllers/SoftOne.js');
const { Op }                            = require('sequelize');
const Order                             = require('../models/order.js');

let initialIntervalInSeconds = process.env.INITIALINTERVAL??30; 
let orderLimit = process.env.ORDERLIMIT??40;   


///////////////////////////////////          RECIEVE ORDER          ////////////////////////////////////

/** orderId.new() returns a random unique id for a new order. Includes the current date and some random digits at the end */
let orderId = {
    todaysOrders: [],           // θα αντικατασταθεί από τις παραγγελίες της σημερινής ημέρας
    get datePart() { return (new Date()).toISOString().split('T')[0] },  // today's date
    randomPartDigits: 4,
    get randomUpper() { return 10**this.randomPartDigits },                // για 4 ψηφία, είναι 10^4=10000
    get randomPart() { return String(Math.floor(Math.random()*this.randomUpper)).padStart(this.randomPartDigits,'1') },      // n-digit random number (1111-9999)
    
    new: function() { 
        let newId = '';
        do {
            newId = this.datePart + "-" + this.randomPart;
        } while (this.todaysOrders.includes(newId) && this.todaysOrders.length<(this.randomUpper*0.8));
        // Επανάληψη μέχρι να βρεθεί μοναδικό id ή να μην υπάρχουν άλλα διαθέσιμα id 
        // (όπου διαθέσιμα id: έβαλα 80% του randomUpper για ασφάλεια, λόγω padStart 1, πχ για 4 ψηφία, 10000*0.8=8000 μοναδικοί)

        // Αποθήκευση του νέου id στον πίνακα των παραγγελιών και καθάρισμά του (κράτα μόνο τις σημερινές)
        this.todaysOrders.push(newId);
        this.todaysOrders = this.todaysOrders.filter(orderId=>orderId.includes(this.datePart));
        return newId;
    }
} 

// Αντικατάσταση του todaysOrders από τις σημερινές παραγγελίες κατά την εκκίνηση του server (μια φορά)
setTimeout(async _=>{
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    let todaysOrders = await Order.findAll({ where: { orderDate: {[Op.gt]: startOfToday} } });
    orderId.todaysOrders = todaysOrders.map(order=>order.orderId);
    // console.debug('Σημερινές παραγγελίες ως τώρα: ' + orderId.todaysOrders);
},initialIntervalInSeconds*1.8*1000);   // 1.8: magic number (κακώς), θέλουμε μεγαλύτερο από 1


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


/////////////////////////////////       PRINT HTML ORDER        /////////////////////////////////////
router.get(['/print/:token/:orderId'], validateSystemToken, async (req,res) => {
    let order = await Order.findOne({ where: { orderId: req.params.orderId } });
    if (!order) { res.send('Η παραγγελία δεν βρέθηκε'); return; }
    // Φέρνει τον πελάτη (αντικείμενο). Αν όχι (πχ έχει διαγραφεί ο πελάτης), να εμφανίζονται undefined (όχι error)
    order.customer = getCustomer(order.customer)??'undefined';     
    res.send(mailBody(order,'shop'));
});


///////////////////////////////////         EXPORTS         /////////////////////////////////////

module.exports = router;


