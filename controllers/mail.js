"use strict";
// const nodemailer = require("nodemailer");
const sendGridMail = require('@sendgrid/mail');
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);

const senderName = process.env.MAILSENDERNAME ?? "Trian-Tokai";

// INITIALIZE MAIL TRANSPORTER
// let transporter = nodemailer.createTransport({
//     host: process.env.MAILHOST,
//     port: process.env.MAILPORT,
//     secure: false,
//     auth: {
//       user: process.env.MAILUSER,
//       pass: process.env.MAILPASS,
//     },
//     tls: {
//         rejectUnauthorized: false,
//     },
// });




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
        <p>Πελάτης: <br>${cartItem.item.retail}</p>
    `;

    let maxDelivery = (deliveryValuesArray) => {
        let deliveryOrder = ["ΕΤΟΙΜΟΠΑΡΑΔΟΤΟΣ","48 ΩΡΕΣ","7-8 ΕΡΓΑΣΙΜΕΣ","10-12 ΕΡΓΑΣΙΜΕΣ"];
        return deliveryValuesArray.sort( (a,b) => deliveryOrder.indexOf(a)-deliveryOrder.indexOf(b)).pop();
    };

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

    /** Converts a number to euro format */
    const euro = (price) => (new Intl.NumberFormat('el-GR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2,
    })).format(price);



    //////////////////////////#    THE EMAIL BODY   ///////////////////////////
    /***********************   THE EMAIL BODY   ***********************/
    let body = /*html*/`

        <!doctype html>
        <html lang="el">

        <head>

                <style>
                    h1,h2,p{text-align: center;}
                    table, th, td { border:1px solid black; border-collapse: collapse; padding: 8px; line-height: 1.6; font-size: 14px; }
                    h2, table { margin-bottom: 10px; }
                </style>

        </head>

        <body style="background-color:${(recipient=="customer")?"#607d8b":"white"}; padding:1rem;">
        <div id="container "style="max-width:fit-content ;margin:auto; padding:1rem; background-color:${(recipient=="customer")?"#f5f5f5":"white"};">

        ${ (recipient=="customer") ? /*html*/`
            <div>
                <img style="display:block;margin:auto" src="https://api.trian.gr/trian.png" title="trian logo" alt="trian logo"/>
                <h1>Σας ευχαριστούμε για την παραγγελία!</h1>
            </div><br>
        ` : ''}

        <table style="border:none;" align="center">
            <tr>
                <td style="vertical-align:top; border:none;">
                                <h2 style="text-align:center">Στοιχεία πελάτη</h2>
                                <table>
                                    <tr>
                                        <td>Επωνυμία</td>
                                        <td>${order.customer['Επωνυμία']}</td>
                                    </tr>
                                    <tr>
                                        <td>ΑΦΜ</td>
                                        <td>${order.customer['ΑΦΜ']}</td>
                                    </tr>
                                    <tr>
                                        <td>Διεύθυνση</td>
                                        <td>${order.customer['Διεύθυνση']},<br>${order.customer['ΤΚ']}, ${order.customer['Πόλη']}</td>
                                    </tr>
                                    <tr>
                                        <td>E-mail</td>
                                        <td>${order.customer['email']}</td>
                                    </tr>
                                </table>
                </td>
                <td style="border:none">
                                <h2 style="text-align:center">Στοιχεία παραγγελίας</h2>
                                <table>
                                    <tr>
                                        <td>Κωδικός παραγγελίας</td>
                                        <td>${order.id}</td>
                                    </tr>
                                    <tr style="display:${(order?.reference?.length)?"table-row":"none"}">
                                        <td>Reference</td>
                                        <td>${order.reference}</td>
                                    </tr>
                                    <tr>
                                        <td>Ημερομηνία παραγγελίας</td>
                                        <td>${(new Date()).toLocaleDateString('el-GR')} </td>
                                    </tr>
                                    <tr>
                                        <td>Πλήθος προϊόντων</td>
                                        <td>${countItems(order.cart)}</td>
                                    </tr>
                                    <tr>
                                        <td>Αξία προϊόντων</td>
                                        <td> ${euro(order.costs.cart)}</td>
                                    </tr>
                                    <tr>
                                        <td>Αντικαταβολή</td>
                                        <td>${order.costs.cod?"Ναι":"Όχι"}</td>
                                    </tr>
                                    <tr>
                                        <td>Έξοδα αποστολής</td>
                                        <td>${euro(order.costs.shipping)}</td>
                                    </tr>
                                    <tr>
                                        <td><b>Σύνολο παραγγελίας</b></td>
                                        <td><b>${euro(order.costs.total)}</b></td>
                                    </tr>
                                    <tr>
                                        <td>Φ.Π.Α. (${order.costs.vat*100}%)</td>
                                        <td>${euro(order.costs.vat*order.costs.total)}</td>
                                    </tr>
                                    <tr>
                                        <td><b>Σύνολο με Φ.Π.Α.</b></td>
                                        <td><b>${euro(order.costs.totalWithVat)}</b></td>
                                    </tr>
                        
                                </table>
                </td>
            </tr>
        </table><br>







        <h2>Προϊόντα παραγγελίας</h2>
        <table align="center">
            <thead><tr>
            <th>Τμχ</th><th>Περιγραφή</th><th>Παράδοση</th><th>Συνταγή</th><th>Κωδικός</th><th>Τύπος</th><th>Τιμή</th>
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
            <td>${(item.type=='pair') ? maxDelivery([item.item.R["Παράδοση"],item.item.L["Παράδοση"]]) : item.item["Παράδοση"]}</td>
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
            <td style="text-align:center" >
                ${typeGR(item.type)}
            </td>
            <td style="text-align:center" >
                ${item.quantity} x ${euro(item.item['Τιμή'])}
            </td>
        </tr>
        
    `});

    body += /*html*/`
            </tbody></table><br>
            
            <div>
                <h2> Παρατηρήσεις:</h2>
                <p>${order.notes || "-"}</p>
            </div>
            <hr>

            ${ (recipient=="customer") ? /*html*/`
                <div><p>
                    Ν. Χ. ΤΡΙΑΝΤΑΦΥΛΛΟΥ & ΣΙΑ ΙΚΕ<br>
                    Περραιβού 10 & Βουλιαγμένης 13<br>
                    11636 Αθήνα<br>
                    2103821641 - 2109246410 - 2109246411<br>
                </p></div><br>
            ` : ''}

        </div></body></html>`;

    

    return body;

};



/** Send Email. Recipient = 'eshop' or 'customer' */
let sendMail = (order, recipient) => {

    let recipientEmail = (recipient=='customer') ? order.customer['email'] : process.env.MAILTO;

    let mailOptions = {
        from: {
            name: senderName,
            email: process.env.MAILFROM,
        },
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