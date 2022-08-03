const express = require("express");
const utils = require('.././services/utils.js');
const api_svcs = require('.././services/api.js');
const config = require('../config.js');
const HashMap = require('hashmap');
const gcp_infra_svcs = require('.././services/gcp-infra.js');
const CODA = require('coda-js').Coda;
const nodeMailer = require("nodemailer");

const router = express.Router();

const coda = new CODA(config.coda_api_key);

const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: config.mail.MAIL_USERNAME,
      pass: config.mail.MAIL_PASSWORD,
      clientId: config.mail.OAUTH_CLIENTID,
      clientSecret: config.mail.OAUTH_CLIENT_SECRET,
      refreshToken: config.mail.OAUTH_REFRESH_TOKEN
    }
  });

router.get("/", function (req, res) {
    console.log('-- API Services -- ');
    res.send('API Services');
});

router.get("/trends/:minutes/:tagId", function (req, res) {
    console.log('-- API Services | Trending Data -- ');
    var map = new HashMap();
    var minutes = req.params.minutes
    console.log("minutes:", minutes)
    var tagId = req.params.tagId

    api_svcs.getTrendsFromTag(minutes, tagId).then(function (results)  {
        if(results) {
            console.log('result is ',results[0])
        
           results[0].forEach(element => {
            // de deduplicate the results
            if(map.has(element["TWEET_TXT"])){
                console.log("already have this result")
            } else {
                map.set(element["TWEET_TXT"], element)
            }
           });
           res.send(map.values());
        }
    });
    
});

router.get("/coda", function(req, res) {
    var docId = "A7Rsgm7R6d"
    //let tableName = "Trends"
    let tableName = "RecentSearch"
    let tweet = {}
    //need to doc id and table name 


    try {
        insertIntoCoda(docId, tableName, tweet)
    } catch (e) {
        console.log('Error ', e);
    }
})

router.get("/mail/:minutes", function(req, res) {

      // get all the tagIds and corresponding email address
      // for each tagId grab the sql query json 
      // then send those
      // grab these from firebase
      // just need to make sure to get the data correctly from firebase 
      let tagId = '09c7f63e-7762-4c85-a273-ff50a734f8da'
      api_svcs.setDocumentData('davidajoyce141@gmail.com', tagId)
      //tagIdsToEmailAddress = [{tagId: "test", emailAdress: "test@gmail.com"}] 
      var map = new HashMap();
      //emailAddress.tagId = tagId

      var minutes = req.params.minutes
      console.log("minutes:", minutes)
      // testing one ruleId for email address 
      //tagIdsToEmailAddress = getTagsIdsFromEmail(tagId)
      tagIdsToEmailAddress = tagIdsToEmailAddress();
      //tagIdsToEmailAddress.push(emailAddress)
      //tweets = [];
      //console.log('tag id email address: ', tagIdsToEmailAddress)
      tagIdsToEmailAddress.then(function(tagsToEmails){
        console.log('tagsToEmails: ', tagsToEmails)
        tagsToEmails.forEach( tagIdEmail => {
            api_svcs.getTrendsFromTag(minutes, tagIdEmail.tagId).then(function(results){
                if(results) {
                    console.log("results are :", results)
                    console.log('result is ',results[0])

                    results[0].forEach(element => {
                        // de deduplicate the results
                        if(map.has(element["TWEET_TXT"])){
                            console.log("already have this result")
                        } else {
                            map.set(element["TWEET_TXT"], element)
                        }
                       });
                    console.log("tweets to send to mail, ", map.values())
                    sendEmail(tagIdEmail.email, map.values())
                }
            })
        })
      }).catch(function(error){
        console.log('error :', error)
      }) 
      
});

async function getTagIdsToEmailaddress(tagId) {
    tagIdToEmail = [];
    emailAddress = api_svcs.getDocumentData(tagId).then(function(data){
        data.tagId = tagId
        tagIdToEmail.push(data)
        return tagIdToEmail
    })
}

async function getTagsIdsFromEmail(tagId){
    tagIdToEmail = [];
    const documentRef = gcp_infra_svcs.db.collection('emails').doc(tagId);
    const doc = await documentRef.get()
    if(!doc.exists) {
        console.log('No such document');
    } else {
        console.log('email data:', doc.data());
        let emailData = doc.data();
        emailData.tagId = tagId;
        tagIdToEmail.push(emailData);
        return tagIdToEmail;
    }
}

