
var fs = require('fs')
var xlsx = require('node-xlsx')

var datas = []
var data = [1, 2, 3]
var data1 = [4, 5, 6]
datas.push(data) // 一行一行添加的 不是一列一列
datas.push(data1)
writeXls(datas)
function writeXls (datas) {
  var buffer = xlsx.build([
    {
      name: 'sheet1',
      data: datas
    }
  ])
  fs.writeFileSync('test1.xlsx', buffer, { 'flag': 'w' }) // 生成excel
}
