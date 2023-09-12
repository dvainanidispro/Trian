'use strict';




///////////////////////////////////          DEPENDENCIES          ////////////////////////////////////
require('dotenv').config();
const axios = require('axios');
let { uniqueOf } = require('./utilities.js');





///////////////////////////////////            VARIABLES           /////////////////////////////////////


/** how often the data will be refreshed */
let refreshIntervalInHours = process.env.REFRESHINTERVAL??24;   // in hours
let clientID = process.env.CLIENTID;
let appId = (process.env.APPID).toString();


/** The object that holds the fetch functions from SoftOne */
let SoftOne = {};


/** The object that holds all stored data */
let Data = {
    customers: [],
    lens: [],
    frames: [],
    customerEmails: [],
};


/** The objects that holds the publicly available data */
let PublicData = {
    lens: [],
    lensTokai: [],
    lensTrian: [],
    frames: [],
    uniqueOfLens: {},
    uniqueOfLensTrian: {},
    uniqueOfLensTokai: {},
    uniqueOfFrames: {},
};






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
    }
    // run every this hours
    setTimeout(SoftOne.customers,1000*60*60*refreshIntervalInHours);     // refresh customers list every 12 hours
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
            }
        });
        PublicData.uniqueOfFrames = uniqueOf(PublicData.frames,["Κατασκευαστής","Μάρκα","Χρώμα","Μοντέλο"]);
    }catch(error){
        console.error("Error loading frames from SoftOne");
    }
    setTimeout(SoftOne.frames,1000*60*60*refreshIntervalInHours);         // refresh list every this hours
};


/** Function to fetch the new lens list from SoftOne */
SoftOne.lens = async function(){
    let response = await SoftOne.fetch('ItemsData2',false);
    try{
        let lens = response['rows'];
        Data.lens = lens;
        let count = response['totalcount'];
        console.log(`Ήρθαν ${count} φακοί`);

        PublicData.lens = lens.map(frame => {
            return {
                "Κωδικός": frame['Κωδικός'],
                "Περιγραφή": frame['Περιγραφή'],
                "Κατασκευαστής": frame['Κατασκευαστής'], // not needed, only for testing
                "Σφαίρωμα": frame['Σφαίρωμα'],
                "Κύλινδρος": frame['Κύλινδρος'],
                "Διάθλ": frame['Δείκτης Διάθλ.'],
                "Επίστρωση": frame['Επίστρωση'],
                "Υλικό": frame['Υλικό'],
                "Διάμετρος": frame['Διάμετρος'],
            };
        });
        PublicData.lensTokai = PublicData.lens.filter(lens => lens['Κατασκευαστής']=="TOKAI");
        PublicData.lensTrian = PublicData.lens.filter(lens => lens['Κατασκευαστής']=="TRIAN");

        let lensAttributes = ["Κατασκευαστής","Σφαίρωμα","Κύλινδρος","Διάθλ","Επίστρωση","Υλικό","Διάμετρος"];
        PublicData.uniqueOfLens = uniqueOf(PublicData.lens,lensAttributes);

        lensAttributes = lensAttributes.filter(attribute => attribute!="Κατασκευαστής");
        PublicData.uniqueOfLensTokai = uniqueOf(PublicData.lensTokai,lensAttributes);
        PublicData.uniqueOfLensTrian = uniqueOf(PublicData.lensTrian,lensAttributes);
    }catch(error){
        console.error("Error loading lens from SoftOne");
    }
    // run every this hours
    setTimeout(SoftOne.lens,1000*60*60*refreshIntervalInHours);     // refresh customers list every 12 hours
};







///////////////////////////////////         EXPORTS         /////////////////////////////////////

module.exports = {SoftOne, PublicData, Data};