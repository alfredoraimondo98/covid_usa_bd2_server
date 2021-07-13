var MongoClient = require('mongodb').MongoClient;
//const url = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
const url = "mongodb+srv://admin:admin@mongodb-basi2.vxnwa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority" //CLOUD URL
var dateFormat = require('dateformat'); 

/**
 * restituisce un aggregazione dei casi/morti covid stato in un range di date
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getCasesAndDeaths = async (req, res, next) => {

    var state;
    var byDataInizio;
    var byDataFine;

    state = req.body.state;
    byDataInizio = req.body.byDataInizio;
    byDataFine = req.body.byDataFine;

    //Verifica condizioni query
    var condition={};

    if(state){ //verifica state
        condition['state'] = state;
    }

    //Verifica la presenza del range temporale (data inzio - data fine)
    if(byDataInizio != '' && byDataFine != ''){
        condition['date'] = {
                $gte : byDataInizio,
                $lte : byDataFine
        }
    }
    else{ 
        if(byDataInizio != ''){
            condition['date'] = byDataInizio;
        }
        else if(byDataFine != ''){
                condition['date'] = byDataFine;
        }
    }

    var projection = {"state" : 1, "date" : 1, "cases" : 1 , "deaths" : 1};
    //var projGroup = { "_id" : {"state" : "$state", "date" : "$date"}, cases: { $sum: "$cases" }, deaths: { $sum: "$deaths" }};

   

    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");


        console.log("***QUERY: ", "$match (find):", condition , "\n project: ", projGroup, "\n group : {group : { _id : ", projGroup, "}} **" )

        dbo.collection("integrazioneFinale").aggregate([

            {
                "$match" :  condition  //find() 
            },
            {
                "$project" : projection //project()
            },
            {
                "$group": { //groupby
                    "_id" : {"state" : "$state", "date" : "$date"}, cases: { $sum: "$cases" }, deaths: { $sum: "$deaths" }}
                
            }
        ]).sort({_id : 1}).toArray(async function(err, result) {
            if(err) throw err;
            console.log(result);

            db.close();
        
            let categoriesArray = []
            let casesArray = [];
            let deathsArray = [];
            result.forEach(el =>{ //Crea oggetto da inviare al frontend
                categoriesArray.push(el._id.date);
                casesArray.push(el.cases);
                deathsArray.push(el.deaths);
            })
            //console.log("resArray", resArray);

            if(categoriesArray.length > 0){ 
                return res.status(201).json({
                    qf_categories : categoriesArray,
                    qf_cases : casesArray,
                    qf_deaths : deathsArray
                })
            }
            else{
                return res.status(204).json({})
            }
        });
    })
}



/**DA RIVEDEREEEEE  */
exports.getCasesTwoStates = (req, res, next) => {

    var state1;
    var state2
    var byDataInizio;
    var byDataFine;

    state1 = req.body.state1;
    state2 = req.body.state2;
    byDataInizio = req.body.byDataInizio;
    byDataFine = req.body.byDataFine;

    //Verifica condizioni query
    var condition={};

    if(state1){ //verifica state
        condition['state'] = state1;
    }

    //Verifica la presenza del range temporale (data inzio - data fine)
    if(byDataInizio != '' && byDataFine != ''){
        condition['date'] = {
                $gte : byDataInizio,
                $lte : byDataFine
        }
    }
    else{ 
        if(byDataInizio != ''){
            condition['date'] = byDataInizio;
        }
        else if(byDataFine != ''){
                condition['date'] = byDataFine;
        }
    }

    var projection = {"state" : 1, "date" : 1, "cases" : 1 };
    var projGroup = { "state" : "$state", "date" : "$date", cases: { $sum: "$cases" }};

    var categoriesArray = []
    var casesArray = [];

    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");


        console.log("***QUERY: ", "$match (find):", condition , "\n project: ", projGroup, "\n group : {group : { _id : ", projGroup, "}} **" )


        //query stato 1
        dbo.collection("integrazioneFinale").aggregate([

            {
                "$match" :  condition  //find() 
            },
            {
                "$project" : projection //project()
            },
            {
                "$group": { //groupby
                    "_id": projGroup
                }
            }
        ]).sort({_id : 1}).toArray(async function(err, result) {
            if(err) throw err;
           // console.log(result);

            //db.close();
        
            
            result.forEach(el =>{ //Crea oggetto da inviare al frontend
                categoriesArray.push(el._id.date);
                casesArray.push(el._id.cases);
            })
            //console.log("resArray", resArray);

            
        });
    



    //query stato 2
    
    if(state2){ //verifica state
        condition['state'] = state2;
    }
    var categoriesArray2 = []
    var casesArray2 = [];
    dbo.collection("integrazioneFinale").aggregate([

        {
            "$match" :  condition  //find() 
        },
        {
            "$project" : projection //project()
        },
        {
            "$group": { //groupby
                "_id": projGroup
            }
        }
    ]).sort({_id : 1}).toArray(async function(err, result) {
        if(err) throw err;
      //  console.log(result);

        db.close();


        result.forEach(el =>{ //Crea oggetto da inviare al frontend
            categoriesArray2.push(el._id.date);
            casesArray2.push(el._id.cases);
        })
        //console.log("resArray", resArray);
       
     
        var date1 = new Date(categoriesArray[0]);
        var date2 = new Date(categoriesArray2[0]);
        var x = Math.abs(date1 - date2)/(1000*3600*24);
        var arrayAggiunta = [];
        
        for(var i = 0 ; i < x ; i++){
            arrayAggiunta.push(0)
        }
        
        if(date1 > date2){
            Array.prototype.push.apply(arrayAggiunta, casesArray);
            casesArray = arrayAggiunta;
        }
        else{
            Array.prototype.push.apply(arrayAggiunta, casesArray2);
            casesArray2 = arrayAggiunta;
        }

        console.log(" *** DIM ", categoriesArray2.length, categoriesArray.length)
        if(categoriesArray.length > 0 || categoriesArray2 > 0){ 
            return res.status(201).json({
                categories : categoriesArray,
                cases : casesArray,
                categories2 : categoriesArray2,
                cases2 : casesArray2
            })
        }
        else{
            return res.status(204).json({})
        }
        
    });
})
    
}


