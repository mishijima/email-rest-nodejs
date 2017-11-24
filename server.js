'use strict';

const express = require('express');
const app = express();
const port = process.env.PORT || 7000;
const bodyParser = require('body-parser');
const routes = require('./api/routes/emailRoutes');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

routes(app);

app.use(function(req, res) {
  res.status(404).send(
      {url: req.originalUrl + ' not found'},
  );
});

app.listen(port);

console.log('Server started on: ' + port);