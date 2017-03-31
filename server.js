//#$.get(url)
'use strict';
const bodyParser = require('body-parser')
require('dotenv').config({path: './_env'})
const express = require('express')
const path = require('path')
const request = require('request')

const url = `https://${process.env.AZURE_STORAGEACCOUNT}.blob.core.windows.net/${process.env.AZURE_CONTAINERNAME}/`
const port = process.env.PORT || 3000

const app = express()
app.set('view engine', 'pug')
app.use(express.static(path.join(__dirname, 'node_modules/bootstrap/dist')))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// require("jsdom").env("", function(err, window) {
// 	if (err) {
// 		console.error(err);
// 		return;
// 	}
//
// 	var $ = require("jquery")(window);
// });

app.get('/', function (req, res) {
  res.render('index', {
    title: 'PAC Dearchiver',
    inputFileName: 'blobFile'
  })
})

app.post('/', function (req, res) {
  const fileName = req.body.blobFile + '.7z'
  const fileUrl = url + fileName
  let messageCode
  let resObject

  console.log(`DIS MOI : ${JSON.stringify(req.body)}`)

  try {
    if (req.body.blobFile === undefined || req.body.blobFile === '') {
      messageCode = 'emptyCode'
    } else {
      // test existence of file
      request.head(fileUrl, function (err, response) {
        if (err) return console.log(err)
        if (response.statusCode !== 200) {
          console.log(`!!! Unknown code ${req.body.blobFile}.`)
          messageCode = 'notFound'
        } else {
          messageCode = 'success'
        }
        resObject = {
          message: messageCode,
          url: fileUrl,
          fileName: fileName,
          code: `${req.body.blobFile}`
        }
        res.render('index', resObject)
      })
    }
  } catch (e) {
    console.log(e)
  }
})

app.listen(port, function () {
  console.log(`Dearchiver is now listening on port ${port}!`)
})
