'use strict';

/** Σταθερά κόστη e-shop */
let costOf = {
    /** H τιμή της κάρτας για τα ζευγάρια φακών TRIAN με retail */
    card: 1,
    /** Το κόστος αντικαταβολής */
    cod: 1.9,

};

/** Returns a number with 2 digits */
let euro = (value) => {
    let num = parseFloat(value);
    return Math.round(num * 100) / 100; 
};


//////////////////////////      validateSystemToken

// Tokens to validate
let firebaseToken = process.env.FIREBASETOKEN;
let userToken = process.env.USERTOKEN;

/** Validate Token when it is in the URL. Can't use server.use... */
let validateSystemToken = (req,res,next) => {
    if ([firebaseToken,userToken].includes(req.params.token)) {     // validate token
        next();
        return;
    }
    res.status(403).send('Forbidden');
};




///////////////////////////        validate 

const { DataForCustomers } = require('../controllers/SoftOne.js');

let validate = {};

/** Λαμβάνει ένα Cart ως array από αντικείμενα (cartItems), διορθώνει τις τιμές τους, και το επιστρέφει διορθωμένο  
 * @param {array} cart - Το καλάθι αγορών προς επαλήθευση
 * @param {object} customer - Ο πελάτης που κάνει την αγορά (προς το παρόν ανενεργό)
*/
validate.cart = (cart,customer=null) =>{
    let validatedCart = cart.map(cartItem=>{
        if (cartItem.type==='frame') {
            let frame = DataForCustomers.frames.find(frame=>frame['Κωδικός']===cartItem.item['Κωδικός']);
            if (frame) { cartItem.item['Τιμή'] = frame['Τιμή'] }
        } else if (cartItem.type==='lens') {
            let lens = DataForCustomers.lens.find(lens=>lens['Κωδικός']===cartItem.item['Κωδικός']);
            if (lens) { cartItem.item['Τιμή'] = lens['Τιμή'] }
        } else if (cartItem.type==='pair'){
            let lensR = DataForCustomers.lens.find(lens=>lens['Κωδικός']===cartItem.item.R['Κωδικός']);
            if (lensR) { cartItem.item.R['Τιμή'] = lensR['Τιμή'] }
            let lensL = DataForCustomers.lens.find(lens=>lens['Κωδικός']===cartItem.item.L['Κωδικός']);
            if (lensL) { cartItem.item.L['Τιμή'] = lensL['Τιμή'] }
            // Επιπλέον χρέωση για ζευγάρια TRIAN:
            let cardPrice = (cartItem.item.L["Κατασκευαστής"]=="TRIAN" && cartItem.item.retail.length>1) ? costOf.card : 0;
            cartItem.cardPrice = cardPrice;
            cartItem.item['Τιμή'] = euro( 
                + parseFloat(cartItem.item.R['Τιμή']) 
                + parseFloat(cartItem.item.L['Τιμή'])
                + cardPrice
            );
        }
        return cartItem;
    });
    return validatedCart;
};

/** Επιστέφει το σύνολο του καλαθιού με βάση τα περιεχόμενά του */
let cartTotal = (cart) => {
    return cart.reduce((total, item) => total + (parseFloat(item.item['Τιμή']) * item.quantity), 0);
};


/**
 * Λαμβάνει το αντικείμενο costs της παραγγελίας, και επαληθεύει τα στοιχεία του, και το επιστρέφει διορθωμένο.
 * @param {object} costs Το αντικείμενο costs προς επαλήθευση
 * @param {object} cart Το ήδη επαληθευμένο αντικείμενο cart 
 * @param {object} customer Ο πελάτης που κάνει την αγορά
 * @returns 
 */
validate.costs = (costs, cart, customer=null) => {
    costs.cart = euro(cartTotal(cart));
    costs.shipping = euro( customer.deliveryCost + costs.cod*costOf.cod );      // costs.cod = true/false (1/0)
    costs.vat = customer.vat;
    costs.total = euro( costs.cart + costs.shipping );
    costs.totalWithVat = euro( costs.total + costs.total*costs.vat );
    return costs;
}



///////////////////////////////////         EXPORTS         /////////////////////////////////////

module.exports = { validateSystemToken, validate };