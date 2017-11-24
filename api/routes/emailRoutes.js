'use strict';

module.exports = function(app) {
  const emailCtrl = require('../controllers/emailController');

  app.post('/api/emails', function(req, res) {
    emailCtrl.sendEmail(req).then((result) => {
      res.send(result);
    });
  });
};
