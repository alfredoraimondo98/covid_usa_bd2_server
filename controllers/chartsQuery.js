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

        //costruisce data precedente a quella richiesta
        var dateYesterday = new Date(byDataInizio);
            dateYesterday.setDate(dateYesterday.getDate() - 1);
            dateYesterday = dateFormat(dateYesterday , "yyyy-mm-dd");
            byDataInizio = dateYesterday; //aggiona bydataInizio alla data precedente (yesterday)
            

        condition['date'] = {
                $gte : byDataInizio,
                $lte : byDataFine
        }
    }
    else{ 
        if(byDataInizio != ''){
            //costruisce data precedente a quella richiesta
            var dateYesterday = new Date(byDataInizio);
            dateYesterday.setDate(dateYesterday.getDate() - 1);
            dateYesterday = dateFormat(dateYesterday , "yyyy-mm-dd");
            byDataInizio = dateYesterday; //aggiona bydataInizio alla data precedente (yesterday)
             
            condition['date'] = {"$gte" : byDataInizio};
        }
        else if(byDataFine != ''){
                condition['date'] = {"$lte" : byDataFine};
        }
    }

    var projection = {"state" : 1, "date" : 1, "cases" : 1 , "deaths" : 1};
    //var projGroup = { "_id" : {"state" : "$state", "date" : "$date"}, cases: { $sum: "$cases" }, deaths: { $sum: "$deaths" }};


    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");

        //****CREAZIONE INDICE */ 
        dbo.collection("integrazioneFinale").indexExists("state_1_date_1_cities_air_quality_1", (err, res) => { //res = false (non esiste) |true (già esiste l'indice)
            console.log("***", err, res)
            if(!res){
                dbo.collection("integrazioneFinale").createIndex({"state" : 1, "date" : 1, "cities_air_quality" : 1})
            }
        })

        //console.log("***QUERY: ", "$match (find):", condition , "\n project: ", projGroup, "\n group : {group : { _id : ", projGroup, "}} **" )

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
           // console.log(result);

            db.close();
        
            let categoriesArray = []
            let casesArray = [];
            var deathsArray = [];
            let resultArray = []; //array dati risposta per la visualizzazione della griglia
            var i=0;

            var sumCases = 0;
            var sumDeaths = 0;
            var newDeaths; var newCases;

            result.forEach(el =>{ //Crea oggetto da inviare al frontend
                categoriesArray.push(el._id.date);

                //CasesArray contiene i dati dei casi giornalieri
                //DeathsArray contiene i dati dei morti giornalieri
                if(i == 0){
                    casesArray.push(el.cases); 
                    deathsArray.push(el.deaths);
                    sumCases = sumCases + el.cases;
                    sumDeaths = sumDeaths + el.deaths;
                    newCases = el.cases; //imposta nuovo cases
                    newDeaths = el.deaths; //imposta nuovo deaths
                }
                else{
                    //casesArray.push(el.cases - sumCases);
                    
                    var diffDeaths = el.deaths - sumDeaths;
                    var diffCases = el.cases - sumCases;
            
                    if(diffDeaths < 0){ //Verifica la presenza di dati negativi per deaths
                        deathsArray.push(0); 
                        newDeaths = 0; //nuove deaths
                        deathsArray[i-1] = deathsArray[i-1] + diffDeaths; //aggiona deaths giorno precedente
                        resultArray[i-1].deaths = deathsArray[i-1] + diffDeaths; //aggiorna oggetto resultArray.deaths giorno precedente
                        sumDeaths = sumDeaths + diffDeaths;
                    }
                    else{
                        deathsArray.push(el.deaths - sumDeaths);
                        newDeaths = (el.deaths - sumDeaths); //aggiorna nuovo deaths
                        sumDeaths = sumDeaths + deathsArray[i];
                    }

                    if(diffCases < 0){ //Verifica la presenza di dati negativi per cases
                        casesArray.push(0);
                        newCases = 0; //nuovi cases
                        casesArray[i-1] = casesArray[i-1] + diffCases; //Aggiorna cases giorno precedente
                        resultArray[i-1].cases = casesArray[i-1] + diffCases; // aggiorna oggetto resultArray.cases giorno precedente
                        sumCases = sumCases + diffCases;
                    }
                    else{
                        casesArray.push(el.cases - sumCases);
                        newCases = (el.cases - sumCases); //aggiorna nuovo cases
                        sumCases = sumCases + casesArray[i];
                    }

                    //sumCases = sumCases + casesArray[i];
                }
                i++;


                resultArray.push({
                    state : el._id.state,
                    date : el._id.date,
                    cases: newCases,
                    deaths : newDeaths
                })
            })
            //console.log("resArray", resArray);

            
            //elimina il primo elemento di ogni array costruito (corrispondente alla data yesterday)
            if(byDataInizio != ''){
                categoriesArray.shift();
                casesArray.shift();
                deathsArray.shift();
                resultArray.shift();
            }
            

            if(categoriesArray.length > 0){ 
                return res.status(201).json({
                    qf_categories : categoriesArray,
                    qf_cases : casesArray,
                    qf_deaths : deathsArray,
                    result : resultArray
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
        var projection = { _id : 0, date : 1, lockdown : 1, county: 1};

        //****CREAZIONE INDICE */ 
        dbo.collection("integrazioneFinale").indexExists("state_1_lockdown_1", (err, res) => { //res = false (non esiste) |true (già esiste l'indice)
            console.log("***", err, res)
            if(!res){
                dbo.collection("integrazioneFinale").createIndex({"state" : 1, "lockdown" : 1})
            }
        })

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
    dateStart.setDate(date.getDate() - 30);
    dateStartFormatted = dateFormat(dateStart, "yyyy-mm-dd");
    //console.log("** START", dateStart, dateStartFormatted);

    //console.log("**** ", date);
    dateEnd = new Date(req.body.date);
    dateEnd.setDate(date.getDate() + 30);
    dateEndFormatted = dateFormat(dateEnd, "yyyy-mm-dd");
    //console.log("** END ", dateEnd, dateEndFormatted);

    
    let casesArray = [];
    var deathsArray = [];
    let resultArray = []; //array dati risposta per la visualizzazione della griglia
    var i=0;
    var sumCases = 0;
    var sumDeaths = 0;
    var newDeaths; var newCases;

    var categories = [];

    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");

        var condition = {"state" : state, "county": county, date : {$gte : dateStartFormatted , $lte : dateEndFormatted}};
        var projection = { _id : 0, date : 1, cases : 1, deaths : 1, state: 1, county: 1}

         //****CREAZIONE INDICE */ 
         dbo.collection("integrazioneFinale").indexExists("state_1_county_1_date_1_cities_air_quality_1", (err, res) => { //res = false (non esiste) |true (già esiste l'indice)
            console.log("***", err, res)
            if(!res){
                dbo.collection("integrazioneFinale").createIndex({"state" : 1, "county" : 1, "date" : 1, "cities_air_quality" : 1})
            }
        })

        dbo.collection("integrazioneFinale").find(condition).project(projection).sort({date : 1}).toArray(async function(err, result) {
            if(err) throw err;      
            
            db.close();

            //********* Modifica dati casi da aggragati a giornalieri

            result.forEach(el =>{ //Crea oggetto da inviare al frontend

                categories.push(el.date);

                //Dati incrementali
                casesArray.push(el.cases);
                deathsArray.push(el.deaths);
                resultArray.push({
                    date : el.date,
                    state : el.state,
                    county : el.county,
                    cases: el.cases,
                    deaths : el.deaths
                })

                //CasesArray contiene i dati dei casi giornalieri
                //DeathsArray contiene i dati dei morti giornalieri
                /*DATI GIORNALIERI */
                /*
                if(i == 0){
                    casesArray.push(el.cases); 
                    deathsArray.push(el.deaths);
                    sumCases = sumCases + el.cases;
                    sumDeaths = sumDeaths + el.deaths;
                    newCases = el.cases; //imposta nuovo cases
                    newDeaths = el.deaths; //imposta nuovo deaths
                }
                else{
                    //casesArray.push(el.cases - sumCases);
                    
                    var diffDeaths = el.deaths - sumDeaths;
                    var diffCases = el.cases - sumCases;
            
                    if(diffDeaths < 0){ //Verifica la presenza di dati negativi per deaths
                        deathsArray.push(0); 
                        newDeaths = 0; //nuove deaths
                        deathsArray[i-1] = deathsArray[i-1] + diffDeaths; //aggiona deaths giorno precedente
                        resultArray[i-1].deaths = deathsArray[i-1] + diffDeaths; //aggiorna oggetto resultArray.deaths giorno precedente
                        sumDeaths = sumDeaths + diffDeaths;
                    }
                    else{
                        deathsArray.push(el.deaths - sumDeaths);
                        newDeaths = (el.deaths - sumDeaths); //aggiorna nuovo deaths
                        sumDeaths = sumDeaths + deathsArray[i];
                    }

                    if(diffCases < 0){ //Verifica la presenza di dati negativi per cases
                        casesArray.push(0);
                        newCases = 0; //nuovi cases
                        casesArray[i-1] = casesArray[i-1] + diffCases; //Aggiorna cases giorno precedente
                        resultArray[i-1].cases = casesArray[i-1] + diffCases; // aggiorna oggetto resultArray.cases giorno precedente
                        sumCases = sumCases + diffCases;
                    }
                    else{
                        casesArray.push(el.cases - sumCases);
                        newCases = (el.cases - sumCases); //aggiorna nuovo cases
                        sumCases = sumCases + casesArray[i];
                    }

                    //sumCases = sumCases + casesArray[i];
                }
                i++;
                
                
                resultArray.push({
                    date : el.date,
                    state : el.state,
                    county : el.county,
                    cases: newCases,
                    deaths : newDeaths
                })
                */
            })

          //  console.log(result);

            if(result.length > 0){
                return res.status(201).json({
                    qf_categories : categories,
                    qf_cases : casesArray,
                    qf_deaths : deathsArray,
                    result : resultArray
                })
            }
            else{
                return res.status(204).json({})
            }  
        });
    });
}



