'use strict';

const axios = require('axios');

/** Αντιστοίχιση κλειδιών της παραγγελίας με τα απαιτούμενα από το SoftOne */
const keyMap = {
    // customers
    "Κωδικός": "CODE",
    "Επωνυμία": "NAME",
    "Τίτλος": "SOTITLE",
    "email": "EMAIL",
    "Τρ.Αποστολής": "SHIPMENT",     // Το απαιτεί το SoftOne

    // frames
    "Περιγραφή": "NAME",
    // "Τιμή": "price",
    "Τιμή": "PRICEW",
    // "Παράδοση": "delivery", // SoftOne: "C5.NAME"
    "Παράδοση": "UTBL01",
    
    // lens
    "Πρόσημο": "Sign",
    "Γραφή": "Script",

    // pair
    "Axis": "Axis",
    "retail": "retail", 

};

/** Συνάρτηση που παίρνει αντικείμενο και του αλλάζει τα key names σύμφωνα με το keyMap */
function changeKeys(obj, keyMap, keepUnmatched = true) {
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
        const newKey = keyMap?.[key];
        
        if (!keepUnmatched && !newKey) {
            // Skip this key if keepUnmatched is false and no mapping exists
            continue;
        }
        
        newObj[newKey || key] = value;
    }
    return newObj;
}

/** Διαμόρφωση ενός αντικειμένου καλαθιού */
function proccessCartItem(cartItem, keepUnmatched = true) {
    let softOneCartItem = {};
    let type = cartItem.type;
    switch (type) {
        case 'frame':
            softOneCartItem = changeKeys(cartItem, keyMap, keepUnmatched);
            softOneCartItem.item = changeKeys(cartItem.item, keyMap, keepUnmatched);
            break;
        case 'lens':
            softOneCartItem = changeKeys(cartItem, keyMap, keepUnmatched);
            softOneCartItem.item = changeKeys(cartItem.item, keyMap, keepUnmatched);
            break;
        case 'pair':
            softOneCartItem = changeKeys(cartItem, keyMap, keepUnmatched);
            softOneCartItem.item = changeKeys(cartItem.item, keyMap, keepUnmatched);
            softOneCartItem.item.R = changeKeys(cartItem.item.R, keyMap, keepUnmatched);
            softOneCartItem.item.L = changeKeys(cartItem.item.L, keyMap, keepUnmatched);
            break;
    }
    return softOneCartItem;
}

/** Επιστρέφει true αν τουλάχιστον ένα παιδί του cart array ΔΕΝ είναι ΕΤΟΙΜΟΠΑΡΑΔΟΤΟ */ 
function setStockValue(cart){
    return cart.some(item => item.item.Παράδοση !== "ΕΤΟΙΜΟΠΑΡΑΔΟΤΟΣ");
}

/** Διαμόρφωση αντικειμένου order σύμφωνα με τις απαιτήσεις του SoftOne */
function proccessSoftOneOrder(order) {
    // Remember not to change the actual order object!!!
    // console.log('Processing order for SoftOne...');
    let softOneOrder = changeKeys(order, keyMap);
    softOneOrder.customer = changeKeys(order.customer, keyMap);
    softOneOrder.costs = changeKeys(order.costs, keyMap);
    softOneOrder.stock = setStockValue(order.cart);     // Πριν το softOneOrder.cart (μπορεί να αλλάξει key)
    softOneOrder.cart = order.cart.map(item => proccessCartItem(item));
    return softOneOrder;
}




/** 
 * Αποστολή παραγγελίας στο SoftOne 
 * @param {Object} order - Το αντικείμενο παραγγελίας που θα σταλεί στο SoftOne. Η συνάρτηση αναλαμβάνει να το διαμορφώσει κατάλληλα πριν την αποστολή.
 * @return {Object} Η απάντηση του SoftOne. Το JSON αντικείμενο που επιστρέφει το SoftOne έχει την εξής μορφή:
 * {
 *   "success": true,
 *   "totalcount": 2,
 *   "data": ["αριθμοί παρασταστικών σε array από strings"],
 *   "errors": ["array που προσθέτουμε εμείς αν δούμε ότι κάποια από τις απαντήσεις περιέχει 'ESoftOneError'"],
 * }
 * */
async function sendOrderToSoftOne(order) {
    try{

        let softOneOrder = proccessSoftOneOrder(order);

        const payload = {
            clientID: process.env.CLIENTID,
            data: softOneOrder
        };

        const response = await axios.post(process.env.SOFTONEORDERURL, payload, {
            responseType: 'arraybuffer',
            responseEncoding: 'binary'
        });
        const decoder = new TextDecoder('ISO-8859-7');
        const decodedResponse = decoder.decode(response.data);
        let softOneResponse = JSON.parse(decodedResponse);
        // Δείγμα softOneResponse μέχρι στιγμής:
        // {
        //   "success": true,
        //   "totalcount": 2,
        //   "data": ["αριθμοί παρασταστικών σε array από strings"]
        // }

        // Χωρίζουμε το data σε επιτυχημένες απαντήσεις και errors, αν υπάρχουν
        if (softOneResponse.data?.length) {
            // Αποτελεί error αν περιέχει 'ESoftOneError' ή αν περιέχει κενό χαρακτήρα
            const isError = s => s.includes('ESoftOneError') || s.trim().includes(' ');
            softOneResponse.errors = softOneResponse.data.filter(s => isError(s));
            softOneResponse.data = softOneResponse.data.filter(s => !isError(s));
        }

        if (softOneResponse.success) {
            console.log(`\x1b[36mΗ παραγγελία ${order.id} στάλθηκε επιτυχώς στο SoftOne. Αριθμοί παραστατικών: ${softOneResponse.data.join(', ')} \x1b[0m`);
        } else {
            console.error(`Η παραγγελία ${order.id} ΔΕΝ στάλθηκε επιτυχώς στο SoftOne. Response: ${decodedResponse}`);
        }

        return softOneResponse;
    } catch (error) {
        console.error('Error sending order to SoftOne:', error);
        return { success: false, error: error.message };
    }
}


module.exports = { sendOrderToSoftOne };