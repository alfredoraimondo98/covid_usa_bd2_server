var MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
const MultiKeyMap = require("multikeymap");

const clearController = require("../controllers/clear");
const integrationController = require("../controllers/integration");

var integrationCitiesAir;
var integrationCovidLockdown; 

/**
 * integra us_cities e air quality
 * 
 * Es JSON
 *  {
        date: '2019-08-15',
        city: 'Springfield',
        county: 'Hampden',
        state: 'Massachusetts',
        value_air: '24.0'
    }
 * 
 */
exports.integrationCitiesAirQuality = async () => {
    var promise = new Promise(async function(resolvee, reject) {
    
        var promiseAirQuality = clearController.selectAirQualityUSA(); //chiama il metodo che ritorna la promise
        const resultAirQualityUSA = await promiseAirQuality; //attende che risolve la promise
       // console.log("ritorno AIR", resultAirQualityUSA);
        
        var arrayIntegration = [];
        var res;
        var CitiesAirMap = new Map();

        MongoClient.connect(url, async function(err, db) {
            if (err) throw err;
            var dbo = db.db("basi2");
            
            dbo.collection("us_cities").createIndex({city : 1}) //Creazione indice sul campo city di us_cities per velocizzare la query
    
        //Aggiunta campo contea e stato associata alla città
        risultatoPromise = await function getResultUsCities(elementAir) { //funzione che effettua query su lockdown
            return new Promise( resolve => { //crea una nuova promise per ogni query/iterazione (sostituisce il forEach)
                    var queryCity = {city : elementAir.CITY };
                    var projectionCity = { city : 1, population: 1, county_name : 1, state_name : 1, _id : 0};
                    var sortCity = {population : -1};
                    dbo.collection("us_cities").find(queryCity).project(projectionCity).sort(sortCity).toArray(async function(err, resultCity) {
                        if(err) throw err;
                        
                        //console.log("result CITY ", resultCity);
        
                        //Se viene trovata una corrispondenza, riporta state e county nell'oggetto air_quality
                        if(resultCity[0] != undefined){
                            entry = {   
                                date : elementAir.DATE,
                                city : elementAir.CITY,
                                county : resultCity[0].county_name,
                                state : resultCity[0].state_name,
                                value_air : elementAir.VALUE
                            }
                            resolve(entry);
                          //  console.log("****",entry);
                         // CitiesAirMap.set( (entry.date, entry.) , entry);
                        }
                        else{ //Se nessuna corrispondenza per quella città è presente, memorizza solo i dati relativi all'air_quality
                            entry = {   
                                date : elementAir.DATE,
                                city : elementAir.CITY,
                                value_air : elementAir.VALUE    
                            } 
                            resolve(entry);                      
                          //  console.log("****",entry);
                        }
                       // console.log("ENTRY" , entry);
                       // arrayIntegration.push(entry); //Aggiunge la nuova entry all'array di integrazione.
                    })  
                
            });        
        };
    
        var actions = resultAirQualityUSA.map(risultatoPromise); //itera i risultati dei lockdown richiamando la funzione risultatoPromise, memorizzando in action le promise in pending
        res = await Promise.all(actions); //esegue le promise ottenute, memorizznaod i risultati in res.
        
        //(await dbo.createCollection("Cities&Air")).insertMany(res); 




        resolvee(res);
        db.close();
         
        
    });
  
    // (await dbo.createCollection("NewAirCollection2")).insertMany(arrayIntegration); 

    });

    return promise;    
}