/**
 * restituisce la lista degli stati per i quali è presente il lockdown
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
 exports.getStateWithLockdown = (req, res, next) => {

    var condition = { state : {"$exists" : true}, lockdown : {"$exists" : true} };
    var projection = { _id : 0, state : 1}
    var projGroup = {"state" : "$state", "lockdown" : "$lockdown"};

    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");

         //****CREAZIONE INDICE */ 
         dbo.collection("integrazioneFinale").indexExists("state_1_lockdown_1", (err, res) => { //res = false (non esiste) |true (già esiste l'indice)
            console.log("***", err, res)
            if(!res){
                dbo.collection("integrazioneFinale").createIndex({"state" : 1, "lockdown" : 1})
            }
        })
        


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
            console.log(result);

            db.close();

            arrayState = []
            result.forEach( el => {
                arrayState.push(el._id.state)
            }) 


            return res.status(201).json({
                state : arrayState
            })

        });
    })
}


/**
 * report dati qualità dell'aria
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getReportAirQuality = (req, res, next) => {
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

        var condition = {"state" : state, "county": county, "date" : {$gte : dateStartFormatted , $lte : dateEndFormatted}, cities_air_quality : {$exists : true}};
        var projection = { _id : 0, state : 1, county : 1, date : 1, cities_air_quality: 1}


         //****CREAZIONE INDICE */ 
         dbo.collection("integrazioneFinale").indexExists("state_1_county_1_date_1_cities_air_quality_1", (err, res) => { //res = false (non esiste) |true (già esiste l'indice)
            console.log("***", err, res)
            if(!res){
                dbo.collection("integrazioneFinale").createIndex({"state" : 1, "county" : 1, "date" : 1, "cities_air_quality" : 1})
            }
        })

        dbo.collection("integrazioneFinale").find(condition).project(projection).sort({date : 1}).toArray(async function(err, result) {
            if(err) throw err;      
            
            db.close();

            console.log(result);
            categories = [];
            airQuality = [];
            resultArray = [];

            result.forEach(el => {
                categories.push(el.date)
                airQuality.push(el.cities_air_quality[0].air_quality);

                resultArray.push({
                    state : el.state,
                    county : el.county,
                    date : el.date,
                    cities_air_quality : {
                        city : el.cities_air_quality[0].city,
                        air_quality : el.cities_air_quality[0].air_quality
                    }
                })

            })
            if(result.length > 0){
                return res.status(201).json({
                    qf_categories : categories,
                    qf_air_quality : airQuality,
                    result : resultArray
                })
            }
            else{
                return res.status(204).json({})
            }  
        });
    });
}


