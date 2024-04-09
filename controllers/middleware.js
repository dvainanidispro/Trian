'use strict';



//////////////////////////      cacheResponse

/** Tells the browser to cache the response for 12 hours */
exports.cacheResponse = (req,res,next) => {
    res.set('Cache-Control', 'private, max-age=43200, immutable');  // Cache for 12 hours, and private = to specific user 
    res.set('Vary', 'Authorization');      // Cache based on Authentication or Authorization header
    next();
};

