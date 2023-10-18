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
                <th style="text-align:left" >Τύπος</th><th>Ποσότητα</th><th>Κωδικός</th><th>Περιγραφή</th>
            </tr></thead>
            <tbody>
    `;


    order.cart.forEach(item => {body+= /*html*/` 
        <tr>
            <td style="text-align:left" >
                ${typeGR(item.type)}
            </td>
            <td style="text-align:center" >
                ${item.quantity}
            </td>
            <td>
                ${
                    (item.type!=='pair') 
                        ? item.item["Κωδικός"]
                        : "R: "+item.item.R["Κωδικός"]
                            +'<br>'
                            +"L: "+item.item.L["Κωδικός"]
                }
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