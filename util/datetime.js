let fecha = require('fecha')

let datetime = {
  getTimezone: () => {
    let timeZoneOffset = new Date().getTimezoneOffset()
    let timeZone = timeZoneOffset / -60
    return timeZone
  },
  convertTimezone: (utcTime, currentTimezone, targetTimezone) => {
    // console.log('utcTime:', utcTime)
    const offsetTime = (currentTimezone - targetTimezone) * 60 * 60 * 1000
    // console.log('offsetTime:', offsetTime)
    const result = utcTime + offsetTime
    // console.log('result:', result)
    return result
  },
  formatDate: (gmtTime) => {
    if (!gmtTime) {
      return ''
    }
    gmtTime = new Date(gmtTime)
    return fecha.format(gmtTime, 'YYYY-MM-DD HH:mm:ss')
  }
}
module.exports = datetime
