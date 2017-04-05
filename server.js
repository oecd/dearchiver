'use strict';
const bodyParser = require('body-parser')
require('dotenv').config({path: './_env'})
const express = require('express')
const IpDeniedError = require('express-ipfilter').IpDeniedError;
const ipfilter = require('express-ipfilter').IpFilter;
const path = require('path')
const request = require('request')

const url = `https://${process.env.AZURE_STORAGEACCOUNT}.blob.core.windows.net/${process.env.AZURE_CONTAINERNAME}/`
const port = process.env.PORT || 3000

const app = express()
app.set('view engine', 'pug')
app.use(express.static(path.join(__dirname, 'node_modules/bootstrap/dist')))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(ipfilter(['::1', '127.0.0.1', process.env.IP_WHITELIST], {
  log: true,
  logLevel: 'all',
  mode: 'allow',
  allowedHeaders: ['x-forwarded-for']
}));

app.get('/', function (req, res) {
  res.render('index', {
    title: 'PAC Dearchiver',
    inputFileName: 'blobFile'
  })
})

app.post('/', function (req, res) {
  const fileName = req.body.blobFile + '.7z'
  const fileUrl = url + fileName
  const resObject = {
      url: fileUrl,
      fileName: fileName,
      code: `${req.body.blobFile}`
    }

  console.log(`DIS MOI : ${JSON.stringify(req.body)}`)

  try {
    if (req.body.blobFile === undefined || req.body.blobFile === '') {
      resObject.message = 'emptyCode'
      res.render('index', resObject)
    } else {
      // test existence of file
      request.head(fileUrl, function (err, response) {
        if (err) return console.log(err)
        if (response.statusCode !== 200) {
          console.log(`!!! Unknown code ${req.body.blobFile}.`)
          resObject.message = 'notFound'
        } else {
          resObject.message = 'success'
        }
        console.log(resObject)
        res.render('index', resObject)
      })
    }
  } catch (e) {
    console.log(e)
  }
})

app.use(function(err, req, res, _next) {
  const getIp = '78.41.128.14:47172'
  //const getIp = req.header('x-forwarded-for')
  const resError = {
    title: 'Access denied',
    error: err
    }

  try {
    if(err instanceof IpDeniedError){
      res.status(401)
    }else{
      res.status(err.status || 500)
    }

    if (getIp !== undefined) {
      const splitIp = getIp.split(':' ,1)
      console.log('splitted ip = ' + splitIp)
      resError.showClientIP = splitIp || req.connection.remoteAddress
    }else{
      console.log('ip = ' + splitIp)
      resError.showClientIP = getIp || req.connection.remoteAddress
    }
    res.render('error', resError)
  } catch (e) {
    console.log(e)
  } finally {
    _next()
  }
})

app.listen(port, function () {
  console.log(`Dearchiver is now listening on port ${port}!`)
})
