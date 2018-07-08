const fs = require('fs')
const xlsx = require('node-xlsx')
const datetime = require('./util/datetime')
// global.__localConnPool = require('./util/mysql').localConnPool
global.__remoteConnPool = require('./util/mysql').remoteConnPool
// global.__localQuery = require('./util/mysql').localQuery
global.__remoteQuery = require('./util/mysql').remoteQuery

let queryData = async (sTime, eTime) => {
  try {
    const query = ['name', 'email', 'whatsapp', 'facebook', 'instagram', 'appname', 'add_time']
    let sql = 'select ?? from user_apply where add_time>= ? and add_time< ?'
    const currentTimeZone = datetime.getTimezone()
    let startTime = datetime.convertTimezone(new Date(sTime).getTime(), currentTimeZone, '5.5')
    startTime = Math.floor(startTime / 1000)
    let endTime = datetime.convertTimezone(new Date(eTime).getTime(), currentTimeZone, '5.5')
    endTime = Math.floor(endTime / 1000)
    let values = [query, startTime, endTime]
    let result = await __remoteQuery(sql, values)
    if (result) {
      const emailCheck = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/
      let correctData = [query]
      let illegalData = [query]
      for (let i = 0; i < result.length; i++) {
        let rowData = result[i]
        let addTime = datetime.formatDate(rowData.add_time * 1000)
        if (emailCheck.test(rowData.email) && rowData.whatsapp.length === 10 && ['RozBuzz', 'RozBuzzMain', 'RozBuzzPro'].includes(rowData.appname)) {
          correctData.push([rowData.name, rowData.email, rowData.whatsapp, rowData.facebook, rowData.instagram, rowData.appname, addTime])
        } else {
          illegalData.push([rowData.name, rowData.email, rowData.whatsapp, rowData.facebook, rowData.instagram, rowData.appname, addTime])
        }
      }
      // const testData = [[1, 2, 3], [true, false, null, 'sheetjs'], ['foo', 'bar', new Date('2014-02-19T14:30Z'), '0.3'], ['baz', null, 'qux']]
      // writeXls(testData)
      writeXls(correctData, 'correctData')
      writeXls(illegalData, 'illegalData')
    }
    process.exit(1)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

let writeXls = (data, tablename) => {
  const option = {
    '!cols': [{ wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 20 }]
  }
  try {
    var buffer = xlsx.build([
      {
        name: tablename,
        data: data
      }
    ], option)
    fs.writeFileSync(`${tablename}.xlsx`, buffer, { 'flag': 'w' }) // 生成excel
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}
module.exports = queryData
