const fs = require('fs')
const xlsx = require('node-xlsx')
// const datetime = require('../util/datetime')

let queryData = async (sTime = '2018-07-01', eTime = '2018-08-01') => {
  try {
    const query = `select uuid,wemedia_name,phone,email,user.add_time,p.post_time,art_log.view_c_t 
    from user left join (select author_id,max(add_time) as post_time from article group by author_id) p on p.author_id = user.uuid
    left join (select sum(view_count) view_c_t,author_id from article_log group by author_id) art_log on art_log.author_id = user.uuid
    where user.source = 10 limit 10`
    /*  const currentTimeZone = 0 // utc 时区
     let startTime = datetime.convertTimezone(new Date(sTime).getTime(), currentTimeZone, '5.5')
     startTime = Math.floor(startTime / 1000)
     let endTime = datetime.convertTimezone(new Date(eTime).getTime(), currentTimeZone, '5.5')
     endTime = Math.floor(endTime / 1000) */
    let result = await __wemediaQuery(query)
    console.info(result.length)
    if (result) {
      let queryData = [
        ['Wemedia Name', 'Phone', 'Email', 'Registration Time', 'Last Post Time',
          'Articles Posted', 'Articles Passed', 'Videos Posted', 'Video Passed',
          'Total Viewa', 'Total Revenues', 'Active Days'
        ]
      ]
      for (let i = 0; i < result.length; i++) {
        let rowData = result[i]
        let uid = rowData.uuid
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
          rowData.wemedia_name, rowData.phone, rowData.email, rowData.add_time, rowData.post_time,
          rowData.articlePost, rowData.articlePassed, rowData.videoCount, rowData.videoPassed,
          rowData.view_c_t, rowData.TotalRevenues, rowData.activeDay
        ])
        if (i % 10 === 0) { // 每 10 条 停 3秒钟
          await new Promise(
            (resolve) => {
              setTimeout(() => {
                resolve('over')
              }, 3000)
            })
        }
      }
      writeXls(queryData, 'correctData')
    }
    process.exit(0)
  } catch (err) {
    console.log(err)
    process.exit(1)
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
      data: result[0].sum
    }
  } catch (error) {
    return {
      succ: false,
      mess: error.message
    }
  }
}

let getTotalAct = async (uid) => {
  let sql = `select DATE_FORMAT(add_time, "%Y-%m-%d") as date, count(*) as count from article where author_id = ? 
  and status = 2 and atype = 0  group by date`
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
    return {
      succ: false,
      mess: error.message
    }
  }
}

let getArticleData = async (uid) => {
  let sql = 'select atype,status,count(*) from article where author_id = ? group by atype,status'
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
        artCount++
        if (result[i].status === 2) {
          approveArt++
        }
        continue
      }
      if (result[i].atype === 9) {
        videoCount++
        if (result[i].status === 2) {
          approveVideo++
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
      { wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 },
      { wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 }
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
