const oldOecdCodeRE = new RegExp(/([0-9]{2})([0-9]{4})([0-9]{2})([0-9]{1})/);
const newOecdCodeRE = new RegExp(/([a-z]{3,4})-([0-9]{4})-([0-9]{1,5})-([a-z]{2})/);
let a, dirCode, yearCode, familyCode, langCode;

const checkCode = (code) => {
    return isOldCode(code) || isNewCode(code);
}

const getInfoFromCode = (code) => {
    if (isOldCode(code)) {
        [a, dirCode, yearCode, familyCode, langCode] = oldOecdCodeRE.exec(code)
        return { dirCode, yearCode, familyCode, langCode };
    } else if (isNewCode(code)) {
        [a, dirCode, yearCode, familyCode, langCode] = newOecdCodeRE.exec(code)
        return { dirCode, yearCode, familyCode, langCode };
    }
}
const formatCode = (code) => {
    const i = getInfoFromCode(code)
    if (isNewCode(code)) {
        return `${i.dirCode}-${i.yearCode}-${i.familyCode}-${i.langCode}.7z`
    } else if (isOldCode(code)) {
        return `${i.dirCode}${i.yearCode.substring(2, 4)}${i.familyCode}-${i.langCode}.7z`
    } else {
        console.log(`should never get here ... but: ${code}`)
    }
}

const isOldCode = (code) => oldOecdCodeRE.test(code)
const isNewCode = (code) => newOecdCodeRE.test(code)

// we need to use our own detection algorithm as Azure adds a port
// number to the IP address, and the used ip detection module 'ip'
// gets confused when it receives an ipv4 address with a port.
const getAzureIp = (req) => {
    const ipAddress = req.headers['x-forwarded-for']
      ? req.headers['x-forwarded-for'].split(',')[0]
      : req.connection.remoteAddress
  
    if (!ipAddress) return ''
  
    // do some naive IP address matching, just to exclude IPv6 addresses
    if (ipAddress.match(/(\d+)\.(\d+)\.(\d+)\.(\d+):(\d+)/)) {
      return ipAddress.split(':')[0]
    }
    return ipAddress
}
  
module.exports = { checkCode, getInfoFromCode, isNewCode, isOldCode, formatCode, getAzureIp }
