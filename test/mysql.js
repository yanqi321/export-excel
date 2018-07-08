let mysql = require('mysql')
let mysqlConfig = require('../config/mysql')

let testLocalConnection = () => {
  let connection = mysql.createConnection({
    host: mysqlConfig.local.host,
    port: mysqlConfig.local.port,
    user: mysqlConfig.local.username,
    password: mysqlConfig.local.password
  })
  connection.connect((error) => {
    if (error) {
      console.error('Local MySQL Connection', error.toString())
    } else {
      console.info('Local MySQL Connection Success.')
    }
  })
  connection.end(() => {
    console.warn('Local MySQL Disconnect.')
  })
}

let testRemoteConnection = () => {
  let connection = mysql.createConnection({
    host: mysqlConfig.remote.host,
    port: mysqlConfig.remote.port,
    user: mysqlConfig.remote.username,
    password: mysqlConfig.remote.password
  })
  connection.connect((error) => {
    if (error) {
      console.error('Remote MySQL Connection', error.toString())
    } else {
      console.info('Remote MySQL Connection Success.')
    }
  })
  connection.end(() => {
    console.warn('Remote MySQL Disconnect.')
  })
}

testLocalConnection()
testRemoteConnection()
