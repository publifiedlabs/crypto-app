let DBConfig = {};

require('dotenv').config();
const mysql = require('mysql');

// Database Credentials
let config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database : process.env.DB_NAME
}

// Connect To Database
const db = mysql.createConnection(config);
db.connect((error) => {
    if(error) throw error;
    console.log('MySql Connected...');
});

class Database {
    constructor(config) {
        this.connection = mysql.createConnection(config);
    }
    query(sql, args) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, args, (err, rows) => {
                if(err)
                    return reject(err);
                resolve(rows);
            });
        });
    }
    close() {
        return new Promise((resolve, reject) => {
            this.connection.end(err => {
                if(err)
                    return reject(err);
                resolve();
            });
        });
    }
}
// Close Connection on Error
Database.execute = (config, callback) => {
    const db = new Database(config);
    return callback(db).then(
        result => db.close().then(() => result),
        err => db.close().then(() => {throw err;})
    );
};

// Insert Into DBConfig For Exposure
DBConfig.mysql = mysql;
DBConfig.config = config;
DBConfig.db = db;
DBConfig.Database = Database;

module.exports = DBConfig;
