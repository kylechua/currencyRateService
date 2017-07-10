## Currency Rate Service

---
This currency service returns the exchange rate of two given currency names. We can also set and read a "rate modifier" which will be used when getting the "buy" rates. The exchange rates will be updated every hour from the Yahoo Finance API.

Language: NodeJS
Storage: File

### GET /currency/rates/modifier

* Return
    * Response code
    * Decimal value
    



### POST /currency/rates/modifier/{newValue}

* Parameters
    * {newValue}: Decimal value
* Return
    * Response code
    
### GET /currency/rates/buy/{from}{to}

* Parameters
    * {from}: ISO 4217 currency code
    * {to}: ISO 4217 currency code
* Return
    * Response code
    * Decimal value

### GET /currency/rates/sell/{from}{to}
* Parameters
    * {from}: ISO 4217 currency code
    * {to}: ISO 4217 currency code
* Return
    * Response code
    * Decimal value