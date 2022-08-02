import * as coda from "@codahq/packs-sdk";
export const pack = coda.newPack();

// Regular expression used to parse repo URLs.
const RepoUrlRegex = new RegExp("^https://github.com/([^/]+)/([^/]+)");

// How many items to fetch per-page when making API list requests.
const PageSize = 50;

// Allow the Pack to access the GitHub domain.
pack.addNetworkDomain("twittercodahackathon.ts.r.appspot.com");


// Setup per-user authentication using GitHub's OAuth2.
// Remember to set your client ID and secret in the "Settings" tab.
// See https://docs.github.com/en/developers/apps/building-oauth-apps
/*
pack.setUserAuthentication({
  type: coda.AuthenticationType.OAuth2,
  authorizationUrl: "https://github.com/login/oauth/authorize",
  tokenUrl: "https://github.com/login/oauth/access_token",
  tokenPrefix: "token",
  scopes: ["repo", "user"],

  // Determines the name of the GitHub account that was connected.
  getConnectionName: async function (context) {
    let response = await context.fetcher.fetch({
      method: "GET",
      url: "https://api.github.com/user",
    });
    return response.body.login;
  },
});
*/

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

// A formula to fetch information about a repo.
pack.addFormula({
  name: "TweetInfo",
  description: "Get information about tweets streamed URL.",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "url",
      description: "The URL of the trend app.",
    }),
  ],
  resultType: coda.ValueType.Object,
  schema: TrendSchema,
  execute: async function ([url], context) {
    //let { owner, name } = parseRepoUrl(url);
    let response = await context.fetcher.fetch({
      method: "GET",
      url: `https://twittercodahackathon.ts.r.appspot.com/api/trends`,
      cacheTtlSecs: 0
    });
    let trends = response.body;
    console.log("results are", trends)
    return trends;
  },
});

// A column format that automatically applies the Repo() formula.
pack.addColumnFormat({
  name: "TweetInfo",
  instructions: "Show details about a GitHub repo, given a URL.",
  formulaName: "TweetInfo",
  //matchers: [RepoUrlRegex],
});

// An action formula that allows a user to star a repo.
/*
pack.addFormula({
  name: "Star",
  description: "Add a star to a repo.",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "url",
      description: "The URL of the repo.",
    }),
  ],
  resultType: coda.ValueType.Boolean,
  isAction: true,
  execute: async function ([url], context) {
    let { owner, name } = parseRepoUrl(url);
    let response = await context.fetcher.fetch({
      method: "PUT",
      url: `https://api.github.com/user/starred/${owner}/${name}`,
    });
    return true;
  },
});
*/

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
        name: "emailAddress",
        description: "email address to send coda tweet trends",
      }),
      coda.makeParameter({
        type: coda.ParameterType.Date,
        name: "dateTime",
        description: "input date and time",
      }),
      ],
    execute: async function ([trendRule, emailAddress, dateTime], context) {
      // Get the page to start from.
      //let page = (context.sync.continuation?.page as number) || 1;
      // convert to minutes

      //let minutes = Math.trunc((Date.now() - dateTime.getTime())/60000)
      //console.log("minutes: ", minutes)
      // {  "add": [ { "value" : "(doge) sample:10"}] }

      var value = {"add": [{"value": trendRule}]}

      let index: number = (context.sync.continuation?.index as number) || 10;

      let response = await context.fetcher.fetch({
      url: "https://twittercodahackathon.ts.r.appspot.com/rules",
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
    
      let trendResponse = await context.fetcher.fetch({
      method: "GET",
      url: `https://twittercodahackathon.ts.r.appspot.com/api/trends/${60}`,
      cacheTtlSecs: 0
       });
      let trends = trendResponse.body;
      console.log("results are", trends)

      if(trends.length == 0){
        index = index - 1
      } else {
        index = 0
      }
      
      let continuation;
      if (index >= 0) {
        continuation = {
          index: index,
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
      // Get the page to start from.
      //let page = (context.sync.continuation?.page as number) || 1;
      // convert to minutes
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
    

      // If there were some results, re-run this formula for the next page.
      /*let continuation;
      if (repos.length > 0) {
        continuation = { page: page + 1 };
      }*/

      // Return the repos and the continuation (if any).
      return {
        result: recentSearchResult,
        //continuation: continuation,
      };
    },
  },
});


// A helper function that parses a repo URL and returns the owner and name.
function parseRepoUrl(url) {
  let match = url.match(RepoUrlRegex);
  if (!match) {
    throw new coda.UserVisibleError("Invalid repo URL: " + url);
  }
  return {
    owner: match[1],
    name: match[2],
  };
}