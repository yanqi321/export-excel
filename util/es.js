const elasticsearch = require('elasticsearch')
var ES_CLIENT
let esClient = {
  esClient: (sql, values) => {
    if (ES_CLIENT) {
      return ES_CLIENT
    }
    const hosts = ['cccommon:19200']
    const apiVersion = '5.6'
    const client = new elasticsearch.Client({
      hosts,
      apiVersion,
      requestTimeout: 600000
    })
    ES_CLIENT = client
    return client
  }
}
module.exports = esClient
