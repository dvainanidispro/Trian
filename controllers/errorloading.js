"use strict";
const sendGridMail = require('@sendgrid/mail');
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);


let sendErrorLoadingEmail = () => {
    if (process.env.ENVIRONMENT=="DEVELOPMENT") {return}

    sendGridMail.send({
        to: (process.env.ENVIRONMENT=="DEVELOPMENT") ? process.env.ADMINMAIL : [process.env.ADMINMAIL, process.env.MAILTO],
        from: process.env.MAILFROM,
        subject: `API.TRIAN.GR - Πρόβλημα στην φόρτωση των προϊόντων και των πελατών`,
        text: `Πρόβλημα στην φόρτωση των προϊόντων και των πελατών. Τα προιόντα ή/και οι πελάτες δεν έχουν ενημερωθεί.`,
    }).then( () => {
        console.log(`Στάλθηκε ενημερωτικό email σε ${process.env.ADMINMAIL} και ${process.env.MAILTO}`);
    }).catch((error) => {
        console.error(error);
    });

};

module.exports = {sendErrorLoadingEmail};

