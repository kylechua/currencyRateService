exports.getBuyingRate = function(from, to, db) {
    try {
        var rate = getRateInUSD(to, db)/getRateInUSD(from, db) * db.modifier;
        return rate;
    } catch(e) {
        // throw exception to whatever called this function
        throw e;
    }
}

exports.getSellingRate = function(from, to, db) {
    try {
        var rate = getRateInUSD(from, db)/getRateInUSD(to, db);
        return rate;
    } catch(e) {
        // throw exception up one scope
        throw e;
    }
}

function getRateInUSD (code, db){
    var rate = db[code];
    if (!isNaN(rate))
        return rate;
    else {
        throw new invalidCurrencyException();
    }
}

function invalidCurrencyException(){
    this.message = "One or more invalid or unsupported currencies were specified. Make sure to use 4217 ISO format (example: Canadian Dollars to U.S. Dollars should be written as 'CADUSD')";
    this.name = 'invalidCurrency';
}