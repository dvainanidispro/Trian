"use strict";
const nodemailer = require("nodemailer");
const sendGridMail = require('@sendgrid/mail');
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
// require('dotenv').config();


// INITIALIZE MAIL TRANSPORTER
let transporter = nodemailer.createTransport({
    host: process.env.MAILHOST,
    port: process.env.MAILPORT,
    secure: false,
    auth: {
      user: process.env.MAILUSER,
      pass: process.env.MAILPASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});



/** The body of the email that will be sent. Recipient = 'eshop' or 'customer' */
let mailBody = (order, recipient) => {

    let typeGR = function(type=null){
        let gr = {
            "frame": "Σκελετός",
            "lens": "Φακός",
            "pair": "Ζευγάρι φακών",
            "":"",
            }
         return gr[type];
    };

    let prescriptionTable = (cartItem) => /*html*/`
        <table style="text-align:center">
            <thead><tr>
                <th width="50"></th>
                <th width="50">SPH</th>
                <th width="50">CYL</th>
                <th width="50">AXIS</th>
            </tr></thead>
            <tbody>
                <tr>
                    <!-- Το <p> χρειάζεται για να εμφανίζεται σωστά στο Outlook -->
                    <td ><p>R</p></td>
                    <td >${cartItem.item.R['SPH']}</td>
                    <td >${cartItem.item.R['CYL']}</td>
                    <td >${cartItem.item.R['Axis']}</td>
                </tr>
                <tr>
                    <td><p>L</p></td>
                    <td>${cartItem.item.L['SPH']}</td>
                    <td>${cartItem.item.L['CYL']}</td>
                    <td>${cartItem.item.L['Axis']}</td>
                </tr>
            </tbody>
        </table>
        <p>Πελάτης: ${cartItem.item.retail}</p>
    `;

    // Sort the "cart" array based on the "type" property. Ζευγάρι φακών, Φακοί, Σκελετοί μαζί. 
    order.cart.sort((a, b) => {
        if (a.type < b.type) {
        return 1;
        } else if (a.type > b.type) {
        return -1;
        }
        return 0;
    });

    let countItems = function(cart){
        let count = 0;
        cart.forEach(item => {
            count += (item.type!=='pair') ? parseInt(item.quantity) : parseInt(item.quantity)*2;
        });
        return count;
    }

    let body = /*html*/`

        <!doctype html>
        <html lang="el">

        <head>

                <style>
                    table, th, td { border:1px solid black; border-collapse: collapse; padding: 8px; line-height: 1.6; }
                    /* th:first-child, td:first-child { text-align:left; }
                    td:nth-child(2) { text-align:center; }
                    td:nth-child(4) { font-weight:700; }*/
                    h2, table { margin-bottom: 10px; }
                </style>

        </head>

        <body>

        ${ (recipient=="customer") ? `<h1>Σας ευχαριστούμε για την Παραγγελία!</h1>` : ``}

        <h2>Στοιχεία παραγγελίας</h2>
        Κωδικός παραγγελίας: ${order.id} <br>
        Ημερομηνία παραγγελίας: ${(new Date()).toLocaleDateString('el-GR')}
        <br><br>
        
        <h2>Στοιχεία πελάτη</h2>
        Επωνυμία: ${order.customer['Επωνυμία']} <br>
        ΑΦΜ: ${order.customer['Α.Φ.Μ.']} <br>
        Διεύθυνση: ${order.customer['Διεύθυνση']}, ${order.customer['Τ.Κ.']}, ${order.customer['Πόλη']} <br>
        <br><br>

        <h2> Προϊόντα παραγγελίας</h2>
        <table>
            <thead><tr>
            <th>Ποσότητα</th><th>Περιγραφή</th><th>Συνταγή</th><th>Κωδικός</th><th style="text-align:left" >Τύπος</th>
            </tr></thead>
            <tbody> 
    `;


    order.cart.forEach(item => {body+= /*html*/` 
        <tr>
            <td style="text-align:center" >
                ${(item.type!=='pair') ? item.quantity : '2x'+item.quantity}
            </td>
            <td style="font-weight:700">
                ${
                        (item.type!=='pair') 
                            ? item.item["Περιγραφή"]
                            : "R: "+item.item.R["Περιγραφή"]
                            +'<br>'
                            +"L: "+item.item.L["Περιγραφή"]
                    }
            </td>
            <td>${(item.type=='pair') ? prescriptionTable(item) : ''}</td>
            <td>
                ${
                    (item.type!=='pair') 
                        ? item.item["Κωδικός"]
                        :   "R: " + item.item.R["Κωδικός"]
                          + '<br>'
                          + "L: " + item.item.L["Κωδικός"]
                }
            </td>
            <td style="text-align:left" >
                ${typeGR(item.type)}
            </td>
        </tr>
        
    `});

    body += /*html*/`
            </tbody></table>
            Σύνολο προϊόντων: ${countItems(order.cart)} <br>
        </body></html>`;

    return body;

};



/** Send Email. Recipient = 'eshop' or 'customer' */
let sendMail = (order, recipient) => {

    let recipientEmail = (recipient=='customer') ? order.customer['email'] : process.env.MAILTO;

    let mailOptions = {
        from: process.env.MAILFROM,
        to: recipientEmail,
        subject: 'Παραγγελία: ' + order.id ,
        text: 'Παραγγελία: ' + order.id,
        html: mailBody(order, recipient),
    };

    // send email with nodemailer
    /*
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return;
        }
        console.log('Στάλθηκε e-mail: %s', info.messageId);
    });
    */

    // send email with sendgrid 
    
    sendGridMail.send(mailOptions).then((response) => {
        console.log(`Στάλθηκε e-mail σε ${recipientEmail} για παραγγελία ${order.id}`);
    }).catch((error) => {
        console.error(error);
    });
    
};

module.exports = {sendMail, mailBody};