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

/** The list of customers. Array of objects */
let customers = [];
/** The list of customers' emails. Array of strings. Used for authentication */
let customerEmails = [];

// Tokens to access API
let firebaseToken = process.env.FIREBASETOKEN;
let userToken = process.env.USERTOKEN;
let appId = (process.env.APPID).toString();
let environment = process.env.ENVIRONMENT;
let clientID = process.env.clientID;
console.log(clientID);


///////////////////////////////////         MIDDLEWARE         /////////////////////////////////////

/** Validate Token */
let validateToken = (req,res,next) => {
    if ([firebaseToken,userToken].includes(req.params.token)) {     // validate token
        next();
        return;
    }
    res.status(403).send('Forbidden');
};


///////////////////////////////////         GET DATA         /////////////////////////////////////

/**
 * 
 * @param {string} sqlName the name of the query to run
 * @param {boolean} pagination set true to only fetch 100 records
 * @returns {PromiseLike<object>}
 */
let fetchFromSoftone = async (sqlName,pagination=false) => {
    
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


        // https://stackoverflow.com/questions/72446286/nodejs-decode-http-response-data-of-windows-1253-format
        const decoder = new TextDecoder('ISO-8859-7');
        let decodedResponse = decoder.decode(response.data)
        return JSON.parse(decodedResponse);   // this is an object now

    }catch(error){
        console.log(error);
    }
};

let fetchCustomers = async () => {
    let response = await fetchFromSoftone('CustomerData',false);
    // console.log(response);
    customers = response['rows'];
    let count = response['totalcount'];
    console.log(`Ήρθαν ${count} πελάτες`);
    // customerEmails = customers.map(customer => customer['email']).filter(email => email!="null" && email.includes("@"));
    // console.log(`Έγκυρα e-mail πελατών: ${customerEmails.length} `);
};
fetchCustomers();







///////////////////////////////////        WEB ROUTES         /////////////////////////////////////


server.get('/',(req,res)=>{
    res.send('TRIAN');
});

server.get('/show/:token/customers', async (req,res) => {
    let customersObj = await fetchFromSoftone('CustomerData',true);
    let customers = customersObj['rows'];  // τοπική μεταβλήτή, ώστε η global customers να μην αντικατασταθεί με μόνο 100 πελάτες 
    let count = customersObj['totalcount'];
    console.log(`fetched ${count} customers using "show" route`);

    // res.send(''+count);     // if you send a number, it will be interpreted as a status code, not as a response body
    res.send(prettyJSON(customers));
});

server.get('/show/:token/frames', async (req,res) => {
    let dataObj = await fetchFromSoftone('ItemsData1',true);
    let count = dataObj['totalcount'];
    let data = dataObj['rows'];

    // res.send(''+count);     // if you send a number, it will be interpreted as a status code, not as a response body
    res.send(prettyJSON(data));
});

server.get('/show/:token/lens', async (req,res) => {
    let dataObj = await fetchFromSoftone('ItemsData2',true);
    let count = dataObj['totalcount'];
    let data = dataObj['rows'];

    // res.send(''+count);     // if you send a number, it will be interpreted as a status code, not as a response body
    res.send(prettyJSON(data));
});


///////////////////////////////////        API ROUTES         /////////////////////////////////////

server.get('/api/:token/customers', async (req,res) => {
    res.json(customers);
});

server.get('/api/:token/frames', async (req,res) => {
    let response = await fetchFromSoftone('ItemsData1');
    let data = response['rows'];
    let count = response['totalcount'];
    console.log(`Ήρθαν ${count} σκελετοί`);
    res.json(data);
});

server.get('/api/:token/lens', async (req,res) => {
    let response = await fetchFromSoftone('ItemsData2');
    let data = response['rows'];
    let count = response['totalcount'];
    console.log(`Ήρθαν ${count} φακοί`);
    res.json(data);
});

server.get('/api/:token/customeremails', (req,res) => {
    res.json(customerEmails);
});

server.get('/api/validatemail/:token/:email', validateToken, (req,res) => {
    // check if e-mail exists in custormers' emails list
    res.send(customerEmails.includes(req.params.email));        
});

server.get('/api/validatecustomer/:token/:email', validateToken, (req,res) => {
    // check if e-mail exists in custormers' emails list
    res.json(customers.find(customer => customer['email']==req.params.email)??null);
    // res.send(customerEmails.includes(req.params.email));        
});




///////////////////////////////////         START THE SERVER         /////////////////////////////////////

let port = process.env.PORT??80;
let listeningURL = process.env.LISTENINGURL??'http://localhost';
const startWebServer = (server,port,listeningURL="http://localhost") => {
    server.listen(port, () => {
        let presentTime = () => (new Date()).toLocaleString('el-GR',{hourCycle: 'h23', dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Athens'});
        console.log(`\x1b[35m Server is listening at \x1b[4m ${listeningURL}:${port} \x1b[0m\x1b[35m. Started at: ${presentTime()}. \x1b[0m`);
    });
};
startWebServer(server,port,listeningURL);
