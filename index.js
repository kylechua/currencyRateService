const http = require('http');
const path = require('path');
const URL = require('url');
const fs = require('fs');
const currency = require('./currencyservice.js');

const PREFIX = "/v2/";
const dbURL = "./data.json";

/* Frequency of updating exchange rates */
var xcInt = (3/60) * (3600000); // (1 hour)*(3,600,000 ms in an hour)

/* Parse Database */
var db;

try {
    db = JSON.parse(fs.readFileSync(dbURL, 'utf8'));
} catch (e) {
    // Create JSON if file URL is invalid
    db = { yahoo: {rates: {}}, local: {rates: {}} };
    db.modifier = 1;
    db.source = "yahoo";
    fs.writeFileSync(dbURL, JSON.stringify(db));
    console.log("Currency service: could not find '" + dbURL + "'. New database created.");
}

/* Set default modifier and source */
// if (db.modifier == undefined || isNaN(db.modifier)) {
//     db.modifier = 1;
//     fs.writeFileSync(dbURL, JSON.stringify(db));
// }
// if (db.source == undefined) {
//     db.source = "yahoo";
//     fs.writeFileSync(dbURL, JSON.stringify(db));
// }

/* Initialize Server */
var server = http.createServer().listen(8888);

/* Initialize Scheduler to update currency rates, then initially update them */
var currencyScheduler = setInterval(updateRates, xcInt);
updateRates();

/* Pull exchange rates of currencies (in USD) from Yahoo API
 * Store exchange rates in database
 */
