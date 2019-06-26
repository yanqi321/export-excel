var mysql = require('promise-mysql')
let config = require('../config/mysql')
let mysqlTool = {
  localConnPool: mysql.createPool({
    connectionLimit: config.local.limitSize,
    host: config.local.host,
    user: config.local.username,
    password: config.local.password,
    database: config.local.database,
    charset: config.local.charset,
    port: config.local.port
  }),
  localQuery: async (sql, values) => {
    let connection = await __localConnPool.getConnection()
    let results = await connection.query(sql, values)
    __localConnPool.releaseConnection(connection)
    return results
  }
}
module.exports = mysqlTool
