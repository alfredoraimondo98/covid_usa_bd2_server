var MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";

const clearController = require("../controllers/clear");

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

    var promiseAirQuality = clearController.selectAirQualityUSA(); //chiama il metodo che ritorna la promise
    const resultAirQualityUSA = await promiseAirQuality; //attende che risolve la promise
    console.log("ritorno AIR", resultAirQualityUSA);
    
    var arrayIntegration = [];

    
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");
    

    //Aggiunta campo contea e stato associata alla città
        resultAirQualityUSA.forEach( elementAir => {
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
                    console.log("****",entry);
                }
                else{ //Se nessuna corrispondenza per quella città è presente, memorizza solo i dati relativi all'air_quality
                    entry = {   
                        date : elementAir.DATE,
                        city : elementAir.CITY,
                        value_air : elementAir.VALUE     
                    }                       
                    console.log("****",entry);
                }

                arrayIntegration.push(entry); //Aggiunge la nuova entry all'array di integrazione.
            })
        });
    });

    console.log("ritorno ARRAYINTEGRATION", arrayIntegration);
}





/**
 * integra us_covid e lockdown_us
 * 
 * Es JSON
 *  
 * 
 */
    exports.integrationCovidLockdownUS = async () => {

        var promiseLockdown = clearController.selectLockdownUSA();
        const resultLockdownUS = await promiseLockdown; //dati ripuliti di lockdown
       // console.log("ritorno lockdown DATA", resultLockdownUS);

       var promiseCovidData = clearController.selectAllCovidData();
       const resultCovidData = await promiseCovidData; //dati ripuliti di lockdown
        
        var arrayIntegration = new Map();
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
                                console.log("***IIIII*", resultCovid[0]);
                                //Se viene trovata una corrispondenza, riporta state e county nell'oggetto air_quality
                                if(resultCovid[0] != undefined){ //match per county
                                    entry = {
                                        _id : resultCovid[0]._id, 
                                        date : elementLockdown.Date,
                                        state : elementLockdown.State,
                                        type : elementLockdown.Type,
                                        county : resultCovid[0].county,
                                        cases : resultCovid[0].cases,
                                        deaths : resultCovid[0].deaths,
                                    } 
                                    console.log("ENTRYYYYYYYYYYYYY", entry);
                                    resolve(entry); //resolve -> restituisce come risultato della promise la entry appena creata

                                }
                           /*     else if(resultCovid[0] != undefined  && resultCovid[0].state){ //match per state
                                    entry = {
                                        _id : resultCovid[0]._id, 
                                        date : elementLockdown.Date,
                                        state : elementLockdown.State,
                                        type : elementLockdown.Type,
                                        cases : resultCovid[0].cases,
                                        deaths : resultCovid[0].deaths,
                                    } 
                                    resolve(entry); //resolve -> restituisce come risultato della promise la entry appena creata
                                } */
                                else{
                                    console.log("Nessuna corrispondenza trovata"); //Se non viene trovato nessun match per county/state
                                    //reject(); //se non vi è alcuna corrispondenza
                                }
                            })

                        
                            });
                            
                        };
            
            //resolve(arrayIntegration); //assegna al resolve l'oggetto da ritornare alla risoluzione della promise    

            var actions = resultLockdownUS.map(risultatoPromise); //itera i risultati dei lockdown richiamando la funzione risultatoPromise, memorizzando in action le promise in pending
            var res = await Promise.all(actions); //esegue le promise ottenute, memorizznaod i risultati in res.
            console.log("*******RISSS", res); 
           
            
            //Sostituire i dati covid con quelli covid+lockdwon
            resultCovidData.forEach(elementCovid =>{ 
                var flag = true;
                res.forEach(elementLockdown => {
                    if(elementCovid._id.equals(elementLockdown._id)){
                        console.log("SI IF", elementLockdown);
                        
                      //  dbo.collection("lockdown51").insertOne(elementLockdown);
                        newCollection.push({
                            date : elementLockdown.date,
                            county : elementLockdown.county,
                            state : elementLockdown.state,
                            cases : elementLockdown.cases,
                            deaths : elementLockdown.deaths,
                            type : elementLockdown.type
                        }); 
                        flag = false;
                    }
                    else{
                    }
                });
                if(flag){
                   // dbo.collection("lockdown51").insertOne(elementCovid);
                    newCollection.push({
                        date : elementCovid.date,
                        county : elementCovid.county,
                        state : elementCovid.state,
                        cases : elementCovid.cases,
                        deaths : elementCovid.deaths
                    });
                } 
            });

        

            console.log("newCollection.size", newCollection);    
            (await dbo.createCollection("lockdown100")).insertMany(newCollection) 
           
           // dbo.collection("lockdown33").insertOne(elementCovid);


            
        }); //Fine mongo.connect

       

                     //Sostituire i dati covid con quelli covid+lockdown
            /*
                                resultCovid.forEach(elementCovid =>{ 
                                    if(arrayIntegration.get(elementCovid._id)){
                                        elementCovid = arrayIntegration.get(elementCovid._id);
                                        //console.log("** elementCovid", elementCovid)
                                        dbo.collection("lockdown33").insertOne(elementCovid);

                                    }
                                //  dbo.collection("lockdown33").insertOne(elementCovid);
                                });
            */

        
        //await console.log("***** SIZE ", arrayIntegration.size);



    
    }
    

