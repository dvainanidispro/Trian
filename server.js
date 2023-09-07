/* jshint strict:global , esversion: 11 */
'use strict';



///////////////////////////////////         DEPENDENCIES         /////////////////////////////////////


// Set up Express server and env variables
require('dotenv').config();
const express = require('express');
const server = express();
// Axios and encoding converter
const axios = require('axios');
// pretty print json
const { prettyPrintJson } = require('pretty-print-json');
let prettyJSON = Obj => /*html*/`
    <link rel=stylesheet href=https://cdn.jsdelivr.net/npm/pretty-print-json@2.0/dist/css/pretty-print-json.dark-mode.css>
    <pre class=json-container >
    ${prettyPrintJson.toHtml(Obj,{indent:4,trailingComma:false})}
    </pre>`;
// Cookies (makes req.cookies available)
// const cookieParser = require('cookie-parser');
// server.use(cookieParser());
// grab post/put variables, json objects and send static files
server.use(express.urlencoded({extended: false})); 
server.use(express.json());
server.use(express.static('public')); 



///////////////////////////////////         VARIABLES         /////////////////////////////////////

/** Initialize the object that holds the fetch functions from SoftOne */
let SoftOne = {};

/** Initialize the objects that holds all stored data */
let Data = {
    customers: [],
    lens: [],
    frames: [],
    customerEmails: [],
};

/** Initialize the objects that holds the public data */
let PublicData = {
    lens: [],
    frames: [],
}

// Tokens to access API
let firebaseToken = process.env.FIREBASETOKEN;
let userToken = process.env.USERTOKEN;
let appId = (process.env.APPID).toString();
let environment = process.env.ENVIRONMENT;
let clientID = process.env.CLIENTID;
// console.log({clientID});
let refreshIntervalInHours = process.env.REFRESHINTERVAL??24;
let initialIntervalInSeconds = process.env.INITIALINTERVAL??60;    // in seconds



///////////////////////////////////         MIDDLEWARE         /////////////////////////////////////

/** Validate Token. Can't use server.use... */
let validateToken = (req,res,next) => {
    if ([firebaseToken,userToken].includes(req.params.token)) {     // validate token
        next();
        return;
    }
    res.status(403).send('Forbidden');
};




/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////         GET DATA PERIODICALLY        //////////////////////////////////


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
    // try{
        let customers = response['rows'];
        Data.customers = customers;
        let count = response['totalcount'];
        console.log(`Ήρθαν ${count} πελάτες`);
        Data.customerEmails = customers.map(customer => customer['email']).filter(email => email!="null" && email.includes("@"));
        console.log(`Έγκυρα e-mail πελατών: ${customers.length} `);
    // }catch(error){
    //     console.error("Error loading customers from SoftOne");
    // }
    // run fetchCustomers every this hours
    setTimeout(SoftOne.customers,1000*60*60*refreshIntervalInHours);     // refresh customers list every 12 hours
};




/** Function to fetch the new frames list from SoftOne */
SoftOne.frames = async function(){
    let response = await SoftOne.fetch('ItemsData1',false);
    // console.log(response);
    try{
        Data.frames = response['rows'];
        let count = response['totalcount'];
        console.log(`Ήρθαν ${count} σκελετοί`);
    }catch(error){
        console.error("Error loading frames from SoftOne");
    }
    // run fetchCustomers every this hours
    setTimeout(SoftOne.frames,1000*60*60*refreshIntervalInHours);     // refresh customers list every 12 hours
};


/** Function to fetch the new lens list from SoftOne */
SoftOne.lens = async function(){
    let response = await SoftOne.fetch('ItemsData2',false);
    // console.log(response);
    try{
        Data.lens = response['rows'];
        let count = response['totalcount'];
        console.log(`Ήρθαν ${count} φακοί`);
    }catch(error){
        console.error("Error loading lens from SoftOne");
    }
    // run fetchCustomers every this hours
    setTimeout(SoftOne.lens,1000*60*60*refreshIntervalInHours);     // refresh customers list every 12 hours
};



