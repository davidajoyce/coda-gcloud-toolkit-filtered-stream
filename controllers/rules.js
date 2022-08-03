const express = require("express");
const gcp_infra_svcs = require('.././services/gcp-infra.js');
const config = require('../config.js');
const axios = require("axios").default;
var uuid = require('uuid');
const api_svcs = require('.././services/api.js');

const router = express.Router();

router.post("/:tagId", function (req, res) {

    var ruleBody = req.body["rule"]
    var emailAddress = req.body["email"]
    //var ruleId = uuid.v4()
    var ruleId = req.params.tagId
    ruleBody["add"][0]["tag"] = ruleId
    console.log("rulebody is ", ruleBody)
    

   if(emailAddress == undefined){
    emailAddress = "no email address"
   }

    let axiosConfig = {
        method: 'post',
        url: config.filtered_stream.rules.api,
        headers: { 'Authorization': config.twitter_bearer_token },
        data: ruleBody
    };
    console.log('Rules: Request body ',req.body);

    axios(axiosConfig)
        .then(function (response) {
            if(response.data.errors)
            //res.json(response.data.errors);    
            res.json(response.data.data);
            res.json(ruleId)
        })
        .then(function () {
            api_svcs.setDocumentData(emailAddress, ruleId)
        })
        .catch(function (error) {
            console.log(error);
            res.send(error);
        });
});

async function addRecord(docRef, firstName){
    const result = await docRef.set({
        first: firstName,
        last: 'Lovelace',
        born: 1815
      });
    console.log("Added record for ", result)
}

async function getRecord(table, db){
    const snapshot = await db.collection(table).get();
    snapshot.forEach((doc) => {
    console.log(doc.id, '=>', doc.data());
    });
}

router.get("/", function (req, res) {
    var rulesData;
    let axiosConfig = {
        method: 'get',
        url: config.filtered_stream.rules.api,
        headers: { 'Authorization': config.twitter_bearer_token }
    };

    axios(axiosConfig)
        .then(function (response) {
            rulesData = response.data.data;
            if( rulesData === undefined)    {
                rulesData = [];
            }
            res.send(rulesData);
        })
        .catch(function (error) {
            console.log(error);
        });
});

module.exports = router
