const elasticsearch = require('elasticsearch')
const hosts = ['rozloges1:19200']
const apiVersion = '6.0'
var logClient = new elasticsearch.Client({
  hosts,
  apiVersion,
  requestTimeout: 600000
})
let esClient = {
  search: async (body) => {
    if (!logClient) {
      logClient = new elasticsearch.Client({
        hosts,
        apiVersion,
        requestTimeout: 600000
      })
    }
    try {
      const response = await logClient.search(
        {
          index: 'logstash-userlog*',
          type: 'logs',
          body: body
        })
      return response
    } catch (error) {
      console.log(error.message)
      // __ilogger.error(`es error: ${error.message}`)
    }
  }
}
module.exports = esClient
