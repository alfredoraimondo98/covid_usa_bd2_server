var MongoClient = require('mongodb').MongoClient;
//const url = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
const url = "mongodb+srv://admin:admin@mongodb-basi2.vxnwa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority" //CLOUD URL

/**
 * restituisce tutti gli stati presenti in integrazioneFinale
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getState = async (req, res, next) => {
    var arrayState = [];
    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");
        

            dbo.collection("integrazioneFinale").aggregate([
                {
                    "$group": {
                        "_id": "$state",
                        
                    },
                }
            ]).sort({_id : 1 }).toArray(async function(err, result) {

            if(err) throw err;
            //console.log(result);
            db.close();


            result.forEach( el => {
                arrayState.push(el._id)
            })
            
            return res.status(201).json({
                state : arrayState
            })
        });
    })
}




/**
 * restituisce tutte le contee presenti in integrazioneFinale
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getCounty = async (req, res, next) => {
    var arrayCounty = [];
    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");
        

            dbo.collection("integrazioneFinale").aggregate([
                {
                    "$group": {
                        "_id": "$county",
                        //"counter": { "$sum": 1 }
                        
                    }
                }
            ]).sort({_id : 1 }).toArray(async function(err, result) {

            if(err) throw err;
            console.log(result);

            db.close();


            result.forEach( el => {
                if(el._id != null && el._id != 'Unknown'){ 
                    arrayCounty.push(el._id)
                }
            })
            
            return res.status(201).json({
                county : arrayCounty
            })
            
        });
    })    
}





/**
 * restituisce tutte le città presenti in integrazioneFinale
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
 exports.getCity = async (req, res, next) => {
    var arrayCity = [];
    MongoClient.connect(url, async function(err, db) {
        if (err) throw err;
        var dbo = db.db("basi2");
        

            dbo.collection("integrazioneFinale").aggregate([
                {
                    "$group": {
                        "_id": "$cities_air_quality.city",
                        //"counter": { "$sum": 1 }
                        
                    }
                }
            ]).sort({_id : 1 }).toArray(async function(err, result) {

            if(err) throw err;
            console.log(result);

            db.close();


            result.forEach( el => {
                if(el._id != null){
                    el._id.forEach(e =>{
                        arrayCity.push(e)
                    })
                }
            })
            
            return res.status(201).json({
                city : arrayCity
            })
            
        });
    })    
}


