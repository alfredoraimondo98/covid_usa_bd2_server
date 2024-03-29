const express = require('express');
const app = express();
const client = require('./utils/connection');
const airQuality = require('./routes/airquality');
const covid19 = require('./routes/covid19');
const integrationQuery = require('./routes/integrationQuery');
const lockdown = require('./routes/lockdown');
const homepage = require('./routes/homepage');
const chartsQuery = require('./routes/chartsQuery');


app.use(express.urlencoded({extended: true})); 
app.use(express.json());  

const cors = require('cors');
app.use(cors());

const clearRoutes = require ('./routes/clear');
app.use('/clear', clearRoutes);
 
const integrationRoutes = require ('./routes/integration');
app.use('/integration', integrationRoutes);
 
app.use('/airquality', airQuality);
app.use('/covid19', covid19);
app.use('/integrationQuery', integrationQuery);
app.use('/lockdown', lockdown);
app.use('/homepage', homepage);

app.use('/chartsQuery', chartsQuery);


//Connessione to atlas cloud
//const url = "mongodb+srv://admin:admin@mongodb-basi2.vxnwa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"




//app.listen(3000, () => console.log("server start")); //localhost

app.listen(process.env.PORT || 35540, () => console.log("server start on "+ process.env.PORT)); //heroku
