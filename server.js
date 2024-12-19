'use strict';
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config({ path: './_env' });
const express = require('express');
const router = express.Router();
const ipfilter = require('express-ipfilter').IpFilter;
const IpDeniedError = require('express-ipfilter').IpDeniedError;
const request = require('request');
const { checkCode, getInfoFromCode, formatCode, getAzureIp } = require('./utils');
const { downloadBlob, blobExists } = require('./azure-download');

const port = process.env.PORT || 3000;

const jsonObj = require('./package.json');
const appVersion = jsonObj.version;

// Whitelist the IP addresses from us and monitoring locations
let whitelistedIPs = ['::1', '127.0.0.1', process.env.IP_WHITELIST].concat(
  fs
    .readFileSync(path.join(__dirname, process.env.IP_WHITELIST_FILE))
    .toString()
    .split('\r')
    .filter((line) => line.trim() !== '')
    .map((line) => line.trim())
);

if (process.env.NODE_DEBUG) {
  console.log(`whitelisted IPs: ${JSON.stringify(whitelistedIPs)}`);
}

const app = express();
app.set('view engine', 'pug');

// Serve static files with the correct base URL
app.use('/dearchiver', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware to pass `baseUrl` to Pug templates
app.use('/dearchiver', (req, res, next) => {
  res.locals.baseUrl = '/dearchiver'; // Makes `baseUrl` available in Pug templates
  next();
});

// Error handling middleware
router.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof IpDeniedError) {
    const rejectIp = req.ip || req.header('x-forwarded-for');
    res.status(403).render('error', {
      title: 'Access denied',
      showRejectedIp: rejectIp
    });
  } else {
    next(err);
  }
});

// Routes
router.get('/', (req, res) => {
  res.render('index', {
    title: 'PAC Dearchiver',
    inputFileName: 'blobFile',
    appVersion: appVersion
  });
});

router.get('/download/:container/:blob', async (req, res) => {
  const containerName = req.params.container;
  const blobName = req.params.blob;

  console.log(`Attempting to download ${containerName}/${blobName} ...`);

  try {
    // Call the function to download the blob
    await downloadBlob(containerName, blobName, res);
  } catch (e) {
    console.error(`Failed to download blob: ${e.message}`);
    res.status(500).send('Failed to download the file');
  }
});

router.post('/', async (req, res) => {
  const containerType = req.body.containerType;
  const blobFile = req.body.blobFile;

  let blobName, containerName;
  const o = getInfoFromCode(blobFile);
  if (!checkCode(blobFile) || !o) {
    res.render('index', { container: null, blob: null, code: blobFile, appVersion, message: 'notFound' });
    return;
  }

  if (containerType === 'prepress') {
    containerName = `${process.env.AZURE_CONTAINERNAME_PREFIX}${containerType}-${o.yearCode}`;
    blobName = formatCode(blobFile);
  } else if (containerType === 'pod') {
    containerName = `${process.env.AZURE_CONTAINERNAME_PREFIX}${containerType}`;
    blobName = `${blobFile}.7z`;
  } else {
    console.log(`Unknown or new container type: ${containerType}`);
  }

  const resObject = {
    container: containerName,
    blob: blobName,
    code: blobFile,
    appVersion: appVersion
  };

  try {
    if (await blobExists(containerName, blobName)) {
      resObject.message = 'success';
    } else {
      resObject.message = 'notFound';
    }
    res.render('index', resObject);
  } catch (e) {
    console.log(e);
    resObject.message = 'notFound';
    res.render('index', resObject);
  }
});

// Mount the router on the `/dearchiver` path
app.use('/dearchiver', router);

// Start the server
app.listen(port, () => {
  console.log(`Dearchiver is now listening on port ${port}!`);
});
