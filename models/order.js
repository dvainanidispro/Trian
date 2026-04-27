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
    costs: DataTypes.JSON,
    notes: DataTypes.STRING(500),
    reference: DataTypes.STRING(100),     // client number for the order
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


// Alter the table in database (δεν λειτουργεί πλέον σωστά στον πίνακα orders)
// Order.sync({ alter: true }).then(() => {
//     console.log(`\x1b[32m Ο πίνακας orders είναι ΟΚ. \x1b[0m`);
// });

// Δεν έχει γίνει sync το παρακάτω. Δηλώνεται ώστε το sequelize να κάνει include.
const SoftoneQueue = require('./softone_queue.js');
Order.hasOne(SoftoneQueue, { foreignKey: 'orderId', sourceKey: 'orderId' });

module.exports = Order;