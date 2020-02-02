'use strict'
const fs = require('fs')
const path = require('path')
const bodyParser = require('body-parser')
require('dotenv').config({path: './_env'})
const express = require('express')
const ipfilter = require('express-ipfilter').IpFilter
const IpDeniedError = require('express-ipfilter').IpDeniedError
const request = require('request')
const { checkCode, getInfoFromCode } = require('./utils')
const {download, blobExists} = require('./azure-download')

const port = process.env.PORT || 3000

const jsonObj = require("./package.json")
const appVersion = (jsonObj.version)

// whitelist the IP addresses from us and monitoring locations

let whitelistedIPs = ['::1', '127.0.0.1', process.env.IP_WHITELIST].concat(
  fs.readFileSync(path.join(__dirname, process.env.IP_WHITELIST_FILE))
    .toString()
    .split('\r')
    .filter((line) => { return line.trim() != '' })
    .map((line) => { return line.trim() })
)

if (process.env.NODE_DEBUG) {
  console.log(`whitelisted IPs: ${JSON.stringify(whitelistedIPs)}`)
}

const app = express()
app.set('view engine', 'pug')
app.use(express.static(path.join(__dirname, 'node_modules/bootstrap/dist')))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(ipfilter(whitelistedIPs, {
  log: true,
  logLevel: 'all',
  mode: 'allow',
  allowedHeaders: ['x-forwarded-for'],
  detectIp: getAzureIp
}));

// we need to use our own detection algorithm as Azure adds a port
// number to the IP address, and the used ip detection module 'ip'
// gets confused when it receives an ipv4 address with a port.
function getAzureIp(req) {
  const ipAddress = req.headers['x-forwarded-for']
    ? req.headers['x-forwarded-for'].split(',')[0]
    : req.connection.remoteAddress

  if (!ipAddress) return ''

  // do some naive IP address matching, just to exclude IPv6 addresses
  if (ipAddress.match(/(\d+)\.(\d+)\.(\d+)\.(\d+):(\d+)/))
    return ipAddress.split(':')[0]

  return ipAddress
}

// error handling comes after all other app.use instructions
// we will end up inside here whenever there is an error encountered
// while handling the request.  in our case we're particularly interested
// in the IpDeniedError that is being thrown by the ipfilter module
app.use(function (err, req, res, next) {
  // http://expressjs.com/en/guide/error-handling.html
  if (res.headersSent) return next(err)

  if (err instanceof IpDeniedError) {
    const rejectIp = req.ip || req.header('x-forwarded-for')
    res.status(403).render('error', {
      title: 'Access denied',
      showRejectedIp: req.ip || req.header('x-forwarded-for')
    })
  } else {
    next(err)
  }
})

app.get('/', function (req, res) {
  res.render('index', {
    title: 'PAC Dearchiver',
    inputFileName: 'blobFile',
    appVersion: appVersion
  })
})

app.get('/download/:container/:blob', function(req, res) {
  const blobName = req.params.blob
  const containerName = req.params.container
  res.set({
    'Content-type': 'application/octet-stream',
    'Content-disposition': `attachment; filename=${blobName}`,
    'Content-Transfer-Encoding': 'binary'
  })
  download(containerName, blobName, res)
})

app.post('/', function (req, res) {
  // defining the url depending on the choice pod or prepress
  // if pod, azure container is archives-pod
  // if prepress, azure container is archives-prepress-0000

  let a, blobName, containerName, dirCode, yearCode, abbrYearCode, familyCode, languageCode
  if (req.body.containerType === 'prepress') {
    if (checkCode(req.body.blobFile)) {
      const o = getInfoFromCode(req.body.blobFile)
      if (o) {
        dirCode = o.dirCode
        yearCode = o.yearCode
        familyCode = o.familyCode
        languageCode = o.langCode
        abbrYearCode = yearCode.substring(2)
        console.log(`dircode: ${dirCode} - yearcode: ${yearCode} - familycode: ${familyCode} - languagecode: ${languageCode} - abb: ${abbrYearCode}`);
        containerName = `${process.env.AZURE_CONTAINERNAME_PREFIX}${req.body.containerType}-${yearCode}`
        blobName = `${dirCode}${abbrYearCode}${familyCode}-${languageCode}.7z`
      } else {
        // no object returned, problem with code ...
      }
    } else {
      // code doesn't match ...
    }
  }

  const fileUrl = url + fileName
  const resObject = {
    url: fileUrl,
    fileName: fileName,
    code: `${req.body.blobFile}`,
    appVersion: appVersion
  }

  try {
    if (req.body.blobFile === undefined || req.body.blobFile === '') {
      resObject.message = 'emptyCode'
      res.render('index', resObject)
    } else {
      // test existence of file
      if (blobExists(containerName, blobName)) {
        resObject.message = 'success'
      } else {
        resObject.message = 'notFound'
      }
      res.render('index', resObject)
    }
  } catch (e) {
    console.log(e)
  }
})

app.listen(port, function () {
  console.log(`Dearchiver is now listening on port ${port}!`)
})
