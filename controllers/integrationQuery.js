var MongoClient = require('mongodb').MongoClient;
//const url = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
const url = "mongodb+srv://admin:admin@mongodb-basi2.vxnwa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority" //CLOUD URL

/**
 * Effettua query su dati covid19
 */
exports.getAllData = async (req, res, next) => {
    let proiezione = [];
    let condizioni;
    let specializzazioni;
  

    proiezione = req.body.proiezioni;
    condizioni = req.body.condizioni;
    specializzazioni = req.body.specializzazioni;


    
//***FASE 1: PROIEZIONE */
    //Creazione proiezione 
    var projection = {};
    proiezione.forEach( elProject => {

        if(elProject.field == '_id'){ //Verifica se il campo è _id allora inserire sia con 1 (true) che con 0 (false)
            if(elProject.checked){
                projection[elProject.field.toString()] = 1
            }
            else{
                projection[elProject.field.toString()] = 0
            }
        } //Altrienti per tutti gli altri valori si procede all'inserimento soltanto se checked = 1 (true)
        else if(elProject.checked){
            projection[elProject.field.toString()] = 1
        }

    })

    //console.log(" PROJ ", projection)


  
   

/**FASE 2: QUERY (CONDIZIONI) */

/*  "condizioni" : 
    {"searchBy" : {
      	"type" : "state",
      	"value" : "Florida"
    	}
    },
    {"byDataInizio" : "2020-03-08 "},
    {"byDataFine" :"2020-05-08 "}
    , */

    var condition = {}
        //verifica il criterio di ricerca (State, County, City)
        if(condizioni.searchBy){
            if(condizioni.searchBy.type == 'Stato' && condizioni.searchBy.value != 'Tutti' ){
                condition['state'] = condizioni.searchBy.value;
            }
            else if(condizioni.searchBy.type == 'Contea' && condizioni.searchBy.value != 'Tutti'){
                condition['county'] = condizioni.searchBy.value;
            }
            else if(condizioni.searchBy.type == 'Città' && condizioni.searchBy.value != 'Tutti'){
                condition['city'] = condizioni.searchBy.value;
            }
        }

        
        if(condizioni.byDataInizio != '' && condizioni.byDataFine != ''){
            condition['date'] = {
                    $gte : condizioni.byDataInizio,
                    $lte : condizioni.byDataFine
            }
        }
        else{ 
            if(condizioni.byDataInizio != ''){
                condition['date'] = condizioni.byDataInizio;
            }
            else if(condizioni.byDataFine != ''){
                    condition['date'] = condizioni.byDataFine;
            }
        }

    

//Fase 3 Specializzazioni
/* "specializzazioni" :[
    {"air_quality" : { 
        "start" : "0", 
        "end" : "1"
  		}
    }, */

    //console.log(" *** ", specializzazioni)
/*
    if(specializzazioni[0].air_quality){ //condizioni aggiuntive su qualità dell'aria
        if(specializzazioni[0].air_quality.start && specializzazioni[0].air_quality.end){ //Se entrambi i parametri (min, max) sono definiti
            condition['cities_air_quality.air_quality'] = {
                $gte : +specializzazioni[0].air_quality.start,
                $lte : +specializzazioni[0].air_quality.end
            }
        }
        else if(specializzazioni[0].air_quality.start){ //se è definito solo lo start (maggiore di)
                condition['cities_air_quality.air_quality'] = {
                    $gte : +specializzazioni[0].air_quality.start,
                }
            }
            else if(specializzazioni[0].air_quality.end){ //Se è definito solo l'end (minore di)
                condition['cities_air_quality.air_quality'] = {
                    $lte : +specializzazioni[0].air_quality.end,
                }
            }
    }

    //Covid-19 Specializzazione
    if(specializzazioni[1].byCasiCovid){ //condizioni aggiuntive sui "casi covid"
        if(specializzazioni[1].byCasiCovid.start && specializzazioni[1].byCasiCovid.end){ //Se entrambi i parametri (min, max) sono definiti
            condition['cases'] = {
                $gte : +specializzazioni[1].byCasiCovid.start,
                $lte : +specializzazioni[1].byCasiCovid.end
            }
        }
        else if(specializzazioni[1].byCasiCovid.start){ //se è definito solo lo start (maggiore di)
                condition['cases'] = {
                    $gte : +specializzazioni[1].byCasiCovid.start,
                }
            }
            else if(specializzazioni[1].byCasiCovid.end){ //Se è definito solo l'end (minore di)
                condition['cases'] = {
                    $lte : +specializzazioni[1].byCasiCovid.end,
                }
            }
    }
    

    if(specializzazioni[2].byMortiCovid){ //condizioni aggiuntive sui "morti covid"
        if(specializzazioni[2].byMortiCovid.start && specializzazioni[2].byMortiCovid.end){ //Se entrambi i parametri (min, max) sono definiti
            condition['deaths'] = {
                $gte : +specializzazioni[2].byMortiCovid.start,
                $lte : +specializzazioni[2].byMortiCovid.end
            }
        }
        else if(specializzazioni[2].byMortiCovid.start){ //se è definito solo lo start (maggiore di)
                condition['cadeathsses'] = {
                    $gte : +specializzazioni[2].byMortiCovid.start,
                }
            }
            else if(specializzazioni[2].byMortiCovid.end){ //Se è definito solo l'end (minore di)
                condition['deaths'] = {
                    $lte : +specializzazioni[2].byMortiCovid.end,
                }
            }
    }

    //specializzazione lockdown
    if(specializzazioni[3].type_lockdown){ //condizioni aggiuntive sui "casi covid"
        condition['lockdown'] = specializzazioni[3].type_lockdown
    }
    
    */

    

    if(req.body.typeQuery = 'covid19'){
        specializzazioniCovid(specializzazioni, condition)
    }
    if(req.body.typeQuery = 'lockdown'){
        specializzazioniLockdown(specializzazioni, condition);

    }
    if(req.body.typeQuery = 'airQuality'){
        specializzazioniAirQuality(specializzazioni, condition);
    }

    console.log("condition " , condition);


    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");

        dbo.collection("integrazioneFinale").find(condition).project(projection).toArray(async function(err, result) {
            if(err) throw err;
            console.log(result);

            db.close();

            if(result.length > 0){ 
                return res.status(201).json({
                    result : result
                })
            }
            else{
                return res.status(204).json({})
            }
        });  
    })

}


