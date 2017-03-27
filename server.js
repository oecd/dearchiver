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

app.get('/', function (req, res) {
  res.render('index', {
    title: 'PAC Archives',
    message: 'Enter your code',
    inputFileName: 'blobFile'
  })
})

app.post('/code', function (req, res) {
  const fileName = req.body.blobFile + '.7z'
  const requestSettings = {
    method: 'GET',
    url: url + fileName,
    encoding: null
  }
  try {
    request(requestSettings, function (err, response) {
      if (err) return console.log(err)
      if (response.statusCode !== 200) {
        console.log(`!!! Unknown code ${req.body.blobFile}.`)
        res.send(
          '<div>The code ' + req.body.blobFile + ' does not exist</div>' +
          '<input type="button" value="Back" onclick="window.history.back()"/>'
        )
        return
      }
      res.setHeader('Content-disposition', 'attachment; filename=' + fileName)
      res.send(response.body)
      res.end()
    })
  } catch (e) {
    res.send('File does not exist').end()
  }
})

app.listen(port, function () {
  console.log(`Dearchiver is now listening on port ${port}!`)
})
