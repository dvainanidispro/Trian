'use strict';




///////////////////////////////////         DEPENDENCIES         /////////////////////////////////////

// load env variables. Call this just once (not in every file) but before the dependencies!
require('dotenv').config();     
// Set up Express server
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
let {SoftOne, PublicData, Data} = require('./controllers/SoftOne.js');

// Middleware
let {validateToken, cacheResponse} = require('./controllers/middleware.js');

// Firebase
const {validateFirebaseToken} = require('./controllers/firebase.js');

// Other variables
let environment = process.env.ENVIRONMENT;
let initialIntervalInSeconds = process.env.INITIALINTERVAL??30;    // in seconds
let refreshIntervalInHours = process.env.REFRESHINTERVAL??24;   // in hours
/** When this is true, an update is being performed, so no other update can be done simultaneously */
let updatingNow = false;    // to prevent multiple simultaneous updates from SoftOne
/** When this gets true, the service is ready for use */
let dataOK = false;

let delay = async function(sec) {
    return new Promise((resolve,reject) => {
        setTimeout(() => {
            resolve();
        },sec*1000);
    });
} 

// let trian.gr use the API
server.use(cors({
    origin: 'https://trian.gr',
}));




////////////////////////          INITIALIZE SOFTONE DATA COLLECTION            //////////////////////////



//* fetch Customers, then Frames, then Lens, in intervals
let fetchEverythingFromSoftOne = async function(once=false) {
    if (updatingNow) {return} 
    updatingNow = true;    // prevent multiple simultaneous updates from SoftOne
    await delay(initialIntervalInSeconds);
    console.log("Έναρξη λήψης πελατών και προϊόντων από το SoftOne");
    SoftOne.customers();
    if (!once) {setInterval(SoftOne.customers,1000*60*60*refreshIntervalInHours)}
    await delay(initialIntervalInSeconds);
    SoftOne.frames();
    if (!once) {setInterval(SoftOne.frames,1000*60*60*refreshIntervalInHours)}
    await delay(initialIntervalInSeconds);
    SoftOne.lens();
    if (!once) {setInterval(SoftOne.lens,1000*60*60*refreshIntervalInHours)}
    await delay(initialIntervalInSeconds);
    updatingNow = false;
    dataOK = Data.customers.length>0;   // Data is OK, if we have customers, from this or previous fetch.
    if (dataOK) {
        console.log("Η υπηρεσία είναι έτοιμη");
    } else {
        console.error("Η υπηρεσία δεν είναι έτοιμη. To deployment απέτυχε!");
    }

    // setTimeout(SoftOne.customers,initialIntervalInSeconds*1*1000);
    // setTimeout(SoftOne.frames,initialIntervalInSeconds*2*1000);
    // setTimeout(SoftOne.lens,initialIntervalInSeconds*3*1000);



}
fetchEverythingFromSoftOne();

// SoftOne.customers();
// SoftOne.frames();
// SoftOne.lens();















/////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////        WEB ROUTES         ////////////////////////////////////////


server.get('/',(req,res)=>{
    res.send(`
    <img src="/trian.png">
    `);
});

server.get('/trian.png', cors(), (req,res) => {
    res.sendFile(__dirname+'/public/trian.png');
});

server.get('/favicon.ico', cors(), (req,res) => {
    res.sendFile(__dirname+'/public/favicon.ico');
});


// healthcheck for deployment. When this returns 200, the service is ready, and the traffic is switched to this deployment
server.get('/health', (req,res) => {
    if (!dataOK) { 
        res.status(503).send('Η υπηρεσία βρίσκεται σε στάδιο εκκίνισης. Παρακαλώ περιμένετε.'); 
        return;
    }
    res.send('Η υπηρεσία είναι έτοιμη για χρήση');
}); 



//////////////////////////////////////        PROFILE         ////////////////////////////////////////

server.get(['/api/profile','/profile'], validateFirebaseToken, (req,res) => {
    res.json(req.customer);
});



////////////////////////////////      PUBLIC API ROUTES FOR E-SHOP      ///////////////////////////////////


server.get(['/api/frames','/api/frames.json'], cacheResponse, (req,res) => {
    res.json(PublicData.frames);
});



server.get(['/api/lens/tokai','/api/lens/tokai.json'], cacheResponse, (req,res) => {
    res.json(PublicData.lensTokai);
});

server.get(['/api/lens/trian','/api/lens/trian.json'], cacheResponse, (req,res) => {
    res.json(PublicData.lensTrian);
});

/*

// server.get('/api/lens', (req,res) => {
//     res.json(PublicData.lens);
// });

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

*/


////////////////////////////////        REALTIME "SHOW" ROUTES         //////////////////////////////////

const showRouter = require('./routes/show.js');
server.use('/show', showRouter);



////////////////////////////////             FILTER ROUTES             //////////////////////////////////

const filterRouter = require('./routes/filter.js');
server.use('/api/filter', filterRouter);


////////////////////////////////            LENS TREE ROUTES           //////////////////////////////////

const treeRouter = require('./routes/tree.js');
server.use('/api/tree', treeRouter);



////////////////////////////////              ORDER ROUTES            //////////////////////////////////

const orderRouter = require('./routes/order.js');
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

/*
server.get('/api/validatemail/:token/:email', validateToken, (req,res) => {
    // check if e-mail exists in custormers' emails list
    res.send(Data.customerEmails.includes(req.params.email));      // returns just true or false  
});
*/

server.get('/api/validatecustomer/:token/:email', validateToken, (req,res) => {
    // check if e-mail exists in custormers' emails list and return customer or null
    res.json( Data.customers.find(customer => customer['email']==req.params.email) ?? null );
});

server.get('/api/update/:token', validateToken, (req,res) => {
    if (updatingNow) {
        res.send('Μια ενημέρωση πελατών και προϊόντων βρίσκεται ήδη σε εξέλιξη. Παρακαλώ περιμένετε.');
        return;
    }
    console.log('Ζητήθηκε χειροκίνητα ανανέωση πελατών και προϊόντων');
    // fetch everything from SoftOne and update Data
    fetchEverythingFromSoftOne(true);   // once=true, δηλαδή MHN βάλεις setInterval
    res.send('Λήφθηκε εντολή για ενημέρωση πελατών και προϊόντων. Η ενημέρωση θα ολοκληρωθεί στα επόμενα λεπτά.');
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
