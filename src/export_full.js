const fs = require('fs')
const xlsx = require('node-xlsx')
const datetime = require('../util/datetime')

let queryData = async (sTime = '2018-07-01', eTime = '2018-09-12') => {
  try {
    const currentTimeZone = 0 // utc 时区
    // let startTime = datetime.convertTimezone(new Date(sTime).getTime(), currentTimeZone, '5.5')
    // startTime = new Date(startTime)
    let endTime = datetime.convertTimezone(new Date(eTime).getTime(), currentTimeZone, '5.5')
    endTime = new Date(endTime)
    // let values = [startTime, endTime]
    const query = `select uuid,wemedia_name,phone,email,user.status,lang,category_id as category,user.add_time from user where user.source = 10 and add_time < ?`
    let result = await __wemediaQuery(query, [endTime])
    __ilogger.info(`count: ${result.length}`)
    if (result) {
      let queryData = [
        ['Wemedia Name', 'Phone', 'Email', 'Language', 'Category', 'Status', 'Grade', 'Advanced/Primary',
          'Promotion time', 'Registration Time', 'Last Post Time', 'Total View', 'Total Revenues', 'Active Days',
          'Articles Posted', 'Articles Passed', 'Articles Rec', 'Article View',
          'Videos Posted', 'Video Passed', 'Video Rec', 'Video View'
        ]
      ]
      for (let i = 0; i < result.length; i++) {
        let rowData = result[i]
        let uid = rowData.uuid
        let lpost = await getLastpost(uid)
        if (!lpost.succ) {
          console.log('get last Post error')
          return
        }
        rowData.post_time = lpost.data

        let lgrade = await lastGrade(uid)
        if (!lgrade.succ) {
          console.log('get last grade error')
          return
        }
        rowData.grade = lgrade.data.grade
        rowData.stage = lgrade.data.stage

        let pt = await Promotion(uid)
        if (!pt.succ) {
          console.log('get promotion time error')
          return
        }
        rowData.pt = pt.data

        let tview = await getRV(uid)
        if (!tview.succ) {
          console.log('get total view error')
          return
        }
        rowData.totalVc = tview.data.totalView
        rowData.articleVc = tview.data.articleVc
        rowData.articleRc = tview.data.articleRc
        rowData.videoVc = tview.data.videoVc
        rowData.videoRc = tview.data.videoRc

        let revenues = await getTotalRevenues(uid)
        if (!revenues.succ) {
          console.log('get Revenues error')
          return
        }
        rowData.TotalRevenues = revenues.data

        let actDay = await getTotalAct(uid)
        if (!actDay.succ) {
          console.log('get act day error')
          return
        }
        rowData.activeDay = actDay.data

        let postData = await getArticleData(uid)
        if (!postData.succ) {
          console.log('get article data error')
          return
        }
        rowData.articlePost = postData.data.artCount
        rowData.articlePassed = postData.data.approveArt
        rowData.videoCount = postData.data.videoCount
        rowData.videoPassed = postData.data.approveVideo
        queryData.push([
          rowData.wemedia_name, rowData.phone, rowData.email, rowData.lang, rowData.category, rowData.grade, rowData.stage,
          datetime.formatDate(rowData.pt), datetime.formatDate(rowData.add_time), datetime.formatDate(rowData.post_time),
          rowData.totalVc, rowData.TotalRevenues, rowData.activeDay,
          rowData.articlePost, rowData.articlePassed, rowData.articleVc, rowData.articleRc,
          rowData.videoCount, rowData.videoPassed, rowData.videoVc, rowData.videoRc
        ])
        if (i % 10 === 0) { // 每 10 条 停 2秒钟
          __ilogger.info(`index: ${i}`)
          await new Promise(
            (resolve) => {
              setTimeout(() => {
                resolve('over')
              }, 2000)
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
let lastGrade = async (uid) => {
  let sql = 'select grade,stage from grade where id = (select max(id) id from grade where author_id = ?)'
  try {
    const result = await __wemediaQuery(sql, [uid])
    if (result.length !== 1) {
      return {
        succ: true,
        data: {
          grade: 0,
          stage: 0
        }
      }
    }
    return {
      succ: true,
      data: {
        grade: result[0].grade,
        stage: result[0].stage
      }
    }
  } catch (error) {
    __ilogger.error(`get post err${error.message}`)
    return {
      succ: false,
      mess: error.message
    }
  }
}
let Promotion = async (uid) => {
  let sql = 'select min(add_time) pt from grade where stage = 1 and level = 1 and author_id = ?'
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
      data: result[0].pt
    }
  } catch (error) {
    __ilogger.error(`get post err${error.message}`)
    return {
      succ: false,
      mess: error.message
    }
  }
}
let getLastpost = async (uid) => {
  let sql = 'select max(add_time) as post_time from article where author_id = ?'
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
      data: result[0].post_time
    }
  } catch (error) {
    __ilogger.error(`get post err${error.message}`)
    return {
      succ: false,
      mess: error.message
    }
  }
}
let getRV = async (uid) => {
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
      if (result[i].atype === 9) {
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
let getTotalRevenues = async (uid) => {
  let sql = 'select sum(amount) as sum from trans_record where trans_type in (1,2) and uid = ?'
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
      data: (result[0].sum / 100).toFixed(2)
    }
  } catch (error) {
    __ilogger.error(`getTotalRevenueserr${error.message}`)
    return {
      succ: false,
      mess: error.message
    }
  }
}

let getTotalAct = async (uid) => {
  let sql = `select DATE_FORMAT(add_time, "%Y-%m-%d") as date, count(*) as count from article where author_id = ? and status = 2 and atype = 0 group by date`
  try {
    const result = await __wemediaQuery(sql, [uid])
    if (!result) {
      return {
        succ: false,
        mess: 'no data'
      }
    }
    return {
      succ: true,
      data: result.length
    }
  } catch (error) {
    __ilogger.info(`getTotalAct${error.message}`)
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
      if (result[i].atype === 9) {
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
      { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 20 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
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
