require('dotenv').config({path: './_env'});
var bodyParser = require('body-parser');
var express = require('express')
var fs = require('fs');
 var path = require('path')
var request = require('request');

//	The full url to access stored files
// 	read _env.sample
var url = process.env.AZURE_STORAGEACCOUNT + process.env.AZURE_CONTAINERNAME;

var app = express()

app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
	res.render('index', {
		title: 'PAC acrhives', 
		message: 'Enter your code',
		formAction: '/code',
		formMethod: 'post',
		inputTextAreaType: 'text',
		inputTextAreaName: 'blobFile',
		inputButtonType: 'submit',
		inputButtonValue: 'Dowload'
	});
})

app.post('/code', function (req, res) {
	var fileName = req.body.blobFile + '.7z';
	try {
		request(url + fileName, function(err, response) {
			if (response.statusCode !== 200) {
				console.log('bad beat!')
				res.send(
				'<div>The code ' + req.body.blobFile + ' does not exist</div>' +
				'<input type="button" value="Back" onclick="window.history.back()"/>'
				);
				return
			}
			res.setHeader('Content-disposition', 'attachment; filename=' + fileName);
			res.send(response.body);
			res.end();
		})
		
	} catch(e) {
		res.send('File does not exist').end();
	}
})

app.listen(3000)
