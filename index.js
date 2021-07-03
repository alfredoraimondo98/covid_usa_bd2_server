const express = require('express');
const app = express();
const client = require('./utils/connection');

//const bodyParser = require('body-parser');
//app.use(bodyParser.json()); //application/json ??(is depecrated)
//bodyParser deprecato, nella nuova versione si estende l'encoded di express richiamando poi express.json()
app.use(express.urlencoded({extended: true})); 
app.use(express.json());  

const cors = require('cors');
app.use(cors());

const clearRoutes = require ('./routes/clear');
app.use('/clear', clearRoutes);
 


const integrationRoutes = require ('./routes/integration');
app.use('/integration', integrationRoutes);
 

//Query 
/*
async function query(){
    await client.connect();
    try{ 
        const result = await client.db("basi2").collection("us_cities").findOne({ city: "New York" });
                if (result) {
                    console.log("query ok ");
                    console.log(result);
                } else {
                    console.log("errore query");
                }
    
    }catch(err){
        console.log(err);
    } finally {
        await client.close();
    }
}


query().catch("err");
*/


app.listen(3000, () => console.log("server start"));