'use strict';




///////////////////////////////////          DEPENDENCIES          ////////////////////////////////////
// require('dotenv').config();
const axios = require('axios');
let { uniqueOf, treeOf } = require('./utilities.js');
let { sendErrorLoadingEmail } = require('./errorloading.js');





///////////////////////////////////            VARIABLES           /////////////////////////////////////


/** how often the data will be refreshed */
let refreshIntervalInHours = process.env.REFRESHINTERVAL??24;   // in hours
let clientID = process.env.CLIENTID;
let appId = (process.env.APPID).toString();


/** The object that holds the fetch functions from SoftOne */
let SoftOne = {};


/** The object that holds all stored data. Used only for System or Administrator use */
let Data = {
    customers: [],
    lens: [],
    frames: [],
    customerEmails: [],
};


/** The object that holds the publicly available data */
let PublicData = {
    lens: [],
    lensTokai: [],
    lensTrian: [],
    frames: [],
    uniqueOfLens: {},
    uniqueOfLensTrian: {},
    uniqueOfLensTokai: {},
    uniqueOfFrames: {},
    treeOfLensTrian: {},
    treeOfLensTokai: {},
    treeOfLensTrianAlt: {},
    treeOfLensTokaiAlt: {},
};


/** The object that holds the data that is available for authorized customers */
let DataForCustomers = {
    lens: [],
    lensTokai: [],
    lensTrian: [],
    frames: [],
}






/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////         GET DATA FROM SOFTONE        //////////////////////////////////


/**
 * 
 * @param {string} sqlName the name of the query to run
 * @param {boolean} pagination set true to only fetch 100 records
 * @returns {PromiseLike<object>}
 */
SoftOne.fetch = async (sqlName,pagination=false) => {
    
    try{
        const response = await axios.get(process.env.SOFTONEURL, {
            data: {
                service: "SqlData",
                clientID: clientID,
                appId: "3002",
                SqlName: sqlName,
                page: pagination==true ? 1 : 0,
                rowofpage: pagination==true ? 100 : 9999999,
            },
            responseType: 'arraybuffer',
            reponseEncoding: 'binary'
        });
        // console.log(response);

        // Μετατρέπουμε τα αλαμπουρνέζικα σε unicode
        // https://stackoverflow.com/questions/72446286/nodejs-decode-http-response-data-of-windows-1253-format
        const decoder = new TextDecoder('ISO-8859-7');
        let decodedResponse = decoder.decode(response.data)
        return JSON.parse(decodedResponse);   // this is an object now

    }catch(error){
        // console.log(error);
    }
};

/** Function to fetch the new customers list from SoftOne */
SoftOne.customers = async function() {
    let response = await SoftOne.fetch('CustomerData',false);
    // console.log(response);
    try{
        let customers = response['rows'];
        Data.customers = customers;
        let count = response['totalcount'];
        console.log(`Ήρθαν ${count} πελάτες`);
        Data.customerEmails = customers.map(customer => customer['email']).filter(email => email!="null" && email.includes("@"));
        console.log(`Έγκυρα e-mail πελατών: ${Data.customerEmails.length} `);
    }catch(error){
        console.error("Error loading customers from SoftOne");
        sendErrorLoadingEmail();
    }
    // run every this hours
    // setTimeout(SoftOne.customers,1000*60*60*refreshIntervalInHours);     // refresh customers list every 12 hours
};




/** Function to fetch the new frames list from SoftOne */
SoftOne.frames = async function(){
    let response = await SoftOne.fetch('ItemsData1',false);
    try{
        let frames = response['rows'];
        Data.frames = frames;
        let count = response['totalcount'];
        console.log(`Ήρθαν ${count} σκελετοί`);

        PublicData.frames = frames.map(frame => {
            return {
                "Κωδικός": frame['Κωδικός'],
                "Περιγραφή": frame['Περιγραφή'],
                "Κατασκευαστής": frame['Κατασκευαστής'],
                "Μάρκα": frame['Μάρκα'],
                "Χρώμα": frame['Χρώμα'],
                "Μοντέλο": frame['Μοντέλο'],
                "Παράδοση": frame['Παράδοση'],
            }
        });
        PublicData.uniqueOfFrames = uniqueOf(PublicData.frames,["Κατασκευαστής","Μάρκα","Χρώμα","Μοντέλο"]);
    }catch(error){
        console.error("Error loading frames from SoftOne");
    }
    // setTimeout(SoftOne.frames,1000*60*60*refreshIntervalInHours);         // refresh list every this hours
};


