const express = require("express");
const gcp_infra_svcs = require('.././services/gcp-infra.js');
const config = require('../config.js');
const { search } = require("./stream.js");
const axios = require("axios").default;

const router = express.Router();

router.get("/:tweetquery", function (req, res) {

    var query = `"${req.params.tweetquery}" is:retweet lang:en`
    console.log("query is:", query)
    const parameters = {
        'query': query,
        'tweet.fields': `public_metrics,author_id`
    }
    
    let axiosConfig = {
        method: 'get',
        url: config.recent_search.api,
        headers: { 'Authorization': config.twitter_bearer_token },
        params: parameters
    };

    axios(axiosConfig)
        .then(function (response) {
            let searchData = response.data.data;
            // simplify the response
            for(var index in searchData){
                searchData[index].tweet_url = 'http://twitter.com/twitter/status/' + searchData[index].id
                searchData[index].retweet_count = searchData[index].public_metrics.retweet_count
                searchData[index].like_count = searchData[index].public_metrics.like_count
                searchData[index].reply_count = searchData[index].public_metrics.reply_count
                searchData[index].quote_count = searchData[index].public_metrics.quote_count
                delete searchData[index].public_metrics
            }
            if( searchData === undefined)    {
                searchData = [];
            }
            searchData
            res.send(searchData);
        })
        .catch(function (error) {
            console.log(error);
        });
});

module.exports = router
