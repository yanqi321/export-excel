const program = require('commander')
const main = require('./main')

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
