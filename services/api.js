const { BigQuery } = require("@google-cloud/bigquery");
const config = require('../config.js');
const utils = require('./utils.js');
const gcp_infra_svcs = require('.././services/gcp-infra.js');
const { response } = require("express");

async function getTrends(minutes) {

    return new Promise(function (resolve, reject) {

        const bigqueryClient = new BigQuery();
        let tableName = config.gcp_infra.projectId + '.' + config.gcp_infra.bq.dataSetId + '.' + config.gcp_infra.bq.table.tweets;
        console.log('getTrends SQL ', utils.getTrendsTagInfo(tableName, minutes));
        const options = {
            query: utils.getTrendsTagInfo(tableName, minutes),
            location: 'US',
        };

        //const [rows] = await bigqueryClient.query(options);
        bigqueryClient.query(options).then(function (rows)   {
            console.log('Query Results: ', rows);
            resolve(rows);
        }).catch(function (error)   {
            reject(error);
        })
        //console.log('Query Results: ', rows.length);
        //return rows;
        //resolve(rows)

    })

}

async function getTrendsFromTag(minutes, tagId) {

    return new Promise(function (resolve, reject) {

        const bigqueryClient = new BigQuery();
        let tableName = config.gcp_infra.projectId + '.' + config.gcp_infra.bq.dataSetId + '.' + config.gcp_infra.bq.table.tweets;
        console.log('getTrends SQL ', utils.getTrendsTag(tableName, minutes, tagId));
        const options = {
            query: utils.getTrendsTag(tableName, minutes, tagId),
            location: 'US',
        };

        //const [rows] = await bigqueryClient.query(options);
        bigqueryClient.query(options).then(function (rows)   {
            console.log('Query Results: ', rows);
            resolve(rows);
        }).catch(function (error)   {
            reject(error);
        })
        //console.log('Query Results: ', rows.length);
        //return rows;
        //resolve(rows)

    })

}


async function setDocumentData(emailAddress, ruleId) {
    return new Promise(function(resolve, reject){
        
        const data = {
            email: emailAddress
        }

        gcp_infra_svcs.db.collection('emails').doc(ruleId).set(data).then(function(result) {
            console.log("added email address is ", result)
            resolve(result)
        }).catch(function(error) {
            reject(error);
        })
        
        //console.log("added email address is ", result)
        //resolve(result)
    })
}

async function getDocumentData(tagId){
    return new Promise(function(resolve, reject){
        
        documentRef.get().then(function(doc){
            if(!doc.exists) {
                console.log('No such document');
            } else {
                console.log('Document data:', doc.data());
                resolve(doc.data());
            }
        }).catch(function(error){
            reject(error);
        })
        
    })
}



module.exports = { getTrends, setDocumentData, getDocumentData, getTrendsFromTag };