/*    
exports.integrationCitiesAirQuality = async () => {
    var promise = new Promise(async function(resolve, reject) {

    var promiseAirQuality = clearController.selectAirQualityUSA(); //chiama il metodo che ritorna la promise
    const resultAirQualityUSA = await promiseAirQuality; //attende che risolve la promise
    console.log("ritorno AIR", resultAirQualityUSA);
    
    var arrayIntegration = [];
    
    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");
        
        dbo.collection("us_cities").createIndex({city : 1}) //Creazione indice sul campo city di us_cities per velocizzare la query

    //Aggiunta campo contea e stato associata alla città
        resultAirQualityUSA.forEach( elementAir => { 
            var queryCity = {city : elementAir.CITY };
            var projectionCity = { city : 1, population: 1, county_name : 1, state_name : 1, _id : 0};
            var sortCity = {population : -1};
            dbo.collection("us_cities").find(queryCity).project(projectionCity).sort(sortCity).toArray(async function(err, resultCity) {
                if(err) throw err;
                
                //console.log("result CITY ", resultCity);

                //Se viene trovata una corrispondenza, riporta state e county nell'oggetto air_quality
                if(resultCity[0] != undefined){
                    entry = {   
                        date : elementAir.DATE,
                        city : elementAir.CITY,
                        county : resultCity[0].county_name,
                        state : resultCity[0].state_name,
                        value_air : elementAir.VALUE
                    }
                  //  console.log("****",entry);
                }
                else{ //Se nessuna corrispondenza per quella città è presente, memorizza solo i dati relativi all'air_quality
                    entry = {   
                        date : elementAir.DATE,
                        city : elementAir.CITY,
                        value_air : elementAir.VALUE     
                    }                       
                  //  console.log("****",entry);
                }
               // console.log("ENTRY" , entry);
                arrayIntegration.push(entry); //Aggiunge la nuova entry all'array di integrazione.
            })
        });
        
       // (await dbo.createCollection("NewAirCollection2")).insertMany(arrayIntegration); 
    });
    
    resolve(arrayIntegration);
});
   // console.log("ritorno ARRAYINTEGRATION", arrayIntegration);
 //  integrationCitiesAir = arrayIntegration;
    return promise;
}
*/





/**
 * integra us_covid e lockdown_us
 * NB. in lockdown_us non tutte le entry possiedono sia State che County.
 * Es JSON
 *  {
*       date: '2020-02-07',
        county: 'Maricopa',
        state: 'Arizona',
        cases: '1',
        deaths: '0.0',
        type : 'Stay at home'
 *  }
 * 
 */ 
