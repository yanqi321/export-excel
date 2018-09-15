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

let testLogConnection = () => {
  let connection = mysql.createConnection({
    host: mysqlConfig.log.host,
    port: mysqlConfig.log.port,
    user: mysqlConfig.log.username,
    password: mysqlConfig.log.password
  })
  connection.connect((error) => {
    if (error) {
      console.error('log MySQL Connection', error.toString())
    } else {
      console.info('log MySQL Connection Success.')
    }
  })
  connection.end(() => {
    console.warn('log MySQL Disconnect.')
  })
}

let testWemediaConnection = () => {
  let connection = mysql.createConnection({
    host: mysqlConfig.wemedia.host,
    port: mysqlConfig.wemedia.port,
    user: mysqlConfig.wemedia.username,
    password: mysqlConfig.wemedia.password
  })
  connection.connect((error) => {
    if (error) {
      console.error('wemedia MySQL Connection', error.toString())
    } else {
      console.info('wemedia MySQL Connection Success.')
    }
  })
  connection.end(() => {
    console.warn('wemedia MySQL Disconnect.')
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
      console.error('remote MySQL Connection', error.toString())
    } else {
      console.info('remote MySQL Connection Success.')
    }
  })
  connection.end(() => {
    console.warn('remote MySQL Disconnect.')
  })
}

testLocalConnection()
testLogConnection()
testWemediaConnection()
testRemoteConnection()
