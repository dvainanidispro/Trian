'use strict';

const { DataTypes, or }     = require('sequelize');
const { db }                = require("./database.js"); 



const Order = db.define('Order', {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderId: DataTypes.STRING,
    customer: DataTypes.STRING,         // customer's email
    cart: DataTypes.JSON,
    costs: DataTypes.JSON,      // without VAT
    notes: DataTypes.STRING(500),
    test: DataTypes.BOOLEAN,

}, {
    tableName: 'orders',
    timestamps: true,
    updatedAt: false,
    createdAt: 'orderDate',         // orderDate field is actually the createdAt
    indexes: [
        {
            name: 'idx_customer_orderdate',
            fields: [       // composite index with 2 fields: customer , orderDate DESC
                'customer',
                {
                    attribute: 'orderDate',
                    order: 'DESC'
                }
            ],
        }
    ]
});


// Alter the table in database
// Order.sync({ alter: true }).then(() => {
//     console.log(`\x1b[32m Ο πίνακας orders είναι ΟΚ. \x1b[0m`);
// });

module.exports = Order;