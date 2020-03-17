require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const VerifyToken = require('./VerifyToken');

const axios = require("axios");
const fetch = require("node-fetch");

const app = express();

app.set('apikeyread', process.env.APIKEYREAD);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function (req, res, next) {
	var whitelist = ['kth.se', 'lib.kth.se', ' https://kth.diva-portal.org/']
  	var host = req.get('host');

	whitelist.forEach(function(val, key){
		if (host.indexOf(val) > -1){
			res.setHeader('Access-Control-Allow-Origin', host);
		}
	});
	res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
	res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization");
	next();
});

var apiRoutes = express.Router();

apiRoutes.get('/', function(req, res) {
	res.send('Hello! The API is at https://lib.kth.se/orcid/api/v1');
});

apiRoutes.get("/orcid/:familyname/:givenname", VerifyToken, async function(req , res, next){
    var url = "https://pub.orcid.org/v3.0/search/?q=family-name:"
            + req.params.familyname
            + "+AND+given-names:"
            + req.params.givenname
    var orcidusers = [];
            try {
                const response = await axios.get(
                    encodeURI(url),{
                        headers: { 'Accept': "application/json",
                        'content-type': 'application/json;charset=utf-8' }
                    }
                );
                var result = response.data.result;
                if (result) {
                    var keys = Object.keys( result );
                    for( var i = 0,length = keys.length; i < length; i++ ) {
                        //console.log(result[ keys[ i ] ]['orcid-identifier'].uri);
                        const orciddetails = await axios.get(
                            encodeURI(result[ keys[ i ] ]['orcid-identifier'].uri),{
                                headers: { 'Accept': "application/json",
                                'content-type': 'application/json;charset=utf-8' }
                            }
                        );
                        var orciddetailsresult = orciddetails.data;
                        //console.log(orciddetailsresult.person.name['given-names']);
                        //console.log(orciddetailsresult.person.name['family-name']);
                        if (orciddetailsresult['activities-summary'].employments['affiliation-group']) {
                            //console.log(orciddetailsresult['activities-summary'].employments['affiliation-group'])//.summaries["employment-summary"].organization.name);
                        }
                        orcidusers.push(orciddetailsresult);
                    }
                    res.json(orcidusers);
                    return
                } else {
                    res.status(201).send({ 'result': 'orcid ' + req.params.familyname + " " + req.params.givenname + ' not found'});
                    return
                }
            } catch (error) {
                console.log(error);
            }
            
    /*
    if(results.users) {
        res.json({"orciduser" :results.users[0]});
    } else {
        res.json({'result': 'nothing'});
    }
    */
});

app.use('/orcid/api/v1', apiRoutes);

var server = app.listen(process.env.PORT || 3002, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});