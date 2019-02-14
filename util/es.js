const elasticsearch = require('elasticsearch')
var ES_CLIENT
var ART_CLIENT
let esClient = {
  esClient: (sql, values) => {
    if (ES_CLIENT) {
      return ES_CLIENT
    }
    const hosts = ['sgvcces:19200']
    const apiVersion = '5.0'
    const client = new elasticsearch.Client({
      hosts,
      apiVersion,
      requestTimeout: 600000
    })
    ES_CLIENT = client
    return client
  },
  artClient: (sql, values) => {
    if (ART_CLIENT) {
      return ART_CLIENT
    }
    const hosts = ['sgvcces:19200']
    const apiVersion = '5.0' // FIXME: VERSION
    const client = new elasticsearch.Client({
      hosts,
      apiVersion,
      requestTimeout: 600000
    })
    ART_CLIENT = client
    return client
  }
}
module.exports = esClient
