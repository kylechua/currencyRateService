const http = require('http');
const path = require('path');
const fs = require('fs');

var currency = require('./currencyservice.js');
// Database which stores exchange rates and modifier
var databaseURL = './data.json';
// Frequency of updating exchange rates
var xcInt = (0.05)*(3600000); // (1 hour)*(3,600,000 ms in an hour)

/* Parse Database */
var db;

try {
    db = JSON.parse(fs.readFileSync(databaseURL, 'utf8'));
} catch(e) {
    // Create JSON if file URL is invalid
    db = {};
}
if (db.modifier == undefined || isNaN(db.modifier)){
    // Add modifier if it does not exist
    db.modifier = 1;
    fs.writeFileSync(databaseURL, JSON.stringify(db));
}

/* Initialize Server */
var server = http.createServer().listen(8888);

/* Initialize Scheduler to update currency rates, then initially update them */
var currencyScheduler = setInterval(updateRates, xcInt);
updateRates();

/* Pull exchange rates of currencies (in USD) from Yahoo API
*  Store exchange rates in database
*/
function updateRates(){
    var myURL = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.xchange%20where%20pair%20in%20(%22USDEUR%22%2C%20%22USDGBP%22%2C%20%22USDJPY%22%2C%20%22USDCAD%22%2C%20%22USDCNY%22%2C%20%22USDHKD%22%2C%20%22USDKRW%22%2C%20%22USDAUD%22%2C%20%22USDUSD%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=';

    http.get(myURL, function(response){
        var body = '';
        response.on('data', function(line){
            body += line;
        }).on('end', function(){
            var res = JSON.parse(body);
            var parsedData = res.query.results.rate;
            for (var i=0; i<parsedData.length; i++){
                var code = parsedData[i].id.substring(3);
                var rate = parseFloat(parsedData[i].Rate);
                db[code] = rate;
            }
            var today = new Date();
            db["updated"] = today;
            fs.writeFileSync(databaseURL, JSON.stringify(db));
            console.log("Updated exchange rates: " + today);
        })
    }).on('error', function(e){
        console.error("Error retrieving exchange rates: " + e.message);
    })
}

/* Main Event Handler */
server.on('request', function(request, response){
    var myPath = path.parse(request.url);
    var pathStr = path.format(myPath);
    var params = myPath.base;

    if (pathStr.indexOf('/currency/rates') != -1){
        if (pathStr.indexOf('/buy/') != -1){
            server.emit("buying", response, params, db);
        } else if (pathStr.indexOf('/sell/') != -1){
            server.emit("selling", response, params, db);
        } else if (pathStr.indexOf('/modifier') != -1){
            server.emit("modifier", request, response, params, db);
        } else {
            // 405: Method Not Allowed
            response.statusCode = 405;
            response.writeHead("Method requested is not defined")
        }
    } else {
        // Not found, wrong URI
        // response.statusCode = 404;
    }
    response.end();
});

/* GET /v2/currency/rates/buy/{from}{to}
*  Parameters
*   - {from}: ISO 4217 currency code
*   - {to}: ISO 4217 currency code
*  Return
*   - Response code
*   - Decimal(4,3)
*/
server.on('buying', function(response, fromto, db){
    var from = fromto.substring(0, 3);
    var to = fromto.substring(3);
    try {
        var rate = currency.getBuyingRate(from, to, db);
        response.write(String(currency.getBuyingRate(from, to, db)));
    } catch(e) {
        // 400: Bad Request
        response.statusCode = 400;
        response.write(e.name + ": " + e.message)
    }
});

/* GET /v2/currency/rates/sell/{from}{to}
*  Parameters
*   - {from}: ISO 4217 currency code
*   - {to}: ISO 4217 currency code
*  Return
*   - Response code
*   - Decimal(4,3)
*/
server.on('selling', function(response, fromto, db){
    var from = fromto.substring(0, 3);
    var to = fromto.substring(3);
    try {
        var rate = currency.getSellingRate(from, to, db);
        response.write(String(rate));
    } catch(e) {
        // 400: Bad Request
        response.statusCode = 400;
        response.write(e.name + ": " + e.message)
    }
});

/* GET /v2/currency/rates/modifier
*  Return
*   - Response code
*   - Decimal(4,3)
*  POST /v2/currency/rates/modifier/{value}
*  Parameters
*   - Decimal(4,3)
*  Return
*   - Response code
*/
server.on('modifier', function(request, response, newValue, db){
    if (request.method == 'POST'){
        // POST, update the modifier
        var val = parseFloat(newValue);
        if (!isNaN(val)){
            db.modifier = val;
            fs.writeFileSync(databaseURL, JSON.stringify(db));
            response.write("Set modifier to: " + val);
        } else {
            // 400: Bad Request
            response.statusCode = 400;
            response.write("invalidParameter: Expected a number value.");
        }
    } else {
        // GET, get the modifier
        response.write(String(db.modifier));
    }
});