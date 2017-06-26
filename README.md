<div>
<h2>Currency Rate Service</h2>

<p>
This currency service returns the exchange rate of two given currency names. We can also set and read a "rate modifier" which will be used when getting the "buy" rates. The exchange rates will be updated every hour from the Yahoo Finance API.<br>
<b>Language:</b> NodeJS<br>
<b>Storage:</b> File
</p>
</div>

<div>
<p>
<h3>GET /currency/rates/modifier</h3>
<ul>
<li>Return
    <ul>
    <li>Response code</li>
    <li>Decimal value</li>
    </ul>
</li>
</ul>

<h3>POST /currency/rates/modifier/{newValue}</h3>
<ul>
<li>Parameters
    <ul>
    <li>{newValue}: Decimal value</li>
    </ul>
</li>
<li>Return
    <ul>
    <li>Response code</li>
    </ul>
</li>
</ul>

<h3>GET /currency/rates/buy/{from}{to}</h3>
<ul>
<li>Parameters
    <ul>
    <li>{from}: ISO 4217 currency code</li>
    <li>{to}: ISO 4217 currency code</li>
    </ul>
</li>
<li>Return
    <ul>
    <li>Response code</li>
    <li>Decimal value</li>
    </ul>
</li>
</ul>

<h3>GET /currency/rates/sell/{from}{to}</h3>
<ul>
<li>Parameters
    <ul>
    <li>{from}: ISO 4217 currency code</li>
    <li>{to}: ISO 4217 currency code</li>
    </ul>
</li>
<li>Return
    <ul>
    <li>Response code</li>
    <li>Decimal value</li>
    </ul>
</li>
</ul>
</p>
</div>