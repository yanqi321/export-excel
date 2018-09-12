const fs = require('fs')
const xlsx = require('node-xlsx')
const datetime = require('../util/datetime')

let queryData = async (sTime = '2018-09-01', eTime = '2018-09-30') => {
  try {
    /* const currentTimeZone = 0 // utc 时区
    let startTime = datetime.convertTimezone(new Date(sTime).getTime(), currentTimeZone, '5.5')
    startTime = new Date(startTime)
    let endTime = datetime.convertTimezone(new Date(eTime).getTime(), currentTimeZone, '5.5')
    endTime = new Date(endTime)
    let values = [startTime, endTime] */
    const query = `select uuid,wemedia_name,phone,email,lang,user.add_time,at as promot_time from (select min(update_time) at,author_id from grade where stage = 1 
    group by author_id) gd left join user on user.uuid = gd.author_id where gd.at> '2018-09-01 02:30:00' and user.source =10`
    // const query = `select uuid,wemedia_name,phone,email,user.add_time  from user where user.source = 10`
    let result = await __wemediaQuery(query)
    __ilogger.info(`count: ${result.length}`)
    if (result) {
      let queryData = [
        ['Wemedia Name', 'Phone', 'Email', 'Language', 'Registration Time', 'Last Post Time',
          'Stage', 'level', 'Promotion Time',
          'Articles Posted', 'Articles Passed', 'Videos Posted', 'Video Passed',
          'Total Viewa', 'Total Revenues', 'Active Days'
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

        let ltstage = await lastStage(uid)
        if (!ltstage.succ) {
          console.log('get last grade error')
          return
        }
        rowData.stage = ltstage.data.stage
        rowData.level = ltstage.data.level

        let tview = await getTotalView(uid)
        if (!tview.succ) {
          console.log('get total view error')
          return
        }
        rowData.view_c_t = tview.data

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
          rowData.wemedia_name, rowData.phone, rowData.email, rowData.lang, datetime.formatDate(rowData.add_time),
          datetime.formatDate(rowData.post_time),
          rowData.stage, rowData.level, datetime.formatDate(rowData.promot_time),
          rowData.articlePost, rowData.articlePassed, rowData.videoCount, rowData.videoPassed,
          rowData.view_c_t, rowData.TotalRevenues, rowData.activeDay
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
let lastStage = async (uid) => {
  let sql = 'select stage,level from grade where id = (select max(id) id from grade where author_id = ?)'
  try {
    const result = await __wemediaQuery(sql, [uid])
    if (result.length !== 1) {
      return {
        succ: true,
        data: {
          stage: 0,
          level: 0
        }
      }
    }
    return {
      succ: true,
      data: {
        stage: result[0].stage,
        level: result[0].level
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
let getTotalView = async (uid) => {
  let sql = 'select sum(view_count_real) view_c_t from log_article where author_id = ?' // FIXME
  try {
    const result = await __logQuery(sql, [uid])
    if (result.length !== 1) {
      return {
        succ: false,
        mess: 'no data'
      }
    }
    return {
      succ: true,
      data: result[0].view_c_t
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
  let sql = `select DATE_FORMAT(add_time, "%Y-%m-%d") as date, count(*) as count from article where author_id = ? group by date`
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
    __ilogger.error(`getTotalAct${error.message}`)
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
      { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
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
