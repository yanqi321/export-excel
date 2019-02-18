const fs = require('fs')
const xlsx = require('node-xlsx')
const datetime = require('../util/datetime')
const esquery = require('../util/esquery')

let queryData = async () => {
  try {
    let sql = 'select id, title_english as label from t_category where status = 1 and scope in (1,3)'
    let categoryData = await __wemediaQuery(sql)
    let categoryMap = new Map()
    for (let i = 0; i < categoryData.length; i++) {
      categoryMap.set(categoryData[i].id, categoryData[i].label)
    }
    const usql = `select user.uuid,wemedia_name,phone,email,lang,youtube,category_id as category,user.add_time,
    city,state,grade,stage,level,promotion_time as pt,last_post_time,active_day from user inner join user_info on 
    user_info.uuid =user.uuid and youtube is not null and youtube !='' where user.source = 10 and status=1 limit 3`
    let result = await __wemediaQuery(usql)
    __ilogger.info(`count: ${result.length}`)
    if (result) {
      let queryData = [
        ['User ID', 'Wemedia Name', 'Phone', 'Email', 'Location', 'Language', 'Youtube', 'Category', 'Grade', 'level', 'Advanced/Primary',
          'Promotion time', 'Registration Time', 'First Post Time', 'Last Post Time', 'Total View', 'Contents Revenues', 'Bonus Revenues', 'Total Revenues', 'Active Days',
          'Articles Posted', 'Articles Passed',
          'Videos Posted', 'Video Passed'
        ]
      ]
      for (let i = 0; i < result.length; i++) {
        let rowData = result[i]
        let uid = rowData.uuid
        console.time('getLastpost')
        let lpost = await getLastpost(uid)
        console.timeEnd('getLastpost')
        if (!lpost.succ) {
          console.log('get last Post error')
          return
        }
        rowData.f_post_time = lpost.data.f_post_time
        console.time('getRecView')
        let tview = await getRecView(uid)
        console.timeEnd('getRecView')
        if (!tview.succ) {
          console.log('get total view error')
          return
        }
        rowData.totalVc = tview.data.totalView
        rowData.articleVc = tview.data.articleVc
        rowData.articleRc = tview.data.articleRc
        rowData.videoVc = tview.data.videoVc
        rowData.videoRc = tview.data.videoRc
        console.time('getRevenues')
        let revenues = await getRevenues(uid)
        console.timeEnd('getRevenues')
        if (!revenues.succ) {
          console.log('get Revenues error')
          return
        }
        rowData.TotalRevenues = revenues.data.totalRevenue
        rowData.contentRevenue = revenues.data.contentRevenue
        rowData.bonusRevenue = revenues.data.activityRevenue
        console.time('getArticleData')
        let postData = await getArticleData(uid)
        console.timeEnd('getArticleData')
        if (!postData.succ) {
          console.log('get article data error')
          return
        }
        rowData.Location = rowData.city + '/' + rowData.state

        rowData.articlePost = postData.data.artCount
        rowData.articlePassed = postData.data.approveArt
        rowData.videoCount = postData.data.videoCount
        rowData.videoPassed = postData.data.approveVideo

        let lang = Number(rowData.lang)
        switch (lang) {
          case 0:
            rowData.lang = 'English'
            break
          case 1:
            rowData.lang = 'Hindi'
            break
          case 2:
            rowData.lang = 'Marathi'
            break
          case 3:
            rowData.lang = 'Tamil'
            break
          case 4:
            rowData.lang = 'Bengali'
            break
          case 5:
            rowData.lang = 'Telugu'
            break
          case 6:
            rowData.lang = 'Kannada'
            break
          case 7:
            rowData.lang = 'Gujarati'
            break
          case 8:
            rowData.lang = 'Punjabi'
            break
        }
        let stage = rowData.stage
        switch (stage) {
          case 0:
            rowData.stage = 'Primary'
            break
          case 1:
            rowData.stage = 'Advanced'
            break
        }

        let level = rowData.level
        switch (level) {
          case 1:
            rowData.level = 'Silver'
            break
          case 2:
            rowData.level = 'Gold'
            break
          case 3:
            rowData.level = 'Platinum'
            break
          case 4:
            rowData.level = 'Royal'
            break
          case 0:
            rowData.level = 'No Level'
            break
        }
        rowData.category = categoryMap.get(rowData.category)
        __ilogger.info(i)
        queryData.push([
          rowData.uuid, rowData.wemedia_name, rowData.phone, rowData.email, rowData.Location, rowData.lang, rowData.youtube, rowData.category, rowData.grade, rowData.stage, rowData.level,
          datetime.formatDate(rowData.pt), datetime.formatDate(rowData.add_time), datetime.formatDate(rowData.f_post_time), datetime.formatDate(rowData.last_post_time),
          rowData.totalVc, rowData.contentRevenue, rowData.bonusRevenue, rowData.TotalRevenues, rowData.active_day,
          rowData.articlePost, rowData.articlePassed,
          rowData.videoCount, rowData.videoPassed
        ])
        if (i % 10 === 0) { // 每 10 条 停 2秒钟
          __ilogger.info(`index: ${i}`)
          await new Promise(
            (resolve) => {
              setTimeout(() => {
                resolve('over')
              }, 1000)
            })
        }
      }
      writeXls(queryData, 'userData')
    }
    process.exit(0)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}
let getLastpost = async (uid) => {
  let sql = 'select min(add_time) as f_post_time from article where author_id = ?'
  try {
    const result = await __wemediaQuery(sql, [uid])
    if (result.length !== 1) {
      return {
        succ: false,
        mess: 'no data'
      }
    }
    return {
      succ: true,
      data: result[0]
    }
  } catch (error) {
    __ilogger.error(`get post err${error.message}`)
    return {
      succ: false,
      mess: error.message
    }
  }
}
let getRecView = async (uid) => {
  try {
    let articleVc = 0
    let articleRc = 0
    let videoVc = 0
    let videoRc = 0
    let totalView = 0
    let libJsonTemplate = {
      'query': {
        'bool': {
          'must': [
            { 'terms': { 'author_id': [uid] } }
          ]
        }
      },
      'size': 0,
      'aggs': {
        'agg_atype': {
          'terms': {
            'field': 'atype'
          },
          'aggregations': {
            'view_count_sum': {
              'sum': {
                'field': 'view_count'
              }
            },
            'rec_count_sum': {
              'sum': {
                'field': 'rec_count'
              }
            }
          }
        }
      }
    }

    let result = await esquery.logResult(libJsonTemplate)
    if (!result.length) return { data: [], succ: false, code: 404 }
    for (let i = 0; i < result.length; i++) {
      totalView += result[i].view_count_sum.value
      if (result[i].key === 0) {
        articleVc += result[i].view_count_sum.value
        articleRc += result[i].rec_count_sum.value
        continue
      }
      if ([6, 8, 9].includes(result[i].key)) {
        videoVc += result[i].view_count_sum.value
        videoRc += result[i].rec_count_sum.value
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
let getRevenues = async (uid) => {
  let sql = 'select sum(amount) as sum,sys_type from trans_record where trans_type = 1 and status = 1 and sys_type in (1,2) and uid = ? group by sys_type order by sys_type asc'
  try {
    const result = await __wemediaQuery(sql, [uid])
    let activityRevenue = 0
    let contentRevenue = 0
    for (let i = 0; i < result.length; i++) {
      if (result[i].sys_type === 1) {
        activityRevenue = result[i].sum
      } else if (result[i].sys_type === 2) {
        contentRevenue = result[i].sum
      }
    }
    let totalRevenue = activityRevenue + contentRevenue
    return {
      succ: true,
      data: {
        activityRevenue: (activityRevenue / 100).toFixed(2),
        contentRevenue: (contentRevenue / 100).toFixed(2),
        totalRevenue: (totalRevenue / 100).toFixed(2)
      }
    }
  } catch (error) {
    __ilogger.error(`getTotalRevenueserr${error.message}`)
    return {
      succ: false,
      mess: error.message
    }
  }
}

let getArticleData = async (uid) => {
  let sql = 'select atype,status,count(*) as count from article where author_id = ? group by atype,status'
  try {
    const result = await __wemediaQuery(sql, [uid])
    if (!result) {
      return {
        succ: false,
        mess: 'no data'
      }
    }
    let approveArt = 0
    let artCount = 0
    let approveVideo = 0
    let videoCount = 0
    for (let i = 0; i < result.length; i++) {
      if (result[i].atype === 0) {
        artCount += result[i].count
        if (result[i].status === 2) {
          approveArt += result[i].count
        }
        continue
      }
      if ([6, 8, 9].includes(result[i].atype)) {
        videoCount += result[i].count
        if (result[i].status === 2) {
          approveVideo += result[i].count
        }
      }
    }
    return {
      succ: true,
      data: {
        approveArt,
        artCount,
        approveVideo,
        videoCount
      }
    }
  } catch (error) {
    return {
      succ: false,
      mess: error.message
    }
  }
}

let writeXls = (data, tablename) => {
  const option = {
    '!cols': [
      { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 10 }, { wch: 20 }, { wch: 10 }, { wch: 20 }, { wch: 20 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
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
