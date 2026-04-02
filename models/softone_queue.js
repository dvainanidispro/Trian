'use strict';

const { DataTypes }     = require('sequelize');
const { db }            = require("./database.js");



const SoftoneQueue = db.define('SoftoneQueue', {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderId: DataTypes.STRING,
    status: DataTypes.STRING,           // 'pending', 'completed', 'failed'
    // 'completed': επιτυχία, 'pending': θα γίνει προσπάθεια αργότερα, 'failed': να μην ξαναπροσπαθήσουμε (πχ αποτυχία 3 φορές)
    payload: DataTypes.JSON,            // raw order object before processing for SoftOne
    response: DataTypes.JSON,           // SoftOne response
    attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },

}, {
    tableName: 'softone_queue',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'lastAttemptAt',         // lastAttemptAt field is actually the updatedAt
});


// Alter the table in database
// SoftoneQueue.sync({ alter: true }).then(() => {
//     console.log(`\x1b[32m Ο πίνακας softone_queue είναι ΟΚ. \x1b[0m`);
// });

module.exports = SoftoneQueue;
