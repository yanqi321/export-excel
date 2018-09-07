global.__logConnPool = require('./util/mysql').logConnPool
global.__wemediaConnPool = require('./util/mysql').wemediaConnPool
global.__logQuery = require('./util/mysql').logQuery
global.__wemediaQuery = require('./util/mysql').wemediaQuery

const main = require('./src/export_full')

const log4js = require('log4js')

const dev = process.env.NODE_ENV || 'development'
const log4config = require('./config/log4js')[dev]
const config = log4config['config']
log4js.configure(config)
global.__ilogger = log4js.getLogger('info')
global.mlogger = log4js.getLogger('mysql')

main()
