'use strict';
const { Sequelize } = require('sequelize');


/** The database connection using Sequelize */
let db = new Sequelize(
    process.env.DATABASESTRING, 
    {
        // dialectOptions: {
        //     encrypt: true
        //     decimalNumbers: true
        // },
        timezone: "Europe/Athens",                         // greek time, for writing to database   
        // query: { raw: true },       // returns queries as simple JSON objects, but can't be modified with getters
        logging: false,         // does not console log things...
        pool: {
            max: 10,
            min: 0,
            acquire: 60000,
            idle: 300000
          },
        retry: { max: 3 },
    }
); 


/** Returns a promise - resolves if the database is succesfully connected */
let dbTest = (DbConnection) => {
    return new Promise(async (resolve, reject) => {
        try{
            await DbConnection.authenticate();
            console.log(`\x1b[32m Η σύνδεση με τη Βάση Δεδομένων είναι επιτυχής.\x1b[0m`);
            resolve();
        } catch (error) {
            console.error(`\x1b[31m Unable to connect to the database:\x1b[0m`, error);
            reject();
        }
    });
};
// dbTest(db);

module.exports = { db , dbTest } ;