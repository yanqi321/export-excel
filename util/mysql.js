var mysql = require('promise-mysql')
let config = require('../config/mysql')
let mysqlTool = {
  localConnPool: mysql.createPool({
    connectionLimit: config.local.limitSize,
    host: config.local.host,
    user: config.local.username,
    password: config.local.password,
    database: config.local.database,
    charset: config.local.charset
  }),
  remoteConnPool: mysql.createPool({
    connectionLimit: config.remote.limitSize,
    host: config.remote.host,
    user: config.remote.username,
    password: config.remote.password,
    database: config.remote.database,
    charset: config.remote.charset
  }),
  localQuery: async (sql, values) => {
    let connection = await __localConnPool.getConnection()
    let results = await connection.query(sql, values)
    __localConnPool.releaseConnection(connection)
    return results
  },
  remoteQuery: async (sql, values) => {
    let connection = await __remoteConnPool.getConnection()
    let results = await connection.query(sql, values)
    __remoteConnPool.releaseConnection(connection)
    return results
  }
}
module.exports = mysqlTool