/*
exports.integrationCovidLockdownUS = async () => {
    var promise = new Promise(async function(resolve, reject) {

        var promiseLockdown = clearController.selectLockdownUSA();
        const resultLockdownUS = await promiseLockdown; //dati ripuliti di lockdown
       // console.log("ritorno lockdown DATA", resultLockdownUS);

       var promiseCovidData = clearController.selectAllCovidData();
       const resultCovidData = await promiseCovidData; //dati ripuliti di lockdown
        
        newCollection = [];

        var risultatoPromise;

            MongoClient.connect(url, async function(err, db) {
                if (err) throw err;
                var dbo = db.db("basi2");
                var entry;
            //    dbo.createCollection("lockdown33") //Crea la nuova collezione in cui inserire i dati integrati
        
                risultatoPromise = await function getResultLockdownUS(elementLockdown) { //funzione che effettua query su lockdown
                    return new Promise( resolve => { //crea una nuova promise per ogni query/iterazione (sostituisce il forEach)

                            var queryCovid = { date : elementLockdown.Date};
                            var projectionCovid = {};
                            dbo.collection("us_counties_covid19_daily").find(queryCovid).project(projectionCovid).toArray(async function(err, resultCovid) { //query
                                if(err) throw err;
                               // console.log("***IIIII*", resultCovid[0]);
                                //Se viene trovata una corrispondenza, riporta state e county nell'oggetto air_quality
                                if(resultCovid[0] != undefined && elementLockdown.State == resultCovid.state){ //verifica se matcha per stato
                                    if(elementLockdown.County == resultCovid.county){ // Verifica se matcha anche per contea
                                        entry = { //Crea entry con stato e contea
                                            _id : resultCovid[0]._id, 
                                            date : elementLockdown.Date,
                                            state : elementLockdown.State,
                                            type : elementLockdown.Type,
                                            county : resultCovid[0].county,
                                            cases : resultCovid[0].cases,
                                            deaths : resultCovid[0].deaths,
                                        } 
                                      //  console.log("ENTRYYYYYY", entry);
                                        resolve(entry); //resolve -> restituisce come risultato della promise la entry appena creata
                                    }
                                    else{ //Altrimenti crea entry solo con state
                                        entry = {
                                            _id : resultCovid[0]._id, 
                                            date : elementLockdown.Date,
                                            state : elementLockdown.State,
                                            type : elementLockdown.Type,
                                            cases : resultCovid[0].cases,
                                            deaths : resultCovid[0].deaths,
                                        } 
                                        resolve(entry); 
                                    }
                                }
                                else{
                                    console.log("Nessuna corrispondenza trovata"); //Se non viene trovato nessun match per county/state
                                    resolve(1); //se non vi è alcuna corrispondenza
                                }
                            })                        
                        });        
                    };
            

            var actions = resultLockdownUS.map(risultatoPromise); //itera i risultati dei lockdown richiamando la funzione risultatoPromise, memorizzando in action le promise in pending
            var res = await Promise.all(actions); //esegue le promise ottenute, memorizznaod i risultati in res.
           // console.log("*******RISSS", res); 
           
            console.log(" RESULT COVID DATA ", resultCovidData);
            console.log(" ////////////////////////////////////////////////RES " , res);
            //Sostituire i dati covid con quelli covid+lockdwon
            resultCovidData.forEach(elementCovid =>{  //console.log(" **** ", elementCovid);
                var flag = true;
                res.forEach(elementLockdown => { // console.log("***** ", elementLockdown)
                    if(elementCovid._id.equals(elementLockdown._id)){
                      //  console.log("SI IF", elementLockdown);
                        
                        newCollection.push( //[elementLockdown.date, elementLockdown.county, elementLockdown.state ], 
                            { //crea entry con informazioni relative al lockdown
                            date : elementLockdown.date,
                            county : elementLockdown.county,
                            state : elementLockdown.state,
                            cases : elementLockdown.cases,
                            deaths : elementLockdown.deaths,
                            type : elementLockdown.type //type lockdown
                        }); 
                        flag = false;
                    }
                    else{
                    }
                });
                if(flag){ //console.log("NO IF")
                    newCollection.push( //[elementCovid.date, elementCovid.county, elementCovid.state], 
                        { //crea entry senza informazioni lockdown
                        date : elementCovid.date,
                        county : elementCovid.county,
                        state : elementCovid.state,
                        cases : elementCovid.cases,
                        deaths : elementCovid.deaths
                    });
                } 
            });

        

//        console.log("newCollection.size", newCollection );    
        //(await dbo.createCollection("Covid&Lockdownv2")).insertMany(newCollection.toArray()); 
        resolve(newCollection);
        db.close();


        }); //Fine mongo.connect

    });

    return promise;
}
    
*/


/** IERI */ 
  
  /**********************ULTIMA VERSIONE NON FUNZIONA COMUNQUE  */
