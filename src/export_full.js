const fs = require('fs')
const xlsx = require('node-xlsx')
const datetime = require('../util/datetime')

let queryData = async (sTime = '2018-07-01', eTime = '2018-10-12') => {
  try {
    // const currentTimeZone = 0 // utc 时区
    // let startTime = datetime.convertTimezone(new Date(sTime).getTime(), currentTimeZone, '5.5')
    // startTime = new Date(startTime)
    // let endTime = datetime.convertTimezone(new Date(eTime).getTime(), currentTimeZone, '5.5')
    // endTime = new Date(endTime)
    // let values = [startTime, endTime]
    let sql = 'select id, title_english as label from t_category where status = 1 and scope in (1,3)'
    let categoryData = await __wemediaQuery(sql)
    let categoryMap = new Map()
    for (let i = 0; i < categoryData.length; i++) {
      categoryMap.set(categoryData[i].id, categoryData[i].label)
    }
    const query = `select user.uuid,wemedia_name,phone,email,lang,category_id as category,user.add_time,city,state,grade,stage,level,promotion_time as pt,active_day from user inner join user_info on user_info.uuid =user.uuid where user.source = 10 and status=1 and user.add_time>? limit 50,100`
    let result = await __wemediaQuery(query, ['2018-07-01'])
    // const query = `select uuid,wemedia_name,phone,email,user.status,lang,category_id as category,user.add_time from user where uuid in (?)`
    // let result = await __wemediaQuery(query, [endTime])
    __ilogger.info(`count: ${result.length}`)
    if (result) {
      let queryData = [
        ['User ID', 'Wemedia Name', 'Phone', 'Email', 'Location', 'Language', 'Category', 'Grade', 'level', 'Advanced/Primary',
          'Promotion time', 'Registration Time', 'First Post Time', 'Last Post Time', 'Total View', 'Contents Revenues', 'Bonus Revenues', 'Total Revenues', 'Active Days',
          'Articles Posted', 'Articles Passed',
          'Videos Posted', 'Video Passed'
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
        rowData.f_post_time = lpost.data.f_post_time
        rowData.l_post_time = lpost.data.l_post_time

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

        let revenues = await getRevenues(uid)
        if (!revenues.succ) {
          console.log('get Revenues error')
          return
        }
        rowData.TotalRevenues = revenues.data.totalRevenue
        rowData.contentRevenue = revenues.data.contentRevenue
        rowData.bonusRevenue = revenues.data.activityRevenue

        let postData = await getArticleData(uid)
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
          rowData.uuid, rowData.wemedia_name, rowData.phone, rowData.email, rowData.Location, rowData.lang, rowData.category, rowData.grade, rowData.stage, rowData.level,
          datetime.formatDate(rowData.pt), datetime.formatDate(rowData.add_time), datetime.formatDate(rowData.f_post_time), datetime.formatDate(rowData.l_post_time),
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
  let sql = 'select max(add_time) as l_post_time,min(add_time) as f_post_time from article where author_id = ?'
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
      { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 20 },
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
