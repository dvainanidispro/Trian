const { prettyPrintJson } = require('pretty-print-json');
/** Gets an array/object in json format and returns an html that looks nice! */
exports.prettyJSON = Obj => /*html*/`
    <link rel=stylesheet href=https://cdn.jsdelivr.net/npm/pretty-print-json@2.0/dist/css/pretty-print-json.dark-mode.css>
    <pre class=json-container >
    ${prettyPrintJson.toHtml(Obj,{indent:4,trailingComma:false})}
    </pre>
`;



/** Recieves an array of objects with similar properties and returns an object, 
 * the properties of which are arrays of unique values found in the input array's objects 
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
            result[key].add(item[key]);
        });
    });

    // Convert the Sets to sorted arrays (this step is only needed for Alpine.js)
    keys.forEach(key => {
        result[key] = Array.from(result[key]).sort();
    });

    return result;
};

