'use strict'
const fs = require('fs')
const path = require('path')
const bodyParser = require('body-parser')
require('dotenv').config({path: './_env'})
const express = require('express')
const ipfilter = require('express-ipfilter').IpFilter
const IpDeniedError = require('express-ipfilter').IpDeniedError
const request = require('request')
const { checkCode, getInfoFromCode, formatCode, getAzureIp } = require('./utils')
const {downloadBlob, blobExists} = require('./azure-download')

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
  const containerName = req.params.container
  const blobName = req.params.blob
  console.log(`Attempting to download ${containerName}/${blobName} ...`)
  try {
    res.set({
      'Content-type': 'application/octet-stream',
      'Content-disposition': `attachment; filename=${blobName}`,
      'Content-Transfer-Encoding': 'binary'
    })
    // pipe output directly into the response object
    downloadBlob(containerName, blobName, res)
  } catch(e) {
    console.log(e)
  }
})

app.post('/', async (req, res) => {
  // defining the url depending on the choice pod or prepress
  // if pod, azure container is archives-pod
  // if prepress, azure container is archives-prepress-0000
  const containerType = req.body.containerType
  const blobFile = req.body.blobFile

  let blobName, containerName
  const o = getInfoFromCode(blobFile)
  if (!checkCode(blobFile) || !o) {
    res.render('index', { container: null, blob: null, code: blobFile, appVersion, message: 'notFound' })
    return
  }

  if (containerType === 'prepress') {
    containerName = `${process.env.AZURE_CONTAINERNAME_PREFIX}${containerType}-${o.yearCode}`
    blobName = formatCode(blobFile)
  } else if (containerType === 'pod') {
    containerName = `${process.env.AZURE_CONTAINERNAME_PREFIX}${containerType}`
    blobName = `${blobFile}.7z`
  } else {
    // undefined containerType - this should never happen
    console.log(`Unknown or new container type: ${containerType}`)
  }

  const resObject = {
    container: containerName,
    blob: blobName,
    code: blobFile,
    appVersion: appVersion
  }

  try {
    if ((await blobExists(containerName, blobName))) {
      resObject.message = 'success'
    } else {
      resObject.message = 'notFound'
    }
    res.render('index', resObject)
  } catch (e) {
    if (!e) {
      console.log('got an exception thrown ...' + e)
      resObject.message = 'notFound'
      res.render('index', resObject)
    } else {
      console.log(e)
    }
  }
})

app.listen(port, function () {
  console.log(`Dearchiver is now listening on port ${port}!`)
})