//* fetchCustomers, then fetchLens, then fetchFrames, in intervals
setTimeout(SoftOne.customers,initialIntervalInSeconds*1*1000);
setTimeout(SoftOne.frames,initialIntervalInSeconds*2*1000);
setTimeout(SoftOne.lens,initialIntervalInSeconds*3*1000);







/////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////        WEB ROUTES         ////////////////////////////////////////


server.get('/',(req,res)=>{
    res.send('TRIAN API');
});




/////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////        REALTIME "SHOW" ROUTES         //////////////////////////////////


server.get('/show/:token/customers', validateToken, async (req,res) => {
    let customersObj = await SoftOne.fetch('CustomerData',true);
    try{
        let customers = customersObj['rows'];  // τοπική μεταβλήτή, ώστε η global customers να μην αντικατασταθεί με μόνο 100 πελάτες 
        let count = customersObj['totalcount'];
        console.log(`fetched ${count} customers using "show" route`);
        // res.send(''+count);     // if you send a number, it will be interpreted as a status code, not as a response body
        res.send(prettyJSON(customers));
    } catch(error){
        res.send("Error loading customers from SoftOne");
    }

});

server.get('/show/:token/frames', validateToken, async (req,res) => {
    let dataObj = await SoftOne.fetch('ItemsData1',true);
    try{
        let data = dataObj['rows'];
        res.send(prettyJSON(data));
    } catch (error){
        res.send("Error loading frames from SoftOne");
    }

});

server.get('/show/:token/lens', validateToken, async (req,res) => {
    let dataObj = await SoftOne.fetch('ItemsData2',true);
    try{
        let data = dataObj['rows'];
        res.send(prettyJSON(data));
    } catch (error){
        res.send("Error loading lens from SoftOne");
    }

});




/////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////        API ROUTES         ////////////////////////////////////////



////////////////////////////////      FREE API ROUTES FOR E-SHOP      ///////////////////////////////////


server.get('/api/frames', async (req,res) => {
    // const response = (({ Κωδικός, Περιγραφή }) => ({ Κωδικός, Περιγραφή }))(frames);
    // let response = {"Κωδικός","Περιγραφή","Κατασκευαστής","Μάρκα","Χρώμα","Μοντέλο"}
    // res.json(response);
    res.json("not ready yet");
});

server.get('/api/lens', validateToken, async (req,res) => {
    res.json("not ready yet");
});





//////////////////////////      PROTECTED API ROUTES FOR CUSTOMERS AND FIREBASE      //////////////////

server.get('/api/:token/customers', validateToken, async (req,res) => {
    res.json(Data.customers);
});

server.get('/api/:token/frames', validateToken, async (req,res) => {
    res.json(Data.frames);
});

server.get('/api/:token/lens', validateToken, async (req,res) => {
    res.json(Data.lens);
});

server.get('/api/validatemail/:token/:email', validateToken, (req,res) => {
    // check if e-mail exists in custormers' emails list
    res.send(Data.customerEmails.includes(req.params.email));        
});

server.get('/api/validatecustomer/:token/:email', validateToken, (req,res) => {
    // check if e-mail exists in custormers' emails list and return customer
    res.json(Data.customers.find(customer => customer['email']==req.params.email)??null);
    // res.send(Data.customerEmails.includes(req.params.email));      // returns just true or false  
});





/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////          START THE SERVER         /////////////////////////////////////


let port = process.env.PORT??80;
let listeningURL = process.env.LISTENINGURL??'http://localhost';
const startWebServer = (server,port,listeningURL="http://localhost") => {
    server.listen(port, () => {
        let presentTime = () => (new Date()).toLocaleString('el-GR',{hourCycle: 'h23', dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Athens'});
        console.log(`\x1b[35m Server is listening at \x1b[4m ${listeningURL} \x1b[0m\x1b[35m. Started at: ${presentTime()}. \x1b[0m`);
    });
};
startWebServer(server,port,listeningURL);