async function tagIdsToEmailAddress(){
    tagIdToEmail = []
    const snapshot = await gcp_infra_svcs.db.collection('emails').get();
    snapshot.forEach((doc) => {
        console.log(doc.id, '=>', doc.data());
        let emailData = doc.data();
        emailData.tagId = tagId;
        tagIdToEmail.push(emailData);
    })
    return tagIdToEmail;
}

router.get("/push/:minutes", function (req, res) {
    console.log('-- API Services | Trending Data -- ');
    var map = new HashMap();
    var minutes = req.params.minutes
    console.log("minutes:", minutes)

    api_svcs.getTrends(minutes).then(function (results)  {
        if(results) {
            console.log('result is ',results[0])
            results[0].forEach(element => {
            // de deduplicate the results
            if(map.has(element["TWEET_TXT"])){
                console.log("already have this result")
            } else {
                map.set(element["TWEET_TXT"], element)
            }
           });
           sendTweetsToCoda(map.values())
           res.send(map.values());
        }
    });
});

function sendEmail(emailAdress, tweets){
    var bodyText = ''
    tweets.forEach(tweet => {
        bodyText = bodyText + tweet.TWEET_TXT + "," + "\r\n" + tweet.TWEET_URL + "\r\n\n"
    })

    console.log("email address is ", emailAdress)
    console.log("body text is: ", bodyText)


    let textForEmail = 'Hi from your coda twitter trend pack, here are your top tweets:\r\n\n' + bodyText

    console.log("email text: ", textForEmail)

    let mailOptions = {
        from: "davidajoyce141@gmail.com",
        to: emailAdress,
        subject: 'Coda Tweet Trends',
        text: textForEmail
      };

    transporter.sendMail(mailOptions, function(err, data) {
    if (err) {
        console.log("Error " + err);
    } else {
        console.log("Email sent successfully");
    }
    });
}

async function sendTweetsToCoda(trendTweets) {
    // this is the coda table name I've named the sync table 
    let tableName = "Trends"
    console.log("table name is ", tableName)
    console.log("trend tweets are", trendTweets)
    if(trendTweets){
        console.log("trendTweets are ", trendTweets)
        trendTweets.forEach(tweet => {
            var tag_id = tweet["TAG_ID"];
            //var documentData = getDocumentData(tag_id);
            //var docId = documentData.docId
            var docId = "A7Rsgm7R6d"
            //need to doc id and table name 
            try {
                insertIntoCoda(docId, tableName, tweet)
            } catch (e) {
                console.log('Error ', e);
            }
        })
    }
}

async function insertIntoCoda(docId, tableName, tweet) {
    var tweetsToInsert = [];
    console.log("inserting to coda");
    var tweetForTable = {
        Trends: tweet.TWEET_TXT,
        tweetText: tweet.TWEET_TXT,
        tweetUrl: tweet.TWEET_URL,
        retweets: tweet.retweets,
        likes: tweet.likes,
        replies: tweet.replies
    }

    var testTweet = {
        column: 'tweetText',
        value: 'test text'
    }

    tweetsToInsert.push(testTweet);
    try {
        const results = await coda.getTable(docId, tableName)
        .then(function(table) {
            console.log("table is :", table)
            const columns = table.listColumns();
            const rows = table.listRows();
            return columns, rows
            //console.log("columns are :", columns);
            //console.log("rows are :", rows);
            //console.log("table is :", table)
            //table.insertRows(tweetsToInsert)
        })
        .then(function(columns, rows){
            console.log("columns are :", columns);
            console.log("rows are :", rows);
        })
        .catch(function (error) {
            console.log("error  inserting", error)
        });
    } catch (e){
        console.log('Error ', e);
    }
}

async function setDocumentData(emailAddress, ruleId) {
    const data = {
        email: emailAddress
    }

    const result = await gcp_infra_svcs.db.collection('emails').doc(ruleId).set(data)
    console.log("added email address is ", result)
}

async function getDocumentData(tagId){
    const documentRef = gcp_infra_svcs.db.collection('documentIds').doc(tagId);
    const doc = await documentRef.get()
    if(!doc.exists) {
        console.log('No such document');
    } else {
        console.log('Document data:', doc.data());
        return doc.data();
    }
}

function responseAPISchema() {
    map.forEach(function (entry, index)  {

    })
}

module.exports = router
