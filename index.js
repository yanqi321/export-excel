/*
说明：join wemedia 数据导出
*/
const program = require('commander')
global.__remoteConnPool = require('./util/mysql').remoteConnPool
global.__remoteQuery = require('./util/mysql').remoteQuery
const main = require('./src/main')

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
