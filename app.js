const express = require('express');
const bodyParser = require('body-parser');
const axios = require("axios");
const app = express();
const jsonParser = bodyParser.json();
var Q = require('q');

app.listen(3000, function () {
    console.log('countryairportsummary listening on port 3000');
});

var countryServiceEndpoint = 'http://178.128.103.57:3335/countries';
var airportServiceEndpoint = 'http://178.128.103.57:3334/search';

class Country{
    constructor(countryName,countryCode,airports){
        this.countryName=countryName;
        this.countryCode=countryCode;
        this.airports =airports
    }
}

class Airport{
    constructor(identifier,name,runways){
        this.identifier =identifier;
        this.name=name;
        this.runways=runways;
    }
}

const countryService = (url) =>{
    return axios.get(url).then(response => {
        return response.data
    });
}

const airportService = (url, countryCode) =>{
    return axios.get(url+'/'+countryCode ).then(response => {
        return response.data
    });
}

app.get('/countryairportsummary', jsonParser, function (req, res) {
    var runwayminimumto = req.param('runwayminimumto',0);
    countryService(countryServiceEndpoint).then(function (countries) {
        var countriesPromises = countries.map(country => 
            new Promise(function(resolve, reject){
                airportService(airportServiceEndpoint, country.code).then(function (data){
                    var airports= data.filter(air=>air.runways >= runwayminimumto).map(air=>new Airport(air.name, air.id, air.runways.length))
                    resolve(new Country(country.name,country.code, airports));
                })
            })  
        );
 
        Q.all(countriesPromises).then(function (data) {
            res.send(data
                .filter(country=>country.airports.length >= 1)
            );
        })
    })
});
