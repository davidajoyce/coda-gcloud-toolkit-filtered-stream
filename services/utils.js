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
    COUNT(*) AS MENTIONS, TRENDS.text as TWEET_TXT, TRENDS.tweet_url as TWEET_URL, TRENDS.public_metrics.like_count as likes, TRENDS.public_metrics.quote_count as quotes, TRENDS.public_metrics.reply_count as replies, TRENDS.public_metrics.retweet_count as retweets
  FROM `+ tableName +` AS TRENDS,
    UNNEST(context_annotations) AS context,
    UNNEST(entities.annotations) AS entity
  where created_at > DATETIME_SUB(current_datetime(), INTERVAL `+ minutes +` MINUTE) 
  GROUP BY
    ENTITY_NAME, DOMAIN_NAME, ENTITY_TEXT, ENTITY_TYPE, C_ID, TWEET_TXT, TWEET_URL, likes, quotes, replies, retweets
  ORDER BY
    MENTIONS DESC`;
}

module.exports = { sleep, getTrends, getTrendsInfo };