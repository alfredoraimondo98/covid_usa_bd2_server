var MongoClient = require('mongodb').MongoClient;
//const url = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
const url = "mongodb+srv://admin:admin@mongodb-basi2.vxnwa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority" //CLOUD URL
 

/**
 * restituisce un aggregazione dei casi/morti covid stato in un range di date
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
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



/**DA RIVEDEREEEEE  */
exports.getCasesTwoStates = (req, res, next) => {

    var state1;
    var state2
    var byDataInizio;
    var byDataFine;

    state1 = req.body.state1;
    state2 = req.body.state2;
    byDataInizio = req.body.byDataInizio;
    byDataFine = req.body.byDataFine;

    //Verifica condizioni query
    var condition={};

    if(state1){ //verifica state
        condition['state'] = state1;
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

    var projection = {"state" : 1, "date" : 1, "cases" : 1 };
    var projGroup = { "state" : "$state", "date" : "$date", cases: { $sum: "$cases" }};

    var categoriesArray = []
    var casesArray = [];

    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");


        console.log("***QUERY: ", "$match (find):", condition , "\n project: ", projGroup, "\n group : {group : { _id : ", projGroup, "}} **" )


        //query stato 1
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
           // console.log(result);

            //db.close();
        
            
            result.forEach(el =>{ //Crea oggetto da inviare al frontend
                categoriesArray.push(el._id.date);
                casesArray.push(el._id.cases);
            })
            //console.log("resArray", resArray);

            
        });
    



    //query stato 2
    
    if(state2){ //verifica state
        condition['state'] = state2;
    }
    var categoriesArray2 = []
    var casesArray2 = [];
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
      //  console.log(result);

        db.close();


        result.forEach(el =>{ //Crea oggetto da inviare al frontend
            categoriesArray2.push(el._id.date);
            casesArray2.push(el._id.cases);
        })
        //console.log("resArray", resArray);
       
     
        var date1 = new Date(categoriesArray[0]);
        var date2 = new Date(categoriesArray2[0]);
        var x = Math.abs(date1 - date2)/(1000*3600*24);
        var arrayAggiunta = [];
        
        for(var i = 0 ; i < x ; i++){
            arrayAggiunta.push(0)
        }
        
        if(date1 > date2){
            Array.prototype.push.apply(arrayAggiunta, casesArray);
            casesArray = arrayAggiunta;
        }
        else{
            Array.prototype.push.apply(arrayAggiunta, casesArray2);
            casesArray2 = arrayAggiunta;
        }

        console.log(" *** DIM ", categoriesArray2.length, categoriesArray.length)
        if(categoriesArray.length > 0 || categoriesArray2 > 0){ 
            return res.status(201).json({
                categories : categoriesArray,
                cases : casesArray,
                categories2 : categoriesArray2,
                cases2 : casesArray2
            })
        }
        else{
            return res.status(204).json({})
        }
        
    });
})
    
}


/**
 * restituisce i lockdown dello stato passato come parametro
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getLockdown = (req, res, next) => {

    var state;

    state = req.body.state;

    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");

        var condition = {"state" : state, "lockdown" : {$exists : true} };
        var projection = { _id : 0, date : 1, lockdown : 1, county: 1}

        dbo.collection("integrazioneFinale").find(condition).project(projection).toArray(async function(err, result) {
            if(err) throw err;      
            
            db.close();

            console.log(result);

            if(result.length > 0){
                return res.status(201).json({
                    lockdown : result
                })
            }
            else{
                return res.status(204).json({})
            }  
        });
    });
}