'use strict';


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




///////////////////////////        validateCart 

const {DataForCustomers} = require('../controllers/SoftOne.js');

/** Λαμβάνει ένα Cart ως array από αντικείμενα (cartItems), διορθώνει τις τιμές τους, και το επιστρέφει διορθωμένο  */
let validateCart = (cart,customer) =>{
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
            cartItem.item['Τιμή'] = +(parseFloat(cartItem.item.R['Τιμή']) + parseFloat(cartItem.item.L['Τιμή'])).toFixed(2);
        }
        return cartItem;
    });
    return validatedCart;
};



///////////////////////////////////         EXPORTS         /////////////////////////////////////

module.exports = { validateSystemToken, validateCart };