import * as coda from "@codahq/packs-sdk";
export const pack = coda.newPack();


// Allow the Pack to access the GitHub domain.
pack.addNetworkDomain("twittercodahackathon.ts.r.appspot.com");

// A schema that defines a trends object.
const TrendSchema = coda.makeObjectSchema({
  properties: {
    entityName: { type: coda.ValueType.String, fromKey: "ENTITY_NAME" },
    domainName: { type: coda.ValueType.String, fromKey: "DOMAIN_NAME" },
    cId: { type: coda.ValueType.Number, fromKey: "C_ID" },
    entityText: { type: coda.ValueType.String, fromKey: "ENTITY_TEXT" },
    entityType: { type: coda.ValueType.String, fromKey: "ENTITY_TYPE" },
    mentions: { type: coda.ValueType.Number, fromKey: "MENTIONS" },
    tweetText: { type: coda.ValueType.String, fromKey: "TWEET_TXT" },
    tweetUrl: {
      type: coda.ValueType.String,
      codaType: coda.ValueHintType.Url,
      fromKey: "TWEET_URL",
    },
    likes: { type: coda.ValueType.Number, fromKey: "likes" },
    quotes: { type: coda.ValueType.Number, fromKey: "quotes" },
    replies: { type: coda.ValueType.Number, fromKey: "replies" },
    retweets: { type: coda.ValueType.Number, fromKey: "replies" },
  },
  displayProperty: "tweetText",
  idProperty: "cId",
  featuredProperties: ["tweetText", "tweetUrl", "mentions","likes", "retweets"],
});

// A schema that defines a trends object.
const TrendReducedSchema = coda.makeObjectSchema({
  properties: {
    tweetText: { type: coda.ValueType.String, fromKey: "TWEET_TXT" },
    tweetUrl: {
      type: coda.ValueType.String,
      codaType: coda.ValueHintType.Url,
      fromKey: "TWEET_URL",
    },
    likes: { type: coda.ValueType.Number, fromKey: "likes" },
    replies: { type: coda.ValueType.Number, fromKey: "replies" },
    retweets: { type: coda.ValueType.Number, fromKey: "retweets" },
  },
  displayProperty: "tweetText",
  idProperty: "tweetText",
  featuredProperties: ["tweetText", "tweetUrl", "retweets","likes", "replies"],
});

// A schema that defines a recent search object.
const RecentSearchSchema = coda.makeObjectSchema({
  properties: {
    id: { type: coda.ValueType.String, fromKey: "id" },
    tweetText: { type: coda.ValueType.String, fromKey: "text" },
    authorId: { type: coda.ValueType.Number, fromKey: "author_id" },
    tweetUrl: {
      type: coda.ValueType.String,
      codaType: coda.ValueHintType.Url,
      fromKey: "tweet_url",
    },
    retweets: { type: coda.ValueType.Number, fromKey: "retweet_count" },
    likes: { type: coda.ValueType.Number, fromKey: "like_count" },
    replies: { type: coda.ValueType.Number, fromKey: "reply_count" },
    quotes: { type: coda.ValueType.Number, fromKey: "quote_count" },
  },
  displayProperty: "id",
  idProperty: "id",
  featuredProperties: ["tweetText", "tweetUrl", "retweets", "likes", "replies"],
});


// A sync table that lists all of the trends you created.
pack.addSyncTable({
  name: "Trends",
  description: "All of the trends requested by user",
  identityName: "Trends",
  schema: TrendReducedSchema,
  formula: {
    name: "TrendTable",
    description: "Choose date to search your trends",
    parameters: [
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: "trendRule",
        description: "define trend rule",
      }),
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: "trendRuleTag",
        description: "tag for rule you create",
      }),
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: "emailAddress",
        description: "email address to send coda tweet trends",
      }),
      coda.makeParameter({
        type: coda.ParameterType.Date,
        name: "dateTime",
        description: "input date and time",
      }),
      ],
    execute: async function ([trendRule, trendRuleTag, emailAddress, dateTime], context) {


      let tagId = trendRuleTag.trim() +  trendRule.trim()

      let minutes = Math.trunc((Date.now() - dateTime.getTime())/60000)
      console.log("minutes: ", minutes)

      var value = {"add": [{"value": trendRule}]}

      var index: number = (context.sync.continuation?.index as number) || 10;

      console.log("tagId is: ", tagId)

      if(index == 10){
        let response = await context.fetcher.fetch({
        url: `https://twittercodahackathon.ts.r.appspot.com/rules/${tagId}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rule: value,
          email: emailAddress
        }),
      });

        console.log("rule respone, ", response.body)

        let streamResponse = await context.fetcher.fetch({
        method: "GET",
        url: `https://twittercodahackathon.ts.r.appspot.com/stream`,
        cacheTtlSecs: 0
        });
        
        console.log("stream response: ", streamResponse.body)
      }

      let trendResponse = await context.fetcher.fetch({
      method: "GET",
      url: `https://twittercodahackathon.ts.r.appspot.com/api/trends/${minutes}/${tagId}`,
      cacheTtlSecs: 0
       });
      let trends = trendResponse.body;
      console.log("results are", trends)
      console.log("results length is : ", trends.length)

      console.log("index is going to be: ", index);

      if(trends.length == 0){
        index = index - 1
      } else {
        index = 0
      }

      console.log("index is now: ", index);
      
      let continuation;
      if (index > 0) {
        continuation = {
          index: index
        };
      }

      // Return the trends if there is any yet
      // continues for a few more tries while streaming tweets are coming in
      return {
        result: trends,
        continuation: continuation,
      };
    },
  },
});

// create a sync table for recent search
pack.addSyncTable({
  name: "RecentSearch",
  description: "Recent Search of Tweets last 7 days",
  identityName: "RecentSearch",
  schema: RecentSearchSchema,
  formula: {
    name: "recentSearch",
    description: "Define recent search",
    parameters: [
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: "recentSearch",
        description: "define recent search",
      }),
      ],
    execute: async function ([recentSearch], context) {
      
      let endpoint = context.endpoint
      console.log("endpoint, ", endpoint)
      let test = context.invocationLocation.protocolAndHost
      console.log("protocol and host ", test)
      let docId = context.invocationLocation.docId
      console.log("docId,", docId)
    
      let response = await context.fetcher.fetch({
      method: "GET",
      url: `https://twittercodahackathon.ts.r.appspot.com/search/${recentSearch}`,
      cacheTtlSecs: 0
       });
      let recentSearchResult = response.body;
      console.log("recent search results are", recentSearchResult)
    
      return {
        result: recentSearchResult,
      };
    },
  },
});