exports.integrationCovidLockdownUSOld = async () => {
    var promise = new Promise(async function(resolve, reject) {

        var promiseLockdown = clearController.selectLockdownUSA();
        const resultLockdownUS = await promiseLockdown; //dati ripuliti di lockdown
      //  console.log("ritorno lockdown DATA", resultLockdownUS);

       var promiseCovidData = clearController.selectAllCovidData();
       const resultCovidData = await promiseCovidData; //dati ripuliti di lockdown
      // console.log("ritorno resultCovidData ", resultCovid);

       newCollection = [];

        var risultatoPromise;
        var risultatoPromiseState;
            MongoClient.connect(url, async function(err, db) {
                if (err) throw err;
                var dbo = db.db("basi2");
                var entry;

                //    dbo.createCollection("lockdown33") //Crea la nuova collezione in cui inserire i dati integrati
        
                risultatoPromise = await function getResultLockdownUS(elementLockdown) { //funzione che effettua query su lockdown
                    return new Promise( resolve => { //crea una nuova promise per ogni query/iterazione (sostituisce il forEach)

                            var queryCovid = { date : elementLockdown.Date };
                            var projectionCovid = {};
                            dbo.collection("us_counties_covid19_daily").find(queryCovid).project(projectionCovid).toArray(async function(err, resultCovidArray) { //query
                                if(err) throw err;
                              //  console.log("***IIIII*", resultCovid);
                                var flag = true;
                                resultCovidArray.forEach( resultCovid => {
                                    if(flag){ 
                                    //Se viene trovata una corrispondenza, riporta state e county nell'oggetto air_quality
                                    if(elementLockdown.State == resultCovid.state){ //verifica se matcha per stato
                                    // console.log("resultCovidElemento" , resultCovid)
                                   // console.log("into state");
                                        if(elementLockdown.County == resultCovid.county){ // Verifica se matcha anche per contea
                                     //      console.log("CONTEAA")
                                            entry = { //Crea entry con stato e contea
                                                _id : resultCovid._id, 
                                                date : elementLockdown.Date,
                                                state : elementLockdown.State,
                                                type : elementLockdown.Type,
                                                county : elementLockdown.County,
                                                cases : resultCovid.cases,
                                                deaths : resultCovid.deaths,
                                            } 
                                          console.log("ENTRYYYYYY CONTEA", entry);
                                         // resolve(entry);
                                            //resolve(entry); //resolve -> restituisce come risultato della promise la entry appena creata
                                            flag = false;
                                        }
                                    /*    else{ //Altrimenti crea entry solo con state
                                            entry = {
                                                _id : resultCovid._id, 
                                                date : elementLockdown.Date,
                                                state : elementLockdown.State,
                                                type : elementLockdown.Type,
                                                cases : resultCovid.cases,
                                                deaths : resultCovid.deaths,
                                            } 
                                           // console.log("ENTRYYYYYY STATO", entry);

                                           // resolve(entry); 
                                        } */
                                    }
                                    else{
                                      //  console.log("Nessuna corrispondenza trovata"); //Se non viene trovato nessun match per county/state
                                      // resolve(entry); //se non vi è alcuna corrispondenza
                                     // entry = {};
                                    // resolve(1)
                                    }
                                }
                                })
                                
                                //resolve(entry);
                                if(entry != undefined){
                                    resolve(entry);
                                }
                                else{
                                    reject();
                                }
                            })      
                  
                        });      
  
                    };
            
//***CREAZIONE COLLECTION STATO */
risultatoPromiseState = await function getResultLockdownUS(elementLockdown) { //funzione che effettua query su lockdown
    return new Promise( resolve => { //crea una nuova promise per ogni query/iterazione (sostituisce il forEach)

            var queryCovid = { date : elementLockdown.Date };
            var projectionCovid = {};
            dbo.collection("us_counties_covid19_daily").find(queryCovid).project(projectionCovid).toArray(async function(err, resultCovidArray) { //query
                if(err) throw err;
              //  console.log("***IIIII*", resultCovid);
                var flag = true;
                resultCovidArray.forEach( resultCovid => {
                    if(flag){
                    //Se viene trovata una corrispondenza, riporta state e county nell'oggetto air_quality
                    if(elementLockdown.State == resultCovid.state && elementLockdown.county == undefined){ //verifica se matcha per stato
                    // console.log("resultCovidElemento" , resultCovid)
                   // console.log("into state");
                            entry = {
                                _id : resultCovid._id, 
                                date : elementLockdown.Date,
                                state : elementLockdown.State,
                                type : elementLockdown.Type,
                                cases : resultCovid.cases,
                                deaths : resultCovid.deaths,
                            } 
                           // resolve(entry)
                            console.log("ENTRYYYYYY STATO", entry);
                            flag = false;
                        }
                        else{
                           // resolve(1); 
                        }
                    };
                })
                if(entry != undefined){
                    resolve(entry);
                }
                else{
                    reject();
                }
               
            })      
        });      
    };

            var actions = resultLockdownUS.map(risultatoPromise); //itera i risultati dei lockdown richiamando la funzione risultatoPromise, memorizzando in action le promise in pending
            var res = await Promise.all(actions); //esegue le promise ottenute, memorizznado i risultati in res.


            var actionState = resultLockdownUS.map(risultatoPromiseState);
            var resState = await Promise.all(actionState);

           resState.forEach(el => {console.log("el -> ", el)});
         //  console.log("***RES STATE", resState ); 
        /*   res.forEach( el => {
               if(el.county){
                   console.log("**** ", el);
               }
           })
          */  

           //Unione res (contea) e resState (stato)
           lockdownCollection = new Set();
           res.forEach( el => {
               if(el != 1) {
                    lockdownCollection.add(el);
               }
           })
           resState.forEach( el => {
               if(el != 1){ 
                    lockdownCollection.add(el);
               }
           })
           console.log("*****lockdownCollection" , lockdownCollection)

            //Sostituire i dati covid con quelli covid+lockdwon
            resultCovidData.forEach(elementCovid =>{ 
                var flag = true; 
                lockdownCollection.forEach(elementLockdown => { // console.log(" **** ", elementLockdown, elementCovid._id)
                    if(elementLockdown != undefined){ 
                        if(flag && elementCovid._id.equals(elementLockdown._id)){
                        //   console.log("SI IF", elementLockdown);
                            if(elementLockdown.county){  //Verifica la presenza della contea
                            //console.log("county ", elementLockdown.county)

                                newCollection.push({ //crea entry con informazioni relative al lockdown
                                    date : elementLockdown.date,
                                    county : elementLockdown.county,
                                    state : elementLockdown.state,
                                    cases : elementLockdown.cases,
                                    deaths : elementLockdown.deaths,
                                    type : elementLockdown.type //type lockdown
                                }); 
                                flag = false;
                            }
                            else{ //se non è presente la contea
                                newCollection.push({ //crea entry con informazioni relative al lockdown
                                    date : elementLockdown.date,
                                    state : elementLockdown.state,
                                    cases : elementLockdown.cases,
                                    deaths : elementLockdown.deaths,
                                    lockdown : {
                                        type : elementLockdown.type
                                    } //type lockdown
                                }); 
                                flag = false;
                            }
                        }
                        else{
                            //nothing
                        }
                    }
                });
                if(flag){
                    newCollection.push({ //crea entry senza informazioni lockdown
                        date : elementCovid.date,
                        county : elementCovid.county,
                        state : elementCovid.state,
                        cases : elementCovid.cases,
                        deaths : elementCovid.deaths
                    });
                }  
            });

        

  //   console.log("newCollection.size", newCollection.length );    
       (await dbo.createCollection("Covid&LockdownvXXX")).insertMany(newCollection); 
        resolve(newCollection);
       // db.close();

        }); //Fine mongo.connect

    });

    return promise;
}
    
  
    /**********************FINEE ULTIMA VERSIONE NON FUNZIONA COMUNQUE  */

 