/**
 * media qualità dell'aria raggruppato per contea di un singolo stato
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getReportAirAverage = (req, res, next) => {
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
            condition['date'] = {"$gte" : byDataInizio};
        }
        else if(byDataFine != ''){
                condition['date'] = {"$lte" : byDataFine};
        }
    }

    condition['cities_air_quality'] = { "$exists" : true};
    //var projection = {"state" : 1, "cities_air_quality" : 1};
    //var projGroup = { "_id" : {"state" : "$state", "date" : "$date"}, cases: { $sum: "$cases" }, deaths: { $sum: "$deaths" }};
    console.log("*** ", condition)

   

    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");


        //****CREAZIONE INDICE */ 
        dbo.collection("integrazioneFinale").indexExists("state_1_date_1_cities_air_quality_1", (err, res) => { //res = false (non esiste) |true (già esiste l'indice)
            console.log("***", err, res)
            if(!res){
                dbo.collection("integrazioneFinale").createIndex({"state" : 1, "date" : 1, "cities_air_quality" : 1})
            }
        })

        //console.log("***QUERY: ", "$match (find):", condition , "\n project: ", projGroup, "\n group : {group : { _id : ", projGroup, "}} **" )

        dbo.collection("integrazioneFinale").aggregate([

            {
                "$match" :  condition  //find() 
            },
            /*{
                "$project" : projection //project()
            }, */
            {$unwind: "$cities_air_quality"}, //destruttura l'array cities_air_quality
            {
                "$group": { //groupby
                    "_id" : {"state" : "$state", "county" : "$county", "city" : "$cities_air_quality.city"}, air_average: { $avg: "$cities_air_quality.air_quality" }}
                
            }
        ]).sort({_id : 1}).toArray(async function(err, result) {
            if(err) throw err;
            console.log(result);

            db.close();

            var data = []; //Array dati formattati per il grafo
            var resultArray = [];
            result.forEach(el => {
                data.push({
                    name : el._id.city,
                    y : el.air_average
                })

                resultArray.push({
                    state : el._id.state,
                    county : el._id.county,
                    cities_air_quality : {
                        city : el._id.city,
                        air_quality : el.air_average
                    }
                })

            })

            if(result.length > 0){ 
                return res.status(201).json({
                    data : data,
                    result : resultArray
                })
            }
            else{
                return res.status(204).json({})
            } 
        }); 
    })
}