/** Function to fetch the new lens list from SoftOne */
SoftOne.lens = async function(){
    let response = await SoftOne.fetch('ItemsData2',false);
    try{
        let lens = response['rows'];
        Data.lens = lens;
        let count = response['totalcount'];
        console.log(`Ήρθαν ${count} φακοί`);

        PublicData.lens = lens.map(len => {
            return {
                "Κωδικός": len['Κωδικός'],
                "Περιγραφή": len['Περιγραφή'],
                "Κατασκευαστής": len['Κατασκευαστής'], // not needed, only for testing
                "Σφαίρωμα": len['Σφαίρωμα'],
                "Κύλινδρος": len['Κύλινδρος'],
                "Σφαίρωμα2": len['Σφαίρωμα2'],
                "Κύλινδρος2": len['Κύλινδρος2'],
                "Διάθλ": len['ΔείκτηςΔιάθλ']??len['Δείκτης Διάθλ.'],        //TODO: κράτα μόνο το σωστό
                "Επίστρωση": len['Επίστρωση'],
                "Υλικό": len['Υλικό'],
                "Διάμετρος": len['Διάμετρος'],
                "Παράδοση": len['Παράδοση'],
                "ΤιμΚατ": len['ΤιμολογιακήΚατηγορία']
            };
        });
        PublicData.lensTokai = PublicData.lens.filter(lens => lens['Κατασκευαστής']=="TOKAI");
        PublicData.lensTrian = PublicData.lens.filter(lens => lens['Κατασκευαστής']=="TRIAN");

        let lensAttributes = ['Κατασκευαστής','Σφαίρωμα','Κύλινδρος','Διάθλ','Επίστρωση','Υλικό','Διάμετρος'];
        PublicData.uniqueOfLens = uniqueOf(PublicData.lens,lensAttributes);

        lensAttributes = lensAttributes.filter(attribute => attribute!='Κατασκευαστής');
        PublicData.uniqueOfLensTokai = uniqueOf(PublicData.lensTokai,lensAttributes);
        PublicData.uniqueOfLensTrian = uniqueOf(PublicData.lensTrian,lensAttributes);
        console.log(`Φακοί Trian: ${Object.keys(PublicData.lensTrian).length}, Φακοί Tokai: ${Object.keys(PublicData.lensTokai).length}`);

        PublicData.treeOfLensTrian = treeOf(PublicData.lensTrian,["Σφαίρωμα","Κύλινδρος"]);
        PublicData.treeOfLensTokai = treeOf(PublicData.lensTokai,["Σφαίρωμα","Κύλινδρος"]);
        PublicData.treeOfLensTrianAlt = treeOf(PublicData.lensTrian,["Σφαίρωμα2","Κύλινδρος2"]);
        PublicData.treeOfLensTokaiAlt = treeOf(PublicData.lensTokai,["Σφαίρωμα2","Κύλινδρος2"]);
        console.log("Επιτυχής δημιουργία trees");

    }catch(error){
        console.error("Error loading lens from SoftOne");
    }
    // run every this hours
    // setTimeout(SoftOne.lens,1000*60*60*refreshIntervalInHours);     // refresh customers list every 12 hours
};



/** Returns a customer object (or null), given their email */
let getCustomer = (email) => {
    let store = null;

    // 1. Ψάξε για υποκατάστημα με αυτό το email. 
    // Είναι υποκατάστημα αν έχει διαφορετικό email από το email του κύριου καταστήματος
    let brunch = Data.customers.find( customer=>customer['Email Υπ/τος']==email && customer['email']!=customer['Email Υπ/τος'] ) ?? null; 
    if (brunch) {
        brunch['email']=brunch['Email Υπ/τος'];
        brunch['Πόλη']=brunch['Πόλη Υπ/τος'];
        brunch['Διεύθυνση']=brunch['Διεύθυνση Υπ/τος'];
        brunch['ΤΚ']=brunch['ΤΚ Υπ/τος'];
        brunch['Τηλέφωνο']=brunch['Τηλέφωνο Υπ/τος'];
        store = brunch;
    }

    // 2. Ψάξε για κύριο κατάστημα με αυτό το email, αν δεν βρέθηκε υποκατάστημα
    store = store ?? Data.customers.find( customer=>customer['email']==email ) ?? null;
    if (!store) {return null}

    // 3. Διάγραψε όλα τα keys που περιέχουν 'Υπ/τος', διότι είναι άχρηστα.
    let keys = Object.keys(store);
    keys.forEach(key => {
        if ( key.includes('Υπ/τος') ) { delete store[key] }
    });
    return store;

};






///////////////////////////////////         EXPORTS         /////////////////////////////////////

module.exports = {SoftOne, PublicData, Data, getCustomer};