var MongoClient = require('mongodb').MongoClient;
//const url = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
const url = "mongodb+srv://admin:admin@mongodb-basi2.vxnwa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority" //CLOUD URL
 


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
        condition['date'] = {
                $gte : byDataInizio,
                $lte : byDataFine
        }
    }
    else{ 
        if(byDataInizio != ''){
            condition['date'] = byDataInizio;
        }
        else if(byDataFine != ''){
                condition['date'] = byDataFine;
        }
    }

    var projection = {"state" : 1, "date" : 1, "cases" : 1 , "deaths" : 1};
    var projGroup = { "state" : "$state", "date" : "$date", cases: { $sum: "$cases" }, deaths: { $sum: "$deaths" }};

   

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
            }
        ]).sort({_id : 1}).toArray(async function(err, result) {
            if(err) throw err;
            console.log(result);

            db.close();
        
            let categoriesArray = []
            let casesArray = [];
            let deathsArray = [];
            result.forEach(el =>{ //Crea oggetto da inviare al frontend
                categoriesArray.push(el._id.date);
                casesArray.push(el._id.cases);
                deathsArray.push(el._id.deaths);
            })
            //console.log("resArray", resArray);

            if(categoriesArray.length > 0){ 
                return res.status(201).json({
                    categories : categoriesArray,
                    cases : casesArray,
                    deaths : deathsArray
                })
            }
            else{
                return res.status(204).json({})
            }
        });
    })
}
