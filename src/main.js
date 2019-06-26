const fs = require('fs')
const xlsx = require('node-xlsx')
const datetime = require('../util/datetime')
const es = require('../util/es')

let queryData = async (sTime = '2019-04-01', eTime = '2019-05-01') => {
  try {
    let sql = `SELECT oc.uuid,lang from operation_record_cms oc inner join topic on topic.uuid=oc.uuid where op_type=2 and op_time>=? and op_time<? and newValue!=0`
    let startTime = datetime.convertTimezone(new Date(sTime), 5.5, 0)
    let endTime = datetime.convertTimezone(new Date(eTime), 5.5, 0)
    let values = [startTime, endTime]
    let result = await __localQuery(sql, values)
    console.info(result.length)
    if (result) {
      // 获取 view 数据
      let langArr = {}
      for (let i = 0; i < result.length; i++) {
        let item = result[i]
        if (langArr[item.lang]) {
          langArr[item.lang].push(item.uuid)
        } else {
          langArr[item.lang] = [item.uuid]
        }
      }

      let tableData = ['Date', 'lang', 'count', 'view']
      for (let key in langArr) {
        let uuids = langArr[key]
        let view = await esQuery(uuids, [startTime.getTime(), endTime.getTime() + 24 * 60 * 60 * 1000])
        let lang = Number(key)
        if (lang === 0) {
          lang = 'English'
        } else if (lang === 1) {
          lang = 'Hindi'
        } else if (lang === 2) {
          lang = 'Marathi'
        } else if (lang === 3) {
          lang = 'Tamil'
        } else if (lang === 4) {
          lang = 'Bengali'
        } else if (lang === 5) {
          lang = 'Telugu'
        } else if (lang === 6) {
          lang = 'Kannada'
        } else if (lang === 7) {
          lang = 'Gujarati'
        } else if (lang === 8) {
          lang = 'Punjabi'
        } else if (lang === 10) {
          lang = 'Malayalam'
        }
        tableData.push([sTime, lang, uuids.length, view])
      }
      writeXls(tableData, sTime)
    }
    process.exit(0)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

const esQuery = async (uuids, timeRange) => {
  try {
    let queryBody = {
      'query': {
        'bool': {
          'filter': [{
            'terms': {
              'ul_targetId': uuids
            }
          },
          {
            'term': {
              'ul_strategyId': 606
            }
          },
          {
            'term': {
              'ul_actType': 1000
            }
          },
          {
            'range': {
              'ul_addTime': {
                'lt': timeRange[1],
                'gte': timeRange[0]
              }
            }
          }
          ]
        }
      },
      'size': 0
    }
    var result = await es.search(queryBody)
    console.log(queryBody, result.hits)
    return result.hits.total
  } catch (error) {
    console.log(error.message)
  }
}
let writeXls = (data, tablename) => {
  const option = {
    '!cols': [{ wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 15 }]
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
// esQuery(['e702347358c10e741e2ea0eb6a2cc9b0', '67b905f7b50ef887999be79280f9f710', '05d98973616589a14814ee7d7752f504', 'b0974ebdc5a47ae8bd600e40ac5a22b6'], [new Date('2019-04-01').getTime(), new Date('2019-07-01').getTime()])
module.exports = queryData
