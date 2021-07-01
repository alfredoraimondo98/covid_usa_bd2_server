const {MongoClient} = require('mongodb');



//uri di connessione a mongo
const uri = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";

const client = new MongoClient(uri);



module.exports = client;




//Stampa database in mongodb
/*
async function listDatabases(client){
databasesList = await client.db().admin().listDatabases();

console.log("Databases:");
databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};
*/