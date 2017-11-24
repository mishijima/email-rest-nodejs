'use strict';

const config = {
  production: {
    sendGrid: {
      provider: 'sendgrid',
      from: '<enter-email-address>',
      url: '<enter-api-url>',
      requestMethod: 'POST',
      key: '<enter-api-key>',
      contentType: 'application/json',
      acceptType: 'application/json',
    },

    mailGun: {
      provider: 'mailgun',
      from: '<enter-email-address>',
      url: '<enter-api-url>',
      requestMethod: 'POST',
      key: '<enter-api-key>',
      contentType: 'application/x-www-form-urlencoded',
      acceptType: 'application/json',
    },
  },
  default: {
    sendGrid: {
      provider: 'sendgrid',
      from: '<enter-email-address>',
      url: '<enter-api-url>',
      requestMethod: 'POST',
      key: '<enter-api-key>',
      contentType: 'application/json',
      acceptType: 'application/json',
    },

    mailGun: {
      provider: 'mailgun',
      from: '<enter-email-address>',
      url: '<enter-api-url>',
      requestMethod: 'POST',
      key: '<enter-api-key>',
      contentType: 'application/x-www-form-urlencoded',
      acceptType: 'application/json',
    },
  },
};

exports.get = function get(env) {
  return config[env] || config.default;
};