/* FINE IERI*/








//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$NEW INTEGRATION COVID-LOCKDOWN
/**
 * 
 * @returns newCollection da sovrascrivere a us_covid
 */
async function getCovidAndLockdown () {
var p = new Promise(async function (resolve) {  //Promise esterna per ritornare l'intera newCollection
    var promiseCovidData = clearController.selectAllCovidData(); 
    const resultCovidData = await promiseCovidData; //Covid _ us _daily data
    //console.log("resultCovidData", resultCovidData);


    var promiseLockdownData = clearController.selectLockdownUSA();
    const resultLockdownData = await promiseLockdownData; //lockdown_us
    //console.log("resultLockdownData", resultLockdownData);

    var risultatoPromise;
    var newCollection = new Set();
   
    var promiseNewCollection;
    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");


        risultatoPromise = await function getData(elLockdown){ 

            return new Promise (resolve => { 
                
                var query = { date : elLockdown.Date , $or: [ {state : elLockdown.State} , {county : elLockdown.County} ] } //tutte le entry per una certa data e che matchano per stato o per county
                dbo.collection("us_counties_covid19_daily").find(query).forEach( async function (result) {
                    if(err) throw err;
                    //console.log("result query ", result)
                    
                    resolve(result); //crea un array di tutte le entry che matchano la query
                })
            })
        }


        var action = resultLockdownData.map(risultatoPromise); //itera la funzione getData per ogni elemento di Lockdown_us
        var res = await Promise.all(action); //risolve le promise
        console.log("res ** ", res);

        
        // Aggiunta del type lockdown ai dati covid_us
        var cont = 0;
        res.forEach(elResult => { 
            resultLockdownData.forEach(elLockdown => { cont++;
                var entry;
                if(elLockdown.State == elResult.state && !elLockdown.County){
                    entry = {
                        _id : (elResult._id).toString(), //id elemento di covid_us
                        date : elResult.date,
                        county : elResult.county,
                        state : elResult.state,
                        cases : elResult.cases,
                        deaths : elResult.deaths,
                        type : elLockdown.Type //type lockdown di lockdown_us
                    }
                }
                else if(elLockdown.State == elResult.state && elLockdown.County == elResult.county){
                    entry = {
                        _id : (elResult._id).toString(), //id elemento di covid_us
                        date : elResult.date,
                        county : elResult.county,
                        state : elResult.state,
                        cases : elResult.cases,
                        deaths : elResult.deaths,
                        type : elLockdown.Type //type lockdown di lockdown_us
                    }
                }
                //console.log("entry ", entry);
                if(entry != undefined){ 
                    newCollection.add(entry);
                }
            })
        });
        
        

       // console.log("**** new collection ", newCollection)

       // db.close();

     
      
        resolve(newCollection) //resolve newCollection

    });
   

}) //fine promise esterna
return p;
}




