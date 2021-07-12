var MongoClient = require('mongodb').MongoClient;
//const url = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
const url = "mongodb+srv://admin:admin@mongodb-basi2.vxnwa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority" //CLOUD URL
const specializzazioniController = require('./specializzazioni');



/**
 * Effettua query su dati covid19
 */
exports.getAirQualityData = async (req, res, next) => {
    let proiezione = [];
    let condizioni;
    let specializzazioni;
  

    proiezione = req.body.proiezioni;
    condizioni = req.body.condizioni;
    specializzazioni = req.body.specializzazioni;


    var condition = {}
    var projGroup = {} //group by mongo (in .aggregate)
    

//***FASE 1: PROIEZIONE */
    //Creazione proiezione 
    var projection = {};
    proiezione.forEach( elProject => {

        if(elProject.field == '_id'){ //Verifica se il campo è _id allora inserire sia con 1 (true) che con 0 (false)
            if(elProject.checked){
                projection[elProject.field.toString()] = 1
                projGroup[elProject.field.toString()] = "$"+elProject.field.toString();
            }
            else{
                projection[elProject.field.toString()] = 0
            }
        } //Altrienti per tutti gli altri valori si procede all'inserimento soltanto se checked = 1 (true)
        else if(elProject.checked){
           // group={}
            projection[elProject.field.toString()] = 1
            projGroup[elProject.field.toString()] = "$"+elProject.field.toString();
    
            condition[elProject.field.toString()] = { $exists : true } //richiede che i campi non oggetto di condizione debbano esistere nel risultato della query
         
        } 

    })
  
   

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
                condition['cities_air_quality.city'] = condizioni.searchBy.value;
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

    specializzazioniController.specializzazioniAirQuality(specializzazioni, condition); //Specializzazione air _ quality
    

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
                    "_id": projGroup
                }
            },
        ]).toArray(async function(err, result) {
            if(err) throw err;
            console.log(result);

            db.close();
        
            let resArray = []
            result.forEach(el =>{ //Crea oggetto da inviare al frontend
                resArray.push(el._id);
            })
            console.log("resArray", resArray);

            if(resArray.length > 0){ 
                return res.status(201).json({
                    result : resArray
                })
            }
            else{
                return res.status(204).json({})
            }
        });
    })
}