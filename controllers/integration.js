var MongoClient = require('mongodb').MongoClient;
//const url = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
const url = "mongodb+srv://admin:admin@mongodb-basi2.vxnwa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority" //CLOUD URL
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
                            
                            }
                            else{ //Se nessuna corrispondenza per quella città è presente, memorizza solo i dati relativi all'air_quality
                                entry = {   
                                    date : elementAir.DATE,
                                    city : elementAir.CITY,
                                    value_air : elementAir.VALUE    
                                } 
                                resolve(entry);                      
                            }
                        })  
                    
                });        
            };
    
        var actions = resultAirQualityUSA.map(risultatoPromise); //itera i risultati dei lockdown richiamando la funzione risultatoPromise, memorizzando in action le promise in pending
        res = await Promise.all(actions); //esegue le promise ottenute, memorizznaod i risultati in res.
        
        //(await dbo.createCollection("Cities&Air")).insertMany(res); 

        resolvee(res);
        db.close();
         
    });
    });

    return promise;    
}

  
 
//**NEW INTEGRATION COVID-LOCKDOWN
/**
 * 
 * @returns newCollection da sovrascrivere a us_covid
 */
async function getCovidAndLockdown () {

var p = new Promise(async function (resolve) {  //Promise esterna per ritornare l'intera newCollection
    var promiseCovidData = clearController.selectAllCovidData(); 
    const resultCovidData = await promiseCovidData; //Covid _ us _daily data


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
            resultLockdownData.forEach(elLockdown => { 
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

    var promiseCitiesAirQuality = integrationController.integrationCitiesAirQuality();
    const resultCitiesAirQuality = await promiseCitiesAirQuality; //dati ripuliti di Cities&Air

    var citiesAirMap = new MultiKeyMap();
    var flag;
    resultCitiesAirQuality.forEach( el => {
        flag = true;
        if(citiesAirMap.get( [el.date, el.county, el.state ] )){ 
            var array = citiesAirMap.get( [el.date, el.county, el.state ] );
            //Verifica la presenza di città duplicate
            array.forEach(elDuplicate => {
                if(elDuplicate.city == el.city){
                    flag = false;
                }
            })
            if(flag){ //se non sono stati trovati duplicati, inserisce l'elemento nell'array
                array.push(el);
            }
            citiesAirMap.set( [el.date, el.county, el.state ], array); //date , city, county, state
        }
        else{
            citiesAirMap.set( [el.date, el.county, el.state ], [el]); //date , city, county, state
        }
    })

    
    var data = [];
    

    resultCovidLockdown.forEach( covidLockdown => {
        //var it = [covidLockdown.date, covidLockdown.county, covidLockdown.state];

   
        if(citiesAirMap.get( [covidLockdown.date,  covidLockdown.county, covidLockdown.state] ) ){
            var arrayCityAir = citiesAirMap.get( [covidLockdown.date,  covidLockdown.county, covidLockdown.state] )
            var entry;

            //Creazione array per unire le città-qualità aria
            var elementCityAir = [];
                arrayCityAir.forEach(elCityAir => { 
                    elementCityAir.push({
                        city : elCityAir.city,
                        air_quality : parseFloat(elCityAir.value_air)
                    })
                })

            if(covidLockdown.type){ 
               // data.set([covidLockdown.date, covidLockdown.county, covidLockdown.state], 
                 entry = {
                        date : covidLockdown.date,
                        county : covidLockdown.county,
                        state: covidLockdown.state,
                        cases : parseInt(covidLockdown.cases),
                        deaths: parseInt(covidLockdown.deaths),
                        lockdown : covidLockdown.type,
                        cities_air_quality : elementCityAir
                    }                            
               // citiesAirMap.get([covidLockdown.date, covidLockdown.county, covidLockdown.state]) 
            }

            else{
              //  data.set([covidLockdown.date, covidLockdown.county, covidLockdown.state], 
                 entry = {
                        date : covidLockdown.date,
                        county : covidLockdown.county,
                        state: covidLockdown.state,
                        cases : parseInt(covidLockdown.cases),
                        deaths: parseInt(covidLockdown.deaths),
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
                    cases : parseInt(covidLockdown.cases),
                    deaths: parseInt(covidLockdown.deaths),
                    lockdown : covidLockdown.type
                });
            }
            else{
                data.push({
                    date : covidLockdown.date,
                    county : covidLockdown.county,
                    state: covidLockdown.state,
                    cases : parseInt(covidLockdown.cases),
                    deaths: parseInt(covidLockdown.deaths),
                });
            }
        }
    });

    console.log("**********", data);

    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");
        //(await dbo.createCollection("integrazioneFinale")).insertMany(data); //Crea la collezione
        //db.close();
    })
}