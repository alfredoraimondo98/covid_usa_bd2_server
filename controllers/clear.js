var MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";


/**
 * seleziona tutti i dati relativi al covid USA
 */
exports.selectAllCovidData = async () => {
        var promise = new Promise(function(resolve, reject) { //crea una nuova promise

            MongoClient.connect(url, async function(err, db) {
                if (err) throw err;
                var dbo = db.db("basi2");
                var query = {};

                dbo.collection("us_counties_covid19_daily").find(query).toArray(async function(err, result){

                    if (err) throw err;
                   // console.log(result);
                //await dbo.createCollection("all_data3");
                //await dbo.collection("all_data3").insertMany(result);
                    db.close();  
                    arrayResult = [];

                    result.forEach( elCovid => {
                        if(elCovid.county == "Unknown"){ //elimina county dove county  = unknown
                            arrayResult.push({
                                _id : elCovid._id,
                                date : elCovid.date,
                                state : elCovid.state,
                                cases : elCovid.cases,
                                deaths  :elCovid.deaths
                            })
                        }
                        else{
                            if(elCovid.state == "Puerto Rico" && elCovid.date == "2020-03-15"){
                                console.log("**** PUERTO RICO", elCovid)
                            }
                            arrayResult.push({
                                _id : elCovid._id,
                                date : elCovid.date,
                                county : elCovid.county,
                                state : elCovid.state,
                                cases : elCovid.cases,
                                deaths  :elCovid.deaths
                            })
                        }
                    })
                    resolve(arrayResult); //assegna al resolve l'oggetto da ritornare alla risoluzione della promise     
                
                });
            });
        });

        return promise; //ritorna la promise
}


/** (air_quality_index & us_cities)
 * ripulitura dati qualità dell'aria USA e integrazione con county e state 
 */
exports.selectAirQualityUSA = async () => {
    var promise = new Promise(function(resolve, reject) {

        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("basi2");
            var query = {COUNTRY : "US"};
            var projection = {DATE : 1, CITY : 1, VALUE: 1, _id : 0};
            dbo.collection("air_quality_index").find(query).project(projection).toArray(async function(err, result) {
                if (err) throw err;
               


                
                db.close();
                resolve(result);           
            });
        });

    });

    return promise;
}


/**
 * ripulitura dati lockdown
 */
exports.selectLockdownUSA = async () => {
    var promise = new Promise(function(resolve, reject) {

        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("basi2");
            var query = {};
            var projection = {State : 1, County : 1, Date: 1, Type : 1, _id : 1};
            dbo.collection("lockdown_us").find(query).project(projection).toArray(async function(err, result) {
                if (err) throw err;
                //console.log(result);
            //await dbo.createCollection("all_data3");
            //await dbo.collection("all_data3").insertMany(result);
                db.close();
                resolve(result);           
            });
        });

    });

    return promise;
}



/**
 * ripulitura dati cities
 */
 exports.selectCities = async () => {
    var promise = new Promise(function(resolve, reject) {
   
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("basi2");
            var query = {};
            var projection = {city : 1, county_name : 1, state_name : 1, _id : 0};
            dbo.collection("us_cities").find(query).project(projection).toArray(async function(err, result) {
                if (err) throw err;
                //console.log(result);
            //await dbo.createCollection("all_data3");
            //await dbo.collection("all_data3").insertMany(result);
                db.close();
                resolve(result);           
            });
        });

    });

    return promise;

}













