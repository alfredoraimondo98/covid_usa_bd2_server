var MongoClient = require('mongodb').MongoClient;
//const url = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
const url = "mongodb+srv://admin:admin@mongodb-basi2.vxnwa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority" //CLOUD URL

/**
 * Effettua query su dati covid19
 */
exports.getCovidData = async (req, res, next) => {
    let proiezione = [];
    let condizioni;
    let specializzazioni;
  
    console.log("**** body ", req.body);
    console.log("***+ condizioni ", req.body.condizioni);
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