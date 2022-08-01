function sleep(milliseconds) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('timed');
        }, milliseconds)
    })
}

function getTrends(tableName, minutes) {
    return `SELECT
    context.domain.name as CONTEXT, entity.normalized_text as ENTITY, entity.type as ENTITY_TYPE,
    COUNT(*) AS TWEET_COUNT
  FROM `+ tableName + ` AS GT,
    UNNEST(context_annotations) AS context,
    UNNEST(entities.annotations) AS entity
where created_at > DATETIME_SUB(current_datetime(), INTERVAL `+ minutes + ` MINUTE) 
  GROUP BY
     ENTITY, ENTITY_TYPE, CONTEXT
  ORDER BY
    TWEET_COUNT DESC`;
}

function getTrendsInfo(tableName, minutes) {
    return `SELECT
    context.entity.name AS ENTITY_NAME, context.domain.name AS DOMAIN_NAME, context.domain.id AS C_ID, entity.normalized_text as ENTITY_TEXT, entity.type as ENTITY_TYPE, 
    COUNT(*) AS MENTIONS, TRENDS.text as TWEET_TXT, TRENDS.tweet_url as TWEET_URL, TRENDS.public_metrics.like_count as likes, 
    TRENDS.public_metrics.quote_count as quotes, TRENDS.public_metrics.reply_count as replies, TRENDS.public_metrics.retweet_count as retweets, TRENDS.tag_id as TAG_ID,
  FROM `+ tableName +` AS TRENDS,
    UNNEST(context_annotations) AS context,
    UNNEST(entities.annotations) AS entity
  where created_at > DATETIME_SUB(current_datetime(), INTERVAL `+ minutes +` MINUTE) 
  GROUP BY
    ENTITY_NAME, DOMAIN_NAME, ENTITY_TEXT, ENTITY_TYPE, C_ID, TWEET_TXT, TWEET_URL, likes, quotes, replies, retweets, TAG_ID
  ORDER BY
    MENTIONS DESC`;
}

function getTrendsTag(tableName, minutes, tagId) {
  return `SELECT text as TWEET_TXT, tweet_url as TWEET_URL, public_metrics.like_count as likes, public_metrics.quote_count as quotes, 
  public_metrics.reply_count as replies, public_metrics.retweet_count as retweets, tag_id as TAG_ID
  FROM `+ tableName +`
  WHERE tag_id = `+ tagId +`
  AND created_at > DATETIME_SUB(current_datetime(), INTERVAL `+ minutes +`  MINUTE)
  ORDER BY retweets DESC`;
}

function getTrendsTagInfo(tableName, minutes) {
  return `SELECT text as TWEET_TXT, tweet_url as TWEET_URL, public_metrics.like_count as likes, public_metrics.quote_count as quotes, 
  public_metrics.reply_count as replies, public_metrics.retweet_count as retweets, tag_id as TAG_ID
  FROM `+ tableName +`
  WHERE created_at > DATETIME_SUB(current_datetime(), INTERVAL `+ minutes +`  MINUTE)
  ORDER BY retweets DESC`;
}

module.exports = { sleep, getTrends, getTrendsInfo, getTrendsTagInfo, getTrendsTag };