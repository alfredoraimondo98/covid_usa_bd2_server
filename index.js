const express = require('express');
const app = express();

//const bodyParser = require('body-parser');
//app.use(bodyParser.json()); //application/json ??(is depecrated)
//bodyParser deprecato, nella nuova versione si estende l'encoded di express richiamando poi express.json()
app.use(express.urlencoded({extended: true})); 
app.use(express.json());  

const cors = require('cors');
app.use(cors());

//const authRoutes = require ('./routes/auth');


//app.use('/auth', authRoutes);
 


 
app.listen(3000, () => console.log("server start"));