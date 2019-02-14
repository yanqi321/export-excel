const fs = require('fs')
const xlsx = require('node-xlsx')
const datetime = require('../util/datetime')
const esquery = require('../util/esquery')

let queryData = async (sTime = '2017-12-17', eTime = '2018-12-18') => {
  try {
    let result = await getArticle()
    if (result) {
      let queryData = [
        ['User ID', 'Wemedia Name', 'Phone', 'Email', 'Location', 'YouTube', 'Language', 'Category', 'Grade', 'level', 'Advanced/Primary',
          'Promotion time', 'Registration Time', 'First Post Time', 'Last Post Time', 'Total View', 'Contents Revenues', 'Bonus Revenues', 'Total Revenues', 'Active Days',
          'Articles Posted', 'Articles Passed',
          'Videos Posted', 'Video Passed'
        ]
      ]
      for (let i = 0; i < result.length; i++) {
        let rowData = result[i]
        let uid = rowData.uuid
        let tview = await getRV(uid)
        if (!tview.succ) {
          console.log('get total view error')
          return
        }
        rowData.totalVc = tview.data.totalView
        // rowData.articleVc = tview.data.articleVc
        // rowData.articleRc = tview.data.articleRc
        // rowData.videoVc = tview.data.videoVc
        // rowData.videoRc = tview.data.videoRc
        // console.timeEnd('getRV')

        queryData.push([
          rowData.uuid, rowData.wemedia_name, rowData.phone, rowData.email, rowData.Location, rowData.youtube, rowData.lang, rowData.category, rowData.grade, rowData.stage, rowData.level,
          datetime.formatDate(rowData.pt), datetime.formatDate(rowData.add_time), datetime.formatDate(rowData.f_post_time), datetime.formatDate(rowData.l_post_time),
          rowData.totalVc, rowData.contentRevenue, rowData.bonusRevenue, rowData.TotalRevenues, rowData.activeDay,
          rowData.articlePost, rowData.articlePassed,
          rowData.videoCount, rowData.videoPassed
        ])
      }
      writeXls(queryData, 'userData')
    }
    process.exit(0)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

const getArticle = async () => {
  const articleMessTemplate = {
    'query': {
      'bool': {
        'must': [
        ],
        'filter': [
        ],
        'must_not': [
          {
            'term': {
              'status': 4
            }
          },
          {
            'term': {
              'user_source': 11
            }
          }
        ]
      }
    },
    'size': 10000
  }
  articleMessTemplate.query.bool.filter.push({ 'terms': { 'category': 'Gaming' } }) // category
  let articleData = await esquery.artResult(articleMessTemplate)
  return articleData
}

const getRV = async (uid) => {
  let sql = `select sum(view_count_real) vc,sum(rec_count) rc,log_article.atype from log_article  
  where log_article.author_id = ? group by log_article.atype`
  try {
    let articleVc = 0
    let articleRc = 0
    let videoVc = 0
    let videoRc = 0
    let totalView = 0
    const result = await __logQuery(sql, [uid])
    if (result.length < 1) {
      return {
        succ: true,
        data: {
          articleVc, articleRc, videoVc, videoRc, totalView
        }
      }
    }
    for (let i = 0; i < result.length; i++) {
      totalView += result[i].vc
      if (result[i].atype === 0) {
        articleVc += result[i].vc
        articleRc += result[i].rc
        continue
      }
      if ([6, 8, 9].includes(result[i].atype)) {
        videoVc += result[i].vc
        videoRc += result[i].rc
      }
    }
    return {
      succ: true,
      data: {
        articleVc, articleRc, videoVc, videoRc, totalView
      }
    }
  } catch (error) {
    __ilogger.error(`getTotalView err${error.message}`)
    return {
      succ: false,
      mess: error.message
    }
  }
}

let writeXls = (data, tablename) => {
  const option = {
    '!cols': [
      { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
    ]
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
