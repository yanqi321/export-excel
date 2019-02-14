const fs = require('fs')
const xlsx = require('node-xlsx')
const datetime = require('../util/datetime')

let getArticleData = async (uid) => {
  let sql = 'select atype,count(*) as count from article where author_id = ? and status !=4 group by atype'
  try {
    const result = await __wemediaQuery(sql, [uid])
    if (!result) {
      return {
        succ: false,
        mess: 'no data'
      }
    }
    let artCount = 0
    let videoCount = 0
    for (let i = 0; i < result.length; i++) {
      if (result[i].atype === 0) {
        artCount += result[i].count
        continue
      } else if ([6, 8, 9].includes(result[i].atype)) {
        videoCount += result[i].count
      }
    }
    return {
      succ: true,
      data: {
        artCount,
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

let queryData = async () => {
  try {
    let sql = 'select user.uuid,wemedia_name,real_name,lang,phone,email,stage,description,user.add_time,last_post_time,promotion_time,active_day,state,city from user left join user_info on user.uuid=user_info.uuid where status=1 and source=10'
    let result = await __wemediaQuery(sql)
    console.info(result.length)
    if (result) {
      let queryData = [['wemedia_name', 'real_name', 'lang', 'phone', 'email', 'stage', 'description',
        'register_time', 'last_post_time', 'promotion_time', 'active_day', 'Number of Articles', 'Number of Videos', 'location'
      ]]
      for (let i = 0; i < result.length; i++) {
        let rowData = result[i]
        rowData.add_time = datetime.convertTimezone(rowData.add_time, 8, 5.5)
        rowData.last_post_time = datetime.convertTimezone(rowData.last_post_time, 8, 5.5)
        rowData.promotion_time = datetime.convertTimezone(rowData.promotion_time, 8, 5.5)
        switch (rowData.lang) {
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
          case 10:
            rowData.lang = 'Malayalam'
            break
        }
        // 获取用户发布文章视频数量
        let postData = await getArticleData(rowData.uuid)
        if (!postData.succ) {
          console.log('get article data error')
          return
        }
        rowData.articleCount = postData.data.artCount
        rowData.videoCount = postData.data.videoCount

        rowData.location = rowData.city + '/' + rowData.state
        queryData.push([
          rowData.wemedia_name, rowData.real_name, rowData.lang, rowData.phone, rowData.email, rowData.stage,
          rowData.description, rowData.add_time, rowData.last_post_time, rowData.promotion_time,
          rowData.active_day, rowData.articleCount, rowData.videoCount, rowData.location
        ])
      }
      // const testData = [[1, 2, 3], [true, false, null, 'sheetjs'], ['foo', 'bar', new Date('2014-02-19T14:30Z'), '0.3'], ['baz', null, 'qux']]
      // writeXls(testData)
      writeXls(queryData, 'userData')
    }
    process.exit(0)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

let writeXls = (data, tablename) => {
  const option = {
    '!cols': [{ wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 20 },
      { wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 20 }
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
