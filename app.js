/*
说明：用户分析程序导出 对应 export_full.js
*/
global.__localConnPool = require('./util/mysql').localConnPool
global.__localQuery = require('./util/mysql').localQuery

const main = require('./src/main')

const log4js = require('log4js')

const dev = process.env.NODE_ENV || 'development'
const log4config = require('./config/log4js')[dev]
const config = log4config['config']
log4js.configure(config)
global.__ilogger = log4js.getLogger('info')
global.mlogger = log4js.getLogger('mysql')

main()
