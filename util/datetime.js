let fecha = require('fecha')

let datetime = {
  getTimezone: () => {
    let timeZoneOffset = new Date().getTimezoneOffset()
    let timeZone = timeZoneOffset / -60
    return timeZone
  },
  convertTimezone: (utcTime, currentTimezone, targetTimezone) => {
    if (!utcTime) {
      return ''
    }
    const offsetTime = (targetTimezone - currentTimezone) * 60 * 60 * 1000
    // console.log('offsetTime:', offsetTime)
    const result = new Date(utcTime.getTime() + offsetTime)
    // console.log('result:', result)
    return fecha.format(result, 'YYYY-MM-DD HH:mm:ss')
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