/**
 * restituisce totale dei casi (cases) covid per tutte le contee di un dato stato
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getPercentCasesByState = (req, res, next) => {

    var state = req.body.state;

    var condition = {"state" : state};

    arrayCounty = [];
    var risultatoPromise;

    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");

        
        //****CREAZIONE INDICE */ 
        dbo.collection("integrazioneFinale").indexExists("state_1_county_1_date_1_cities_air_quality_1", (err, res) => { //res = false (non esiste) |true (già esiste l'indice)
            console.log("***", err, res)
            if(!res){
                dbo.collection("integrazioneFinale").createIndex({"state" : 1, "county" : 1, "date" : 1, "cities_air_quality" : 1})
            }
        })
    
        dbo.collection("integrazioneFinale").aggregate([

            {
                "$match" :  condition  //find() 
            },
            {
                "$group": { //groupby
                    "_id" : {"state" : "$state", "county" : "$county"}}
                
            }
        ]).sort({_id : 1}).toArray(async function(err, result) {
            if(err) throw err;
           // console.log(result);

            result.forEach(el =>{
                if(el._id.county != null){
                    arrayCounty.push(el._id.county);
                }
            })
            //console.log("**** ", arrayCounty )

            
       
            risultatoPromise = await function getData(elCounty){ 

                return new Promise (resolve => { 
                   // console.log("** PROMISE IN", elCounty, state)
                    var query = { "state" : state, "county" : elCounty } //tutte le entry per una certa data e che matchano per stato o per county
                    dbo.collection("integrazioneFinale").find(query).sort({date : -1}).toArray( async function (err, result2) {
                        if(err) throw err;
                        //console.log("result query ", result2)
                        
                        resolve({
                            state : state,
                            county : elCounty,
                            cases: result2[0].cases}); //crea un array di tutte le entry che matchano la query
                    })
                })
            }
    
            //db.close();
    
            var action = arrayCounty.map(risultatoPromise); //itera la funzione getData per ogni elemento di Lockdown_us
            var resultArray = await Promise.all(action); //risolve le promise
            console.log("*** res ", resultArray);

            data = [];

            resultArray.forEach(el => {
                data.push({
                    name : el.county,
                    y : el.cases
                })
            })

            if(resultArray.length > 0){
                return res.status(201).json({
                    data : data,
                    result : resultArray
                })
            }
            else{
                return res.status(204).json({})
            }
            
        })
    });
}


