// global.__localConnPool = require('./util/mysql').localConnPool
// global.__remoteConnPool = require('./util/mysql').remoteConnPool
global.__wemediaConnPool = require('./util/mysql').wemediaConnPool
// global.__localQuery = require('./util/mysql').localQuery
// global.__remoteQuery = require('./util/mysql').remoteQuery
global.__wemediaQuery = require('./util/mysql').wemediaQuery
const main = require('./src/export')

main()
