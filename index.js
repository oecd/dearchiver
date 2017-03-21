var azureStorage = require('azure-storage');
require('dotenv').config({path: './_env'});
var express = require('express')
var fs = require('fs');
var request = require('request');
var userhome = require('userhome');

//	The full url to access stored files = 
//	AZURE_STORAGEACCOUNT + AZURE_CONTAINERNAME
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

/*request
	.get(url + file)
	.on('error', function(err) {
	    console.log(err)
  	})
	.pipe(fs.createWriteStream(dlDir + file));
*/
/*request(url + file, function (error, response, body) {
	if (error) {
	  console.log('error:', error); // Print the error if one occurred 
	} else {
	  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
	  console.log('dlDir:', dlDir); // Print the HTML for the Google homepage.
	  fs.writeFile(dlDir + file, body, function (err) {
		  if (err) throw err;
		  console.log('It\'s saved!');
	  })
	}
});*/