/**
 * restituisce stati per i quali è prensete l'informazioni cities_air_quality
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getStateWithAirQuality = (req, res, next) => {

    var condition = { state : {"$exists" : true}, cities_air_quality : {"$exists" : true} };
    var projection = { _id : 0, state : 1}
    var projGroup = {"state" : "$state", "cities_air_quality" : "$cities_air_quality"};

    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");

          //****CREAZIONE INDICE */ 
          dbo.collection("integrazioneFinale").indexExists("state_1_cities_air_quality_1", (err, res) => { //res = false (non esiste) |true (già esiste l'indice)
            console.log("***", err, res)
            if(!res){
                dbo.collection("integrazioneFinale").createIndex({"state" : 1, "cities_air_quality" : 1})
            }
        })

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
                    "_id": projGroup
                }
            }
        ]).sort({_id : 1}).toArray(async function(err, result) {
            if(err) throw err;
            console.log(result);

            db.close();

            arrayState = []
            result.forEach( el => {
                arrayState.push(el._id.state)
            }) 


            return res.status(201).json({
                state : arrayState
            })
        });
    })
}


/**
 * restituisce la media della qualità dell'aria per tutte le città
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getAvgQoACity = (req, res, next)=> {

    var condition = {cities_air_quality : {$exists : true}}
    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");


          //****CREAZIONE INDICE */ 
          dbo.collection("integrazioneFinale").indexExists("cities_air_quality_1", (err, res) => { //res = false (non esiste) |true (già esiste l'indice)
            console.log("***", err, res)
            if(!res){
                dbo.collection("integrazioneFinale").createIndex({"cities_air_quality" : 1})
            }
        })
        //console.log("***QUERY: ", "$match (find):", condition , "\n project: ", projGroup, "\n group : {group : { _id : ", projGroup, "}} **" )

        dbo.collection("integrazioneFinale").aggregate([

            {
                "$match" :  condition  //find() 
            },
            /*{
                "$project" : projection //project()
            }, */
            {$unwind: "$cities_air_quality"}, //destruttura l'array cities_air_quality
            {
                "$group": { //groupby
                    "_id" : {"state" : "$state", "county" : "$county", "city" : "$cities_air_quality.city"}, air_average: { $avg: "$cities_air_quality.air_quality" }}
                
            }
        ]).sort({_id : 1}).toArray(async function(err, result) {
            if(err) throw err;
            console.log(result);

            db.close();

            var data = []; //Array dati formattati per il grafo
            var resultArray = [];
            result.forEach(el => {
                data.push({
                    name : el._id.city,
                    y : el.air_average
                })

                resultArray.push({
                    state : el._id.state,
                    county : el._id.county,
                    cities_air_quality : {
                        city : el._id.city,
                        air_quality : el.air_average
                    }
                })

            })

            if(result.length > 0){ 
                return res.status(201).json({
                    data : data,
                    result : resultArray
                })
            }
            else{
                return res.status(204).json({})
            } 
        }); 
    })
}


