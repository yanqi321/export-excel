const esClient = require('./es')
let esindex = {
  logResult: async (body) => {
    try {
      let client = esClient.esClient()
      const response = await client.search(
        {
          index: 'logstash-articlelog*',
          type: 'doc',
          body: body
        })
      return response.aggregations.agg_atype.buckets
    } catch (error) {
      __ilogger.error(`es error: ${error.message}`)
    }
  }
}
module.exports = esindex
