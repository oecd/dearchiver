require('dotenv').config({path: './_env'});
var express = require('express')
var fs = require('fs');
var request = require('request');

//	The full url to access stored files
// 	read _env.sample
var url = process.env.AZURE_STORAGEACCOUNT + process.env.AZURE_CONTAINERNAME;

var app = express()

app.get('/code/:code', function (req, res) {
	var fileName = req.params.code + '.7z';
	res.setHeader('Content-disposition', 'attachment; filename=' + fileName);
	request
		.get(url + fileName)
		.on('error', function(err) {
		    console.log(err)
	  	})
		.pipe(res);	
})
app.listen(3000)