/**
 * restituisce tutte le città presenti (per i dati della qualità dell'aria)
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getCity = (req, res, next) => {

    var condition = { state : {"$exists" : true}, cities_air_quality : {"$exists" : true} };
    var projection = { _id : 0, "cities_air_quality.city" : 1}
    var projGroup = {"state" : "$state", "cities_air_quality" : "$cities_air_quality"};

    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");

          //****CREAZIONE INDICE */ 
          dbo.collection("integrazioneFinale").indexExists("state_1_cities_air_quality_1", (err, res) => { //res = false (non esiste) |true (già esiste l'indice)
            console.log("***", err, res)
            if(!res){
                dbo.collection("integrazioneFinale").createIndex({"state" : 1, "cities_air_quality" : 1})
            }
        })

        console.log("***QUERY: ", "$match (find):", condition , "\n project: ", projGroup, "\n group : {group : { _id : ", projGroup, "}} **" )


        dbo.collection("integrazioneFinale").aggregate([

            {
                "$match" :  condition  //find() 
            },
            {
                "$project" : projection //project()
            },
            {$unwind: "$cities_air_quality"}, //destruttura l'array cities_air_quality
            {
                "$group": { //groupby
                    "_id" : {"state" : "$state", "county" : "$county", "city" : "$cities_air_quality.city"}
                }
                
            }
        ]).sort({_id : 1}).toArray(async function(err, result) {
            if(err) throw err;
            console.log(result);

            db.close();

            arrayCities = []
            result.forEach( el => {
                arrayCities.push(el._id.city)
            }) 


            return res.status(201).json({
                city : arrayCities
            })
        });
    })
}


exports.getReportQoAByCity = (req, res, next) => {

    var city;
    var byDataInizio;
    var byDataFine;

    city = req.body.city;
    byDataInizio = req.body.byDataInizio;
    byDataFine = req.body.byDataFine;

    
    //Verifica condizioni query
    var condition={"cities_air_quality.city" : city};
   

    //Verifica la presenza del range temporale (data inzio - data fine)
    if(byDataInizio != '' && byDataFine != ''){

        //costruisce data precedente a quella richiesta
        var dateYesterday = new Date(byDataInizio);
            dateYesterday.setDate(dateYesterday.getDate());
            dateYesterday = dateFormat(dateYesterday , "yyyy-mm-dd");
            byDataInizio = dateYesterday; //aggiona bydataInizio alla data precedente (yesterday)
            

        condition['date'] = {
                $gte : byDataInizio,
                $lte : byDataFine
        }
    }
    else{ 
        if(byDataInizio != ''){
            //costruisce data precedente a quella richiesta
            var dateYesterday = new Date(byDataInizio);
            dateYesterday.setDate(dateYesterday.getDate() - 1);
            dateYesterday = dateFormat(dateYesterday , "yyyy-mm-dd");
            byDataInizio = dateYesterday; //aggiona bydataInizio alla data precedente (yesterday)
             
            condition['date'] = {"$gte" : byDataInizio};
        }
        else if(byDataFine != ''){
                condition['date'] = {"$lte" : byDataFine};
        }
    }

    var projection = {"_id" : 0, "date" : 1, "state" : 1, "county": 1, "cities_air_quality" : 1};
    //var projGroup = { "_id" : {"state" : "$state", "date" : "$date"}, cases: { $sum: "$cases" }, deaths: { $sum: "$deaths" }};

   

    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");


        //****CREAZIONE INDICE */
        dbo.collection("integrazioneFinale").indexExists("cities_air_quality.city_1_date_1", (err, res) => { //res = false (non esiste) |true (già esiste l'indice)
            console.log("***", err, res)
            if(!res){
                dbo.collection("integrazioneFinale").createIndex({"cities_air_quality.city" : 1, "date" : 1})
            }
        })
        



        //console.log("***QUERY: ", "$match (find):", condition , "\n project: ", projGroup, "\n group : {group : { _id : ", projGroup, "}} **" )

        dbo.collection("integrazioneFinale").aggregate([
            {$unwind: "$cities_air_quality"}, //destruttura l'array cities_air_quality
            {
                "$match" :  condition  //find() 
            },
            {
                "$project" : projection //project()
            },
           
        ]).sort({date : 1}).toArray(async function(err, result) {
            if(err) throw err;
            //console.log(result);

            db.close();
        
            var categories = [];
            var air_quality = [];
 
            result.forEach( el => {
                categories.push(el.date);
                air_quality.push(el.cities_air_quality.air_quality);
            })


            if(result.length > 0){ 
                return res.status(201).json({
                    qf_categories : categories,
                    qf_air_quality : air_quality,
                    result : result
                })
            }
            else{
                return res.status(204).json({})
            }
        });
    })
}