var MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
//const url = "mongodb+srv://admin:admin@mongodb-basi2.vxnwa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority" //CLOUD URL

/**
 * Effettua query su dati covid19
 */
exports.getCovidData = async (req, res, next) => {
    let proiezione = [];
    let condizioni = [];
    let specializzazioni = [];
  

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

/*  "condizioni" : [
    {"searchBy" : {
      	"type" : "state",
      	"value" : "Florida"
    	}
    },
    {"byDataInizio" : "2020-03-08 "},
    {"byDataFine" :"2020-05-08 "}
    ], */

    var condition = {}
        //verifica il criterio di ricerca (State, County, City)
        if(condizioni[0].searchBy){
            if(condizioni[0].searchBy.type == 'state'){
                condition['state'] = condizioni[0].searchBy.value;
            }
            else if(condizioni[0].searchBy.type == 'county'){
                condition['county'] = condizioni[0].searchBy.value;
            }
            else if(condizioni[0].searchBy.type == 'city'){
                condition['city'] = condizioni[0].searchBy.value;
            }
        }

        
        if(condizioni[1].byDataInizio && condizioni[2].byDataFine){
            condition['date'] = {
                    $gte : condizioni[1].byDataInizio,
                    $lte : condizioni[2].byDataFine
            }
        }
        else{ 
            if(condizioni[1].byDataInizio){
                condition['date'] = condizioni[1].byDataInizio;
            }
            else if(condizioni[2].byDataFine){
                    condition['date'] = condizioni[2].byDataFine;
            }
        }

    

//Fase 3 Specializzazioni
/* "specializzazioni" :[
    {"byCasiCovid" : { 
        "minoreDi" : 9, 
        "maggioreDi" : null
  		}
    },
  
    {"byMortiCovid" : {
        "minoreDi" : 10,
        "maggioreDi" : 3
		}
    }
   ] */

    //console.log(" *** ", specializzazioni)

    if(specializzazioni[0].byCasiCovid){ //condizioni aggiuntive sui "casi covid"
        if(specializzazioni[0].byCasiCovid.start && specializzazioni[0].byCasiCovid.end){ //Se entrambi i parametri (min, max) sono definiti
            condition['cases'] = {
                $gte : +specializzazioni[0].byCasiCovid.start,
                $lte : +specializzazioni[0].byCasiCovid.end
            }
        }
        else if(specializzazioni[0].byCasiCovid.start){ //se è definito solo lo start (maggiore di)
                condition['cases'] = {
                    $gte : +specializzazioni[0].byCasiCovid.start,
                }
            }
            else if(specializzazioni[0].byCasiCovid.end){ //Se è definito solo l'end (minore di)
                condition['cases'] = {
                    $lte : +specializzazioni[0].byCasiCovid.end,
                }
            }
    }
    

    if(specializzazioni[1].byMortiCovid){ //condizioni aggiuntive sui "morti covid"
        if(specializzazioni[1].byMortiCovid.start && specializzazioni[1].byMortiCovid.end){ //Se entrambi i parametri (min, max) sono definiti
            condition['deaths'] = {
                $gte : +specializzazioni[1].byMortiCovid.start,
                $lte : +specializzazioni[1].byMortiCovid.end
            }
        }
        else if(specializzazioni[1].byMortiCovid.start){ //se è definito solo lo start (maggiore di)
                condition['cadeathsses'] = {
                    $gte : +specializzazioni[1].byMortiCovid.start,
                }
            }
            else if(specializzazioni[1].byMortiCovid.end){ //Se è definito solo l'end (minore di)
                condition['deaths'] = {
                    $lte : +specializzazioni[1].byMortiCovid.end,
                }
            }
    }
    



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