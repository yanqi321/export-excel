const program = require('commander')
// global.__localConnPool = require('./util/mysql').localConnPool
// global.__remoteConnPool = require('./util/mysql').remoteConnPool
global.__wemediaConnPool = require('./util/mysql').wemediaConnPool
// global.__localQuery = require('./util/mysql').localQuery
// global.__remoteQuery = require('./util/mysql').remoteQuery
global.__wemediaQuery = require('./util/mysql').wemediaQuery
const main = require('./src/export')

let startTime, endTime

program
  .version('1.0.0')
  .usage('[options] argument')
  .option('-s, --start [startTime]', 'filter start date')
  .option('-e, --end [endTime]', 'filter start date')
  .parse(process.argv)

if (!program.start) {
  console.log('Please input startTime')
} else if (!program.end) {
  console.log('Please input endTime')
}
startTime = program.start
endTime = program.end
main(startTime, endTime)