/**
 * integrazione del ritorno di getCovidAndLockdown con covid_us
 */
exports.integrationCovidLockdownUS = async () => {
    var p = new Promise(async function (resolve) {  //Promise esterna per ritornare l'intera newCollection
    
    var newCollection = getCovidAndLockdown()
    var resNewCollection = await newCollection; //dati lockdown con type
    //console.log("*** newCollection", resNewCollection.size);


    var covidData = clearController.selectAllCovidData();
    var resCovidData = await covidData; 
    //console.log("covid data", resCovidData);
   

    var finalIntegration = [];
    console.log("lavoro");

/*
    var mapCovid = new Map();
    resCovidData.forEach(elCovid => {
        mapCovid.set((elCovid._id).toString(), elCovid);
    })
*/
    //console.log(" 2 *** ", mapCovid.get(ObjectId("2020-03-25")));

//var j = 0;
    //Creazione mappa newCollection
    var mapNewCollection = new Map();
    resNewCollection.forEach(elNewCollection => { 
  //      console.log("+++ ", j++);
        mapNewCollection.set(elNewCollection._id, elNewCollection);
    })

   // console.log("MAP NEW COLL ", mapNewCollection.size)
    //console.log("MAPPA New collection", resNewCollection);
    //var i = 0;
    
    resCovidData.forEach(elCovid => {
        if(mapNewCollection.get( (elCovid._id).toString() )){
            //console.log("***Si if")
            //console.log(" --- ", i , mapNewCollection.size); i++;
            finalIntegration.push(mapNewCollection.get( (elCovid._id).toString() ));
        }
        else{
            finalIntegration.push(elCovid);
        }
    })

    //console.log("***FINAL INTEGRATION ", finalIntegration);
   // console.log("***FINAL INTEGRATION Size ", finalIntegration.length);

    
 /*   resCovidData.forEach( elCovid =>{ 
        console.log("elcovid", elCovid)
        if(elCovid){ 
            resNewCollection.forEach (elNewCollection => { console.log("elNewC", elNewCollection)
                if(elNewCollection){
                    if(elCovid._id == elNewCollection._id){
                        console.log("SI IF");
                        finalIntegration.add(elNewCollection);
                    }
                    else{
                        finalIntegration.add(elCovid);
                    }
                }
            })     
        }   
    })
    */
    
   // console.log("final integration", finalIntegration);

    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");
       // (await dbo.createCollection("Covid&Lockdown")).insertMany(finalIntegration); //Crea la collezione
        //db.close();
    } )

    resolve(finalIntegration);
    
    });   
    return p;
}








