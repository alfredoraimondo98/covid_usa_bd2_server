var MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";

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
        console.log("ritorno AIR", resultAirQualityUSA);
        
        var arrayIntegration = [];
        var res;

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
           
            
            //Sostituire i dati covid con quelli covid+lockdwon
            resultCovidData.forEach(elementCovid =>{ 
                var flag = true;
                res.forEach(elementLockdown => {
                    if(elementCovid._id.equals(elementLockdown._id)){
                        //console.log("SI IF", elementLockdown);
                        
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
                    else{
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

        

//        console.log("newCollection.size", newCollection );    
        //(await dbo.createCollection("Covid&Lockdown")).insertMany(newCollection); 
        resolve(newCollection);
        db.close();

        }); //Fine mongo.connect

    });

    return promise;
}
    



exports.integrationCovidLockdownAirQuality = async () => {

    var promiseCovidLockdown = integrationController.integrationCovidLockdownUS();
    const resultCovidLockdown = await promiseCovidLockdown; //dati ripuliti di Covid&Lockdown
    console.log("**** RESULT COVID LOCK ", resultCovidLockdown)


    var promiseCitiesAirQuality = integrationController.integrationCitiesAirQuality();
    const resultCitiesAirQuality = await promiseCitiesAirQuality; //dati ripuliti di Cities&Air
    console.log("**** RESULT COVID LOCK ", resultCitiesAirQuality)



    //Fino a qui tutto bene...








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