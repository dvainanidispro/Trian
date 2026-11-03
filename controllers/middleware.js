'use strict';



//////////////////////////      cacheResponse

const shortCacheHours = 1;
const longCacheHours = 12;

// Full API paths that use the shorter cache duration (including route aliases). 
// Μόνο τα GET έχουν νόημα, δίοτι o browser δεν αποθηκεύει στην cache τις απαντήσεις για τα POST requests.
const shortCachePaths = [
    '/api/filter/colors',
    '/api/filter/colors.json',
    '/api/filter/frames',
    '/api/filter/lens/trian-plano',
    // Θεωρητικά, θα έπρεπε να βάλουμε και τα tree routes, αλλά στην πράξη αλλάζουν σπάνια. 
];

/** Sets browser cache duration according to the requested API path. */
exports.cacheResponse = (req,res,next) => {
    const path = (req.baseUrl + req.path).replace(/\/+$/, '').toLowerCase();
    const cacheHours = shortCachePaths.includes(path) ? shortCacheHours : longCacheHours;
    res.set('Cache-Control', `private, max-age=${cacheHours * 60 * 60}, immutable`);
    res.vary('Authorization');      // Keep existing Vary headers and separate authenticated responses.
    next();
};

