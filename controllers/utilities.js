'use strict';


//////////////////////////      PreetyJSON

const { prettyPrintJson } = require('pretty-print-json');
/** Gets an array/object in json format and returns an html that looks nice! */
exports.prettyJSON = Obj => /*html*/`
    <link rel=stylesheet href=https://cdn.jsdelivr.net/npm/pretty-print-json@2.0/dist/css/pretty-print-json.dark-mode.css>
    <pre class=json-container >
    ${prettyPrintJson.toHtml(Obj,{indent:4,trailingComma:false})}
    </pre>
`;



//////////////////////////      UniqueOf

/**
 * Invalid values: null, undefined, boolean false, empty/whitespace-only strings,
 * and the strings 'null' or 'undefined' (case-insensitive). The string 'false' is valid.
 */
const isValidFilterValue = value => {
    if (value == null || value === false) return false;
    const invalidFilterStrings = new Set(['', 'null', 'undefined', ' ']);
    return ( typeof value !== 'string' ) || ( !invalidFilterStrings.has(value.trim().toLowerCase()) );
};

/** 
 * Recieves an array of objects, all with same properties, and returns an object, 
 * the properties of which are arrays of unique values found in the input array's objects.
 * Useful to create (dropdown) filters from an array of objects.
*/
exports.uniqueOf = (arrayOfObjects, arrayOfKeys=null) => {
    if (!Array.isArray(arrayOfObjects) || arrayOfObjects.length === 0) {
      return {}; // Return an empty object for invalid input
    }
    const result = {};

    // Get the keys of the first object in the array (same for all objects)
    let keys = arrayOfKeys ?? Object.keys(arrayOfObjects[0]);

    // Create a Set for each key
    keys.forEach(key => {
        result[key] = new Set();
    });

    // Iterate over the array of objects
    arrayOfObjects.forEach(item => {
        keys.forEach(key => {
            if (isValidFilterValue(item[key])) {
                result[key].add(item[key]);
            }
        });
    });

    // Convert the Sets to sorted arrays (this step is only needed for Alpine.js)
    keys.forEach(key => {
        result[key] = Array.from(result[key]).sort();
    });

    return result;
};




//////////////////////////      MultiFilter

/** Filters an Array of Objects using an Object as filters */
let multiFilter = (dataArray, filterObject, limit=null) => {

    // clear filter from null/undefined/nullish keys
    // warning! do not change filterObject (because it is passed by reference)!
     let clearedFilter = {}; 
     for (const key in filterObject) {
         if (isValidFilterValue(filterObject[key])) { clearedFilter[key]=filterObject[key] };
     }
 
   // apply filter
   let result = dataArray.filter(item => {  
       return Object.keys(clearedFilter).every(key => {
            return clearedFilter[key] === item[key]
       });
   });
 
   // return entire result or limit it
   return limit ? result.slice(0,limit) : result;
 }; 
exports.multiFilter = multiFilter;




//////////////////////////      TreeOf

let unique = (arr) => [...new Set(arr)];

/** From an array of similar objects, it extracts the unique values found for the specific key */
let uniqueValuesByKey = (arrayOfObjects, key) => {
    return unique(
        arrayOfObjects.map(item=>item[key]).filter(isValidFilterValue)
    ).sort();
};

/** Builds a tree structure from an array of objects based on the specified keys */
exports.treeOf = (arrayOfObjects, keys) => {
    const validItems = arrayOfObjects.filter(item =>
        keys.every(key => isValidFilterValue(item[key]))
    );
    let tree = {};
    tree[keys[0]] = {};
    tree[keys[1]] = {};
    let uniqueOf1 = uniqueValuesByKey(validItems,keys[0]);
    tree[keys[0]] = uniqueOf1;
    uniqueOf1.forEach(item => {
        let uniqueOf2 = uniqueValuesByKey(multiFilter(validItems,{[keys[0]]:item}),keys[1]);
        tree[keys[1]][item] = uniqueOf2;
    });
    return tree;
};
