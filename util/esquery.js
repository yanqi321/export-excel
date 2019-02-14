const esClient = require('./es')
const fecha = require('fecha')
let esindex = {
  actResult: (body) => {
    return new Promise(function (resolve, reject) {
      var resultJson
      var client = esClient.esClient()
      client.search(
        {
          index: 'logstash-articlelog*',
          type: 'doc',
          body: body,
          from: 0,
          size: 1000,
          stored_fields: ['article_id']
        },
        function (err, response) {
          if (err) {
            console.error('err is:', JSON.stringify(err))
            reject(err)
          } else {
            resultJson = {
              msg: 'ok',
              arr: response.aggregations.agg_author.buckets
            }
            resolve(resultJson)
          }
        }
      )
    })
  },
  uuidResult: (body) => {
    return new Promise(function (resolve, reject) {
      var resultJson
      var client = esClient.esClient()
      client.search(
        {
          index: 'logstash-articlelog*',
          type: 'doc',
          body: body,
          from: 0,
          size: 1000,
          stored_fields: ['article_id']
        },
        function (err, response) {
          if (err) {
            console.error('err is:', JSON.stringify(err))
            reject(err)
          } else {
            resultJson = {
              msg: 'ok',
              arr: response.aggregations.agg_article
            }
            resolve(resultJson)
          }
        }
      )
    })
  },
  gpResult: (begin, end, body) => {
    return new Promise(function (resolve, reject) {
      var resultJson
      var client = esClient.esClient()
      client.search(
        {
          index: 'logstash-articlelog*',
          type: 'doc',
          body: body,
          from: 0,
          size: 1000,
          stored_fields: ['article_id']
        },
        function (err, response) {
          if (err) {
            console.error('error is ', JSON.stringify(err))
            reject(err)
          } else {
            if (response.aggregations.aggs_userId) {
              resultJson = {
                msg: 'ok',
                arr: response.aggregations.aggs_userId
              }
            } else {
              resultJson = {
                msg: 'false',
                currTime: fecha.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
              }
            }
            resolve(resultJson)
          }
        }
      )
    })
  },
  artResult: (body) => {
    return new Promise(function (resolve, reject) {
      var resultJson
      var client = esClient.artClient()
      client.search(
        {
          index: 'wemedia_article', // FIXME: INDEX
          type: 'webpage',
          body: body,
          from: 0,
          size: 1000,
          stored_fields: ['uuid']
        },
        function (err, response) {
          if (err) {
            console.error('err is:', JSON.stringify(err))
            reject(err)
          } else {
            resultJson = {
              msg: 'ok',
              arr: response.aggregations.agg_author.buckets
            }
            resolve(resultJson)
          }
        }
      )
    })
  }
}
module.exports = esindex
