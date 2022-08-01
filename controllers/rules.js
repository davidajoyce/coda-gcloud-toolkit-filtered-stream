const express = require("express");
const gcp_infra_svcs = require('.././services/gcp-infra.js');
const config = require('../config.js');
const axios = require("axios").default;
var uuid = require('uuid');

const router = express.Router();

router.post("/", function (req, res) {

    var ruleBody = req.body["rule"]
    var emailAddress = req.body["email"]
    var ruleId = uuid.v4()
    ruleBody["add"][0]["tag"] = ruleId
    console.log("rulebody is ", ruleBody)
    var documentId = req.body["documentId"]
    if(documentId == undefined){
        documentId = "noDocumentId"
    }

    let axiosConfig = {
        method: 'post',
        url: config.filtered_stream.rules.api,
        headers: { 'Authorization': config.twitter_bearer_token },
        data: ruleBody
    };
    console.log('Rules: Request body ',req.body);
    console.log('documentId is ', req.body["documentId"])

    axios(axiosConfig)
        .then(function (response) {
            if(response.data.errors)
            res.json(response.data.errors);    
            res.json(response.data.data);
        })
        .then(function () {
            setDocumentData(emailAddress, ruleId)
        })
        .catch(function (error) {
            console.log(error);
            res.send(error);
        });
});

router.get("/testdb", function (req, res) {
    /*
    gcp_infra_svcs.createUnixSocketPool().then( async pool => {
        await ensureSchema(pool);
    }
    ).catch(error => {
        console.log("error: ", error)
        res.send("table already created..");
    })
    */
    const docRef = gcp_infra_svcs.db.collection('users').doc('alovelace');
    console.log("docRef is ", docRef)

    addRecord(docRef, "David")
    var ruleId = uuid.v4()
    setDocumentData("testDocId", ruleId)
    
    getDocumentData('test')
    getRecord('users', gcp_infra_svcs.db)
});

async function setDocumentData(emailAddress, ruleId) {
    const data = {
        email: emailAddress
    }

    const result = await gcp_infra_svcs.db.collection('emails').doc(ruleId).set(data)
    console.log("added email address is ", result)
}

async function getDocumentData(tagId){
    const documentRef = gcp_infra_svcs.db.collection('emails').doc(tagId)
    const doc = await documentRef.get()
    if(!doc.exists) {
        console.log('No such document');
    } else {
        console.log('Document data:', doc.data());
    }
}

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
