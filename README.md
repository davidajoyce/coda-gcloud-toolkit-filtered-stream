

This project is forked from https://github.com/twitterdev/gcloud-toolkit-filtered-stream and has specific changes to create services to interact with a coda pack extension

See codaPack folder for the pack script.

Please see https://devpost.com/software/twitter-trends for more details on the submission along with the architecture diagram. 

Find instructions on how to create your own stream service here: 

[Developer Guide: Twitter API Toolkit for Google Cloud - Filtered Stream](https://developer.twitter.com/en/docs/tutorials/developer-guide--twitter-api-toolkit-for-google-cloud1)

This repo contains the services used by a coda pack extension to do the following: 

- create a trend rule with Twitter Stream service rule api with a tag id
- start a streaming service to load the tweets onto a topic for google pub sub 
- a loader service that pulls these tweets and loads them in a Google BigQUery
- a google firebase database to store tag ids and email address
- a mail service called by a google scheduler to query the BigQuery dataset, find the tweets related to tag Ids and then send emails to people for their top tweets in the day 