function updateRates() {
    var myURL = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.xchange%20where%20pair%20in%20(%22USDEUR%22%2C%20%22USDGBP%22%2C%20%22USDJPY%22%2C%20%22USDCAD%22%2C%20%22USDCNY%22%2C%20%22USDHKD%22%2C%20%22USDKRW%22%2C%20%22USDAUD%22%2C%20%22USDUSD%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=';

    http.get(myURL, function (response) {
        var body = '';
        response.on('data', function (line) {
            body += line;
        }).on('end', function () {
            var res = JSON.parse(body);
            var parsedData = res.query.results.rate;
            for (var i = 0; i < parsedData.length; i++) {
                var code = parsedData[i].id.substring(3);
                var rate = parseFloat(parsedData[i].Rate);
                db.yahoo["rates"][code] = rate;
            }
            var today = new Date();
            db.yahoo["updated"] = today;
            fs.writeFileSync(dbURL, JSON.stringify(db));
            console.log("Updated Yahoo exchange rates: " + today);
        })
    }).on('error', function (e) {
        console.error("Error retrieving Yahoo exchange rates: " + e.message);
    })
}

/* Main Event Handler */
server.on('request', function (request, response) {
    var myPath = path.parse(request.url);
    var pathStr = path.format(myPath);
    if (pathStr.indexOf(PREFIX + 'currency/rates') != -1) {
        if (pathStr.indexOf('/buy/') != -1) {
            server.emit("buying", request, response, db);
        } else if (pathStr.indexOf('/sell/') != -1) {
            server.emit("selling", request, response, db);
        } else if (pathStr.indexOf('/modifier') != -1) {
            server.emit("modifier", request, response, db);
        } else if (pathStr.indexOf('/source') != -1) {
            server.emit("source", request, response, db);
        } else {
            response.write(JSON.stringify({
                "code": 405
            }));
        }
    } else {
        // Not found, wrong URI
        // response.statusCode = 404;
    }
    response.end();
});

/* GET /currency/rates/buy/{from}{to}
 *  Parameters
 *   - {from}: ISO 4217 currency code
 *   - {to}: ISO 4217 currency code
 *  Return
 *   - Response code
 *   - Decimal(4,3)
 */
server.on('buying', function (request, response, db) {
    var url = URL.parse(request.url, true).path;
    var temp = url.split('?')[0];
    var temp = temp.split('/');
    var from = temp[temp.length - 2];
    var to = temp[temp.length - 1];

    console.log(from + " " + to)

    try {
        var rate = currency.getBuyingRate(from, to, db);
        response.write(JSON.stringify({
            "code": 200,
            "data": {
                "rate": String(rate),
                "source": db.source,
                "updated_at": db[db.source].updated
            }
        }));
    } catch (e) {
        // 400: Bad Request
        response.write(JSON.stringify({
            "code": 400,
            "data": {
                "source": db.source,
                "updated_at": db[db.source].updated
            }
        }));
    }
});

/* GET /currency/rates/sell/{from}{to}
 *  Parameters
 *   - {from}: ISO 4217 currency code
 *   - {to}: ISO 4217 currency code
 *  Return
 *   - Response code
 *   - Decimal(4,3)
 */
server.on('selling', function (request, response, db) {
    var url = URL.parse(request.url, true).path;
    var temp = url.split('?')[0];
    var temp = temp.split('/');
    var from = temp[temp.length - 2];
    var to = temp[temp.length - 1];
    try {
        var rate = currency.getSellingRate(from, to, db);
        response.write(JSON.stringify({
            "code": 200,
            "data": {
                "rate": String(rate),
                "source": db.source,
                "updated_at": db[db.source].updated
            }
        }));
    } catch (e) {
        // 400: Bad Request
        response.write(JSON.stringify({
            "code": 400,
            "data": {
                "source": db.source,
                "updated_at": db[db.source].updated
            }
        }));
    }
});

/* GET /currency/rates/modifier
 *  Return
 *   - Response code
 *   - Decimal(4,3)
 * POST /currency/rates/modifier/{value}
 *  Parameters
 *   - Decimal(4,3)
 *  Return
 *   - Response code
 */
server.on('modifier', function (request, response, db) {
    if (request.method == 'POST') {
        // POST, update the modifier
        var url = URL.parse(request.url, true).path;
        var temp = url.split('/');
        var newValue = temp[temp.length - 1];
        var val = parseFloat(newValue);
        if (!isNaN(val)) {
            db.modifier = val;
            fs.writeFileSync(dbURL, JSON.stringify(db));
            console.log("Updated modifier to " + val ".");
            response.write(JSON.stringify({
                "code": 200,
                "data": {
                    "modifier": val
                }
            }));
        } else {
            // 400: Bad Request
            console.log("Expected a number. Currency service modifier is still " + db.modifier + ".");
            response.write(JSON.stringify({
                "code": 400
            }));
        }
    } else if (request.method == 'GET') {
        // GET, get the modifier
        response.write(JSON.stringify({
            "code": 200,
            "data": {
                "modifier": String(db.modifier)
            }
        }));
    }
});

/*  GET /currency/rates/source
 *   Return
 *   - Response code
 *   - String
 *  POST /currency/rates/source/{newSource}
 *  Parameters
 *   - String
 *  Return
 *   - Response code
 *   - String
 */
server.on('source', function (request, response, db) {
    if (request.method == 'POST') {
        // POST, update the source of exchange rates
        var url = URL.parse(request.url, true).path;
        var temp = url.split('/');
        var source = temp[temp.length - 1].toLowerCase();
        var res = {
                "code": 200,
                "data": {}
            }
        if (source.indexOf("yahoo") != -1){
            db.source = "yahoo";
            fs.writeFileSync(dbURL, JSON.stringify(db));
            res.data.source = db.source;
            console.log("Currency service is now using Yahoo rates.")
        } else if (source.indexOf("local") != -1){
            db.source = "local";
            fs.writeFileSync(dbURL, JSON.stringify(db));
            res.data.source = db.source;
            console.log("Currency service is now using local rates.")
        } else {
            res.code = 400;
            console.log("Invalid source specified. Currency service source is still using " + db.source + " rates.");
        }
        response.write(JSON.stringify(res));
    } else if (request.method == 'GET') {
        // GET, get the source of exchange rates
        response.write(JSON.stringify({
            "code": 200,
            "data": {
                "source": db.source
            }
        }))
    }
});