exports.integrationCovidLockdownAirQuality = async () => {

    var promiseCovidLockdown = integrationController.integrationCovidLockdownUS();
    const resultCovidLockdown = await promiseCovidLockdown; //dati ripuliti di Covid&Lockdown
   // console.log("**** RESULT COVID LOCK ", resultCovidLockdown)

/*  var covidLockdownMap = new MultiKeyMap();
    resultCovidLockdown.forEach( el => {
        covidLockdownMap.set( [el.date, el.county, el.state], el); //date , city, county, state
    })
*/

    var promiseCitiesAirQuality = integrationController.integrationCitiesAirQuality();
    const resultCitiesAirQuality = await promiseCitiesAirQuality; //dati ripuliti di Cities&Air

    var citiesAirMap = new MultiKeyMap();
    resultCitiesAirQuality.forEach( el => {
        if(citiesAirMap.get( [el.date, el.county, el.state ] )){ 
            var array = citiesAirMap.get( [el.date, el.county, el.state ] );
            array.push(el);
            citiesAirMap.set( [el.date, el.county, el.state ], array); //date , city, county, state
        }
        else{
            citiesAirMap.set( [el.date, el.county, el.state ], [el]); //date , city, county, state
        }
    })

    console.log(" *** CITI AIR ", citiesAirMap.get( ['2020-02-11', 'San Diego', 'California'] ));

    //console.log("**** RESULT COVID LOCK ", resultCitiesAirQuality)
    //console.log("****MAPPA AIR ", citiesAirMap);

    //var dataProva = '2020-12-05';
    //console.log("***CITIMAP", MultiKeyMap.prototype.get([dataProva,  'King', 'Washington' ]))
    
    var data = [];
    

    /*
    var x = new MultiKeyMap();
    x.set(['1', 'a'], 100);
    console.log("****X!A", x.get(['1']));
    console.log(x);
    */
    

    resultCovidLockdown.forEach( covidLockdown => {
        //var it = [covidLockdown.date, covidLockdown.county, covidLockdown.state];

       /* const iterator = citiesAirMap.keys();
        var it = iterator.next().value;
        console.log(iterator.next().value);
        console.log(iterator.next().value); */
        //console.log("*X*X*X*X**X*X", citiesAirMap.get( it));
       // console.log("it " , it)
      //  console.log("*X* in if", citiesAirMap.get( [covidLockdown.date ]));

   
        if(citiesAirMap.get( [covidLockdown.date,  covidLockdown.county, covidLockdown.state] ) ){
//         console.log("*X* in if", citiesAirMap.get([covidLockdown.date,  covidLockdown.county, covidLockdown.state]));
            var arrayCityAir = citiesAirMap.get( [covidLockdown.date,  covidLockdown.county, covidLockdown.state] )
            var entry;

            //Creazione array per unire le città-qualità aria
            var elementCityAir = [];
                arrayCityAir.forEach(elCityAir => { 
                    elementCityAir.push({
                        city : elCityAir.city,
                        air_quality : elCityAir.value_air 
                    })
                })

            if(covidLockdown.type){ 
               // data.set([covidLockdown.date, covidLockdown.county, covidLockdown.state], 
                 entry = {
                        date : covidLockdown.date,
                        county : covidLockdown.county,
                        state: covidLockdown.state,
                        cases : covidLockdown.cases,
                        deaths: covidLockdown.deaths,
                        lockdown : covidLockdown.type,
                        cities_air_quality : elementCityAir
                    }                            
               // citiesAirMap.get([covidLockdown.date, covidLockdown.county, covidLockdown.state]) 
               // )
            }

            else{
              //  data.set([covidLockdown.date, covidLockdown.county, covidLockdown.state], 
                 entry = {
                        date : covidLockdown.date,
                        county : covidLockdown.county,
                        state: covidLockdown.state,
                        cases : covidLockdown.cases,
                        deaths: covidLockdown.deaths,
                        cities_air_quality : elementCityAir


                }
            }
            data.push(entry);
        }
        else{
            if(covidLockdown.type){ 
                data.push({
                    date : covidLockdown.date,
                    county : covidLockdown.county,
                    state: covidLockdown.state,
                    cases : covidLockdown.cases,
                    deaths: covidLockdown.deaths,
                    lockdown : covidLockdown.type
                });
            }
            else{
                data.push({
                    date : covidLockdown.date,
                    county : covidLockdown.county,
                    state: covidLockdown.state,
                    cases : covidLockdown.cases,
                    deaths: covidLockdown.deaths,
                });
            }
        }
    });

    

    //Fino a qui tutto bene...

    console.log("**********", data);

    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");
        (await dbo.createCollection("ProvaFinale5")).insertMany(data); //Crea la collezione
        //db.close();
    } )






/*
    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");
        var query = {};
        var projectionCovid = {};
        dbo.collection("Cities&Air").find().toArray(async function(err, resultCitiesAir) { //query
            if(err) throw err;
           // console.log("****RESSSSS****", resultCitiesAir)
        });
    });
*/


}