/**
 * restituisce i lockdown dello stato passato come parametro
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getLockdown = (req, res, next) => {

    var state;

    state = req.body.state;

    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");

        var condition = {"state" : state, "lockdown" : {$exists : true} };
        var projection = { _id : 0, date : 1, lockdown : 1, county: 1}

        dbo.collection("integrazioneFinale").find(condition).project(projection).toArray(async function(err, result) {
            if(err) throw err;      
            
            db.close();

            console.log(result);

            //formattazione risposta
            arrayResult = [];
            result.forEach( rEl =>{
                arrayResult.push({
                    tipo : rEl.lockdown,
                    data : rEl.date,
                    contea : rEl.county
                });
            })

            if(result.length > 0){
                return res.status(201).json({
                    lockdown : arrayResult
                })
            }
            else{
                return res.status(204).json({})
            }  
        });
    });
}



/**
 * restituisce il report casi pre/post lockdown sulla base di uno stato di ricerca
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getReportCases = (req, res, next) => {

    const range = 2;
    var state;
    var county;
    var date;
    var lockdown;
    
    var dateFormatted;
    var dateStartFormatted;
    var dateEndFormatted;
    var dateStart;
    var dateEnd;


    state = req.body.state;
    county = req.body.county;
    date = new Date(req.body.date); //start ritorna all lockdown date
    dateFormatted = dateFormat(new Date(req.body.date), "yyyy-mm-dd");
    lockdown = req.body.lockdown;
  
    //console.log("*** DATA RICHIESTA ", date, dateFormatted)
  
    console.log(date);

    dateStart = new Date(req.body.date);
    dateStart.setDate(date.getDate() - 15);
    dateStartFormatted = dateFormat(dateStart, "yyyy-mm-dd");
    //console.log("** START", dateStart, dateStartFormatted);

    //console.log("**** ", date);
    dateEnd = new Date(req.body.date);
    dateEnd.setDate(date.getDate() + 15);
    dateEndFormatted = dateFormat(dateEnd, "yyyy-mm-dd");
    //console.log("** END ", dateEnd, dateEndFormatted);

    

    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");

        var condition = {"state" : state, "county": county, date : {$gte : dateStartFormatted , $lte : dateEndFormatted}};
        var projection = { _id : 0, date : 1, cases : 1, deaths : 1, state: 1, county: 1}

        dbo.collection("integrazioneFinale").find(condition).project(projection).toArray(async function(err, result) {
            if(err) throw err;      
            
            db.close();

          //  console.log(result);

            if(result.length > 0){
                return res.status(201).json({
                    report : result
                })
            }
            else{
                return res.status(204).json({})
            }  
        });
    });
}