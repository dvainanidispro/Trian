'use strict';




///////////////////////////////////         DEPENDENCIES         /////////////////////////////////////


// Set up Express server and env variables
require('dotenv').config();
const express = require('express');
const server = express();
var cors = require('cors');

// Cookies (makes req.cookies available)
// const cookieParser = require('cookie-parser');
// server.use(cookieParser());
// grab post/put variables, json objects and send static files
server.use(express.urlencoded({extended: false})); 
server.use(express.json());
// server.use(express.static('public')); 





///////////////////////////////         VARIABLES & FUNCTIONS         ////////////////////////////////

// SoftOneData
let {SoftOne, PublicData, Data} = require('./functions/SoftOne.js');

// Middleware
let {validateToken, cacheResponse} = require('./functions/middleware.js');

// Other variables
let environment = process.env.ENVIRONMENT;
let initialIntervalInSeconds = process.env.INITIALINTERVAL??40;    // in seconds

// let trian.gr use the API
server.use(cors({
    origin: 'https://trian.gr',
}));




////////////////////////          INITIALIZE SOFTONE DATA COLLECTION            //////////////////////////



//* fetch Customers, then Frames, then Lens, in intervals
setTimeout(SoftOne.customers,initialIntervalInSeconds*1*1000);
setTimeout(SoftOne.frames,initialIntervalInSeconds*2*1000);
setTimeout(SoftOne.lens,initialIntervalInSeconds*3*1000);

// SoftOne.customers();
// SoftOne.frames();
// SoftOne.lens();















/////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////        WEB ROUTES         ////////////////////////////////////////


server.get('/',(req,res)=>{
    res.send('TRIAN API');
});



////////////////////////////////      PUBLIC API ROUTES FOR E-SHOP      ///////////////////////////////////


server.get(['/api/frames','/api/frames.json'], cacheResponse, (req,res) => {
    res.json(PublicData.frames);
});

// server.get('/api/lens', (req,res) => {
//     res.json(PublicData.lens);
// });

server.get(['/api/lens/tokai','/api/lens/tokai.json'], cacheResponse, (req,res) => {
    res.json(PublicData.lensTokai);
});

server.get(['/api/lens/trian','/api/lens/trian.json'], cacheResponse, (req,res) => {
    res.json(PublicData.lensTrian);
});


server.get(['/api/unique/frames','/api/unique/frames.json'], cacheResponse, (req,res) => {
    res.json(PublicData.uniqueOfFrames);
});

server.get(['/api/unique/lens','/api/unique/lens.json'], cacheResponse, (req,res) => {
    res.json(PublicData.uniqueOfLens);
});

server.get(['/api/unique/lens-trian','/api/unique/lens-trian.json'], cacheResponse, (req,res) => {
    res.json(PublicData.uniqueOfLensTrian);
});

server.get(['/api/unique/lens-tokai','/api/unique/lens-tokai.json'], cacheResponse, (req,res) => {
    res.json(PublicData.uniqueOfLensTokai);
});



////////////////////////////////        REALTIME "SHOW" ROUTES         //////////////////////////////////

const showRouter = require('./functions/show.js');
server.use('/show', showRouter);



////////////////////////////////             FILTER ROUTES             //////////////////////////////////

const filterRouter = require('./functions/filter.js');
server.use('/api/filter', filterRouter);


////////////////////////////////             TREE ROUTES             //////////////////////////////////

const treeRouter = require('./functions/tree.js');
server.use('/api/tree', treeRouter);



////////////////////////////////             ORDER ROUTES             //////////////////////////////////

const orderRouter = require('./functions/order.js');
server.use('/api/order', orderRouter);




//////////////////////////      PROTECTED API ROUTES FOR SYSTEM AND FIREBASE      //////////////////

server.get('/api/all/:token/customers', validateToken, async (req,res) => {
    res.json(Data.customers);
});

server.get('/api/all/:token/frames', validateToken, async (req,res) => {
    res.json(Data.frames);
});

server.get('/api/all/:token/lens', validateToken, async (req,res) => {
    res.json(Data.lens);
});

server.get('/api/validatemail/:token/:email', validateToken, (req,res) => {
    // check if e-mail exists in custormers' emails list
    res.send(Data.customerEmails.includes(req.params.email));      // returns just true or false  
});

server.get('/api/validatecustomer/:token/:email', validateToken, (req,res) => {
    // check if e-mail exists in custormers' emails list and return customer
    res.json(Data.customers.find(customer => customer['email']==req.params.email)??null);
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
