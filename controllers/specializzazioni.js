 /**
  * specializzazioni covid19
  * @param {*} specializzazioni 
  * @param {*} condition 
  */
exports.specializzazioniCovid = function (specializzazioni, condition){
    if(specializzazioni.byCasiCovid){ //condizioni aggiuntive sui "casi covid"
        if(specializzazioni.byCasiCovid.start != -1 && specializzazioni.byCasiCovid.end != -1){ //Se entrambi i parametri (min, max) sono definiti
            condition['cases'] = {
                $gte : +specializzazioni.byCasiCovid.start,
                $lte : +specializzazioni.byCasiCovid.end
            }
        }
        else if(specializzazioni.byCasiCovid.start != -1){ //se è definito solo lo start (maggiore di)
                condition['cases'] = {
                    $gte : +specializzazioni.byCasiCovid.start,
                }
            }
            else if(specializzazioni.byCasiCovid.end != -1){ //Se è definito solo l'end (minore di)
                condition['cases'] = {
                    $lte : +specializzazioni.byCasiCovid.end,
                }
            }
    }
    

    if(specializzazioni.byMortiCovid){ //condizioni aggiuntive sui "morti covid"
        if(specializzazioni.byMortiCovid.start != -1 && specializzazioni.byMortiCovid.end != -1){ //Se entrambi i parametri (min, max) sono definiti
            condition['deaths'] = {
                $gte : +specializzazioni.byMortiCovid.start,
                $lte : +specializzazioni.byMortiCovid.end
            }
        }
        else if(specializzazioni.byMortiCovid.start != -1){ //se è definito solo lo start (maggiore di)
                condition['deaths'] = {
                    $gte : +specializzazioni.byMortiCovid.start,
                }
            }
            else if(specializzazioni.byMortiCovid.end != -1){ //Se è definito solo l'end (minore di)
                condition['deaths'] = {
                    $lte : +specializzazioni.byMortiCovid.end,
                }
            }
    }
    
}


 /**
  * specializzazioni AirQuality
  * @param {*} specializzazioni 
  * @param {*} condition 
  */
exports.specializzazioniAirQuality = function (specializzazioni, condition){
    if(specializzazioni.air_quality){ //condizioni aggiuntive su qualità dell'aria
        if(specializzazioni.air_quality.start != -1 && specializzazioni.air_quality.end != -1){ //Se entrambi i parametri (min, max) sono definiti
            condition['cities_air_quality.air_quality'] = {
                $gte : +specializzazioni.air_quality.start,
                $lte : +specializzazioni.air_quality.end
            }
        }
        else if(specializzazioni.air_quality.start != -1){ //se è definito solo lo start (maggiore di)
                condition['cities_air_quality.air_quality'] = {
                    $gte : +specializzazioni.air_quality.start,
                }
            }
            else if(specializzazioni.air_quality.end != -1){ //Se è definito solo l'end (minore di)
                condition['cities_air_quality.air_quality'] = {
                    $lte : +specializzazioni.air_quality.end,
                }
            }
    }
}



 /**
  * specializzazioni Lockdown
  * @param {*} specializzazioni 
  * @param {*} condition 
  */
exports.specializzazioniLockdown = function(specializzazioni, condition){
    if(specializzazioni.type_lockdown != 'Nessuno'){ //condizioni aggiuntive sui "casi covid"
        condition['lockdown'] = specializzazioni.type_lockdown
    }
}