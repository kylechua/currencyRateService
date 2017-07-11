exports.getBuyingRate = function(from, to, db) {
    try {
        var rate = getRateInUSD(to, db)/getRateInUSD(from, db) * db.modifier;
        return rate;
    } catch(e) {
        throw e;
    }
}

exports.getSellingRate = function(from, to, db) {
    try {
        var rate = getRateInUSD(from, db)/getRateInUSD(to, db);
        return rate;
    } catch(e) {
        throw e;
    }
}

function getRateInUSD (code, db){
    var source = db.source;
    var rate = db[source].rates[code];
    if (!isNaN(rate))
        return rate;
    else {
        throw new invalidCurrencyException();
    }
}

function invalidCurrencyException(){
    this.message = "One or more unsupported currency codes were specified.";
    this.name = 'invalid_currency';
}