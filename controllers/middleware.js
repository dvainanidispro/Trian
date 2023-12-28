'use strict';


//////////////////////////      validateToken

// Tokens to validate
let firebaseToken = process.env.FIREBASETOKEN;
let userToken = process.env.USERTOKEN;

/** Validate Token when it is in the URL. Can't use server.use... */
exports.validateToken = (req,res,next) => {
    if ([firebaseToken,userToken].includes(req.params.token)) {     // validate token
        next();
        return;
    }
    res.status(403).send('Forbidden');
};




//////////////////////////      cacheResponse

/** Tells the browser to cache the response for 12 hours */
exports.cacheResponse = (req,res,next) => {
    res.set('Cache-Control', 'private, max-age=43200, immutable');  // Cache for 12 hours, and private = to specific user 
    res.set('Vary', 'Authentication, Authorization');      // Cache based on Authentication or Authorization header
    next();
};

