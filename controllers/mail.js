"use strict";
const nodemailer = require("nodemailer");
require('dotenv').config();

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


  
/** The body of the email that will be sent */
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

        <style>
            table, th, td { border:1px solid black; border-collapse: collapse; padding: 8px; line-height: 1.6; }
            th:first-child, td:first-child { text-align:left; }
            td:nth-child(2) { text-align:center; }
            td:nth-child(4) { font-weight:bold; }
            h2, table { margin-bottom: 0.5rem; }
        </style>

        ${ (recipient=="customer") ? `<h1>Ευχαριστούμε για την Παραγγελία!</h1>` : ``}

        <h2>Στοιχεία παραγγελίας</h2>
        Κωδικός παραγγελίας: ${order.id} <br>
        Ημερομηνία παραγγελίας: ${(new Date()).toLocaleDateString('el-GR')}
        <br><br>
        
        <h2>Στοιχεία πελάτη</h2>
        ${order.customer}      
        <br><br>

        <h2> Προϊόντα παραγγελίας</h2>
        <table>
            <thead><tr>
                <th>Τύπος</th><th>Ποσότητα</th><th>Κωδικός</th><th>Περιγραφή</th>
            </tr></thead>
            <tbody>
    `;


    order.cart.forEach(item => {body+= /*html*/` 
        <tr>
            <td>
                ${typeGR(item.type)}
            </td>
            <td>
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
            <td>
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
    `;

    return body;

};




let sendMail = (order, recipient) => {

    let mailOptions = {
        from: process.env.MAILFROM,
        to: process.env.MAILTO,
        subject: 'Παραγγελία: ' + order.id ,
        // text: "Δημιουργήθηκε νέα παραγγελία",
        html: mailBody(order, recipient),
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return;
        }
        console.log('Message sent: %s', info.messageId);
    });

};

module.exports = {sendMail, mailBody};