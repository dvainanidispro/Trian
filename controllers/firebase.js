'use strict';

// Dependencies
const {Data} = require('../controllers/SoftOne.js');

// Firebase dependencies
var admin = require("firebase-admin");
var serviceAccount = JSON.parse(process.env.FIREBASESERVICEACCOUNT);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
let auth = admin.auth();


/** Validate Firebase Token and return user object in req.customer */
let validateFirebaseToken = async (req, res, next) => {
    let customer = null;
    try{
        let token = req.headers.authentication.split(' ')[1];
        // console.log(token);
        let user = await auth.verifyIdToken(token);
        // console.log(user);
        customer = Data.customers.find( customer=>customer['email']==user.email )??null;
        // console.log(customer);
        if (customer?.['Ενεργός']!=='1') {throw new Error(`Ο χρήστης ${user.email} έχει διαγραφτεί ή είναι ανενεργός.`);}
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



// exports
module.exports = {validateFirebaseToken};