function specializzazioniCovid(specializzazioni, condition){
    if(specializzazioni.byCasiCovid){ //condizioni aggiuntive sui "casi covid"
        if(specializzazioni.byCasiCovid.start && specializzazioni.byCasiCovid.end){ //Se entrambi i parametri (min, max) sono definiti
            condition['cases'] = {
                $gte : +specializzazioni.byCasiCovid.start,
                $lte : +specializzazioni.byCasiCovid.end
            }
        }
        else if(specializzazioni.byCasiCovid.start){ //se è definito solo lo start (maggiore di)
                condition['cases'] = {
                    $gte : +specializzazioni.byCasiCovid.start,
                }
            }
            else if(specializzazioni.byCasiCovid.end){ //Se è definito solo l'end (minore di)
                condition['cases'] = {
                    $lte : +specializzazioni.byCasiCovid.end,
                }
            }
    }
    

    if(specializzazioni.byMortiCovid){ //condizioni aggiuntive sui "morti covid"
        if(specializzazioni.byMortiCovid.start && specializzazioni.byMortiCovid.end){ //Se entrambi i parametri (min, max) sono definiti
            condition['deaths'] = {
                $gte : +specializzazioni.byMortiCovid.start,
                $lte : +specializzazioni.byMortiCovid.end
            }
        }
        else if(specializzazioni.byMortiCovid.start){ //se è definito solo lo start (maggiore di)
                condition['deaths'] = {
                    $gte : +specializzazioni.byMortiCovid.start,
                }
            }
            else if(specializzazioni.byMortiCovid.end){ //Se è definito solo l'end (minore di)
                condition['deaths'] = {
                    $lte : +specializzazioni.byMortiCovid.end,
                }
            }
    }
    
}


function specializzazioniAirQuality(specializzazioni, condition){
    if(specializzazioni.air_quality){ //condizioni aggiuntive su qualità dell'aria
        if(specializzazioni.air_quality.start && specializzazioni.air_quality.end){ //Se entrambi i parametri (min, max) sono definiti
            condition['cities_air_quality.air_quality'] = {
                $gte : +specializzazioni.air_quality.start,
                $lte : +specializzazioni.air_quality.end
            }
        }
        else if(specializzazioni.air_quality.start){ //se è definito solo lo start (maggiore di)
                condition['cities_air_quality.air_quality'] = {
                    $gte : +specializzazioni.air_quality.start,
                }
            }
            else if(specializzazioni.air_quality.end){ //Se è definito solo l'end (minore di)
                condition['cities_air_quality.air_quality'] = {
                    $lte : +specializzazioni.air_quality.end,
                }
            }
    }
}


function specializzazioniLockdown(specializzazioni, condition){
    if(specializzazioni.type_lockdown){ //condizioni aggiuntive sui "casi covid"
        condition['lockdown'] = specializzazioni.type_lockdown
    }
}