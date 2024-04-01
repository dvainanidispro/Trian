'use strict';

// Dependencies
const {getCustomer} = require('../controllers/SoftOne.js');

// Firebase dependencies
var admin = require("firebase-admin");
var serviceAccount = JSON.parse(process.env.FIREBASESERVICEACCOUNT);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
let auth = admin.auth();


/** Validate Firebase Token and return user object in req.customer. If customer does not exist, return 401 */
let validateFirebaseToken = async (req, res, next) => {
    let customer = null;
    let token = null
    try{
        token = req.headers.authorization ? req.headers.authorization?.split(' ')[1] : null;
        // χωρίς token στην παραγγελία, είναι req.headers.auth=='Bearer undefined' διότι το header έχει ρυθμιστεί να στέλνεται πάντα. 
        if (!token || token=="undefined") {console.log('No token provided')}
        let user = await auth.verifyIdToken(token);     // user object or error (promise rejected)
        customer = getCustomer(user.email);             //customer object or null
        // if (customer?.['Ενεργός']!=='1') {throw new Error(`Ο χρήστης ${user.email} έχει διαγραφτεί ή είναι ανενεργός.`);}
        if (!customer) {throw new Error(`Ο χρήστης ${user.email} έχει διαγραφτεί ή είναι ανενεργός.`);}
    } catch(e) {
        console.error(e.message);
    }
    if (!customer) {    // customer not found (token invalid/missing)
        console.error('Unauthorized request');        
        res.status(401).send('Unauthorized');
        res.end();
    } else {    // customer found
        req.customer = customer;
        next();
    }
};


/** Check for Firebase User and return user object in req.customer. If customer does not exist, req.customer will be null */
let firebaseUser = async  (req, res, next) => {
    let token = req.headers.authorization ? req.headers.authorization?.split(' ')[1] : null;
    if (!token || token=="undefined") {
        console.log("no token!")
        req.customer = null;
    } else {
        // try{
            let user = await auth.verifyIdToken(token);     // user object or error (promise rejected)
            req.customer = getCustomer(user.email);         //customer object or null
        // } catch(e) {}   
    }
    next();
};


// exports
module.exports = { validateFirebaseToken , firebaseUser };

