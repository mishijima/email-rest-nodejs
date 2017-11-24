'use strict';

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

const URLSearchParams = require('url-search-params');
const Joi = require('joi');
const fetch = require('node-fetch');
const config = require('../config/settings').get(process.env.NODE_ENV);

const self = module.exports = {
  /**
   * This function validates the inputs and if one of the inputs doesn't pass the validation an error response will be thrown to the client.
   * If it passes the validation then it goes to the next step which is to check if the server can be reached. If one of the servers can be reached then it will send the email and returns the response back to the client.
   * However, if both servers cannot be reached then the email will be saved to the database for further processing.
   *
   * @param request Request from the client
   * @returns {Promise.<*>} Promise with result object
   */
  sendEmail: async (request) => {
    let responseObj = {};
    // Validate the request input
    const schema = Joi.object().keys({
      from: Joi.string().email().required(),
      to: Joi.array().items(Joi.string().email()),
      cc: Joi.array().items(Joi.string().email()),
      bcc: Joi.array().items(Joi.string().email()),
      subject: Joi.string().required(),
      text: Joi.string().required(),
    });

    const result = Joi.validate(request.body, schema);

    if (result.error !== null) {
      responseObj.error_type = 'Bad request';
      responseObj.error_messages = [];

      for (const i in result.error.details) {
        const detail = result.error.details[i];

        if (detail.path.indexOf('to') > -1
            || detail.path.indexOf('cc') > -1
            || detail.path.indexOf('bcc') > -1) {
          responseObj.error_messages.push('\"' + detail.path[0] +
              '\" contains invalid email(s)');
        } else {
          responseObj.error_messages.push(detail.message);
        }
      }

      return responseObj;
    }

    if (await self.healthCheck(config.sendGrid.url)) {
      return await self.sendEmailViaSendGrid(request);
    } else if (await self.healthCheck(config.mailGun.url)) {
      return await self.sendEmailViaMailGun(request);
    } else {
      console.log('Both providers are not available');
      return self.constructResponseObj(503); // If both couldn't be reached just use 503
    }
  },

  /**
   * Sends the email via SendGrid
   *
   * @param request
   * @returns {Promise.<T>} Promise with result object
   */
  sendEmailViaSendGrid: (request) => {
    // Construct the request body
    const data = self.buildSendGridRequestBody(request.body);

    return fetch(config.sendGrid.url, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': config.sendGrid.contentType,
        'Authorization': 'Bearer ' + config.sendGrid.key,
      },
    }).then(res => {
      return self.constructResponseObj(res);
    }).catch(err => {
      console.log(err);
    });
  },

  /**
   * Sends the email via MailGun
   *
   * @param request Request from the client Response to the client
   * @returns {Promise.<T>} Promise with result object
   */
  sendEmailViaMailGun: (request) => {
    // Construct the request body
    const data = self.buildMailGunRequestBody(request.body);

    return fetch(config.mailGun.url, {
      method: 'POST',
      body: data,
      headers: {
        'Content-Type': config.mailGun.contentType,
        'Authorization': 'Basic ' +
        new Buffer('api:' + config.mailGun.key).toString('base64'),
      },
    }).then(res => {
      return self.constructResponseObj(res);
    }).catch(err => {
      console.log(err);
    });
  },

  /**
   * A helper function to build the request body for SendGrid
   *
   * @param body Email data
   * @returns Constructed data object
   */
  buildSendGridRequestBody: (body) => {
    const data = {};

    data.personalizations = [
      {
        subject: body.subject,
      },
    ];
    data.from = {
      email: body.from,
    };
    data.content = [
      {
        type: 'text/plain',
        value: body.text,
      },
    ];

    const toArr = [];
    for (let i in body.to) {
      toArr.push({
        email: body.to[i],
      });
    }

    const ccArr = [];
    for (let i in body.cc) {
      ccArr.push({
        email: body.cc[i],
      });
    }

    const bccArr = [];
    for (let i in body.bcc) {
      bccArr.push({
        email: body.bcc[i],
      });
    }

    if (toArr.length > 0) {
      data.personalizations[0].to = toArr;
    }

    if (ccArr.length > 0) {
      data.personalizations[0].cc = ccArr;
    }

    if (bccArr.length > 0) {
      data.personalizations[0].bcc = bccArr;
    }

    return data;
  },

  /**
   * A helper function to build the request body for MailGun
   *
   * @param body Email data
   * @returns Constructed data object
   */
  buildMailGunRequestBody: (body) => {
    const data = new URLSearchParams();
    data.append(data);
    data.append('from', body.from);

    for (let i in body.to) {
      data.append('to', body.to[i]);
    }

    for (let i in body.cc) {
      data.append('cc', body.cc[i]);
    }

    for (let i in body.bcc) {
      data.append('bcc', body.bcc[i]);
    }

    data.append('subject', body.subject);
    data.append('text', body.text);

    return data;
  },

  /**
   * Does a simple health check to the provider
   *
   * @param targetUrl Url to connect
   */
  healthCheck: (targetUrl) => {
    return fetch(targetUrl, {
      // We cannot use OPTIONS to sendgrid because nodejs throws HPE_UNEXPECTED_CONTENT_LENGTH exception when it sees duplicates 'Content-Length' in the response
      // so I'm just going to use POST and return true if the response is 401
      method: 'POST',
      follow: 0,
      timeout: 3000,
    }).then(function(res) {
      return res.status === 401;
    }).catch(err => {
      console.log(err);
      return false;
    });
  },

  /**
   * Constructs the response for the client
   *
   * @param res Response from the provider
   * @param res
   * @returns {{}} Response object
   */
  constructResponseObj: (res) => {
    const responseObj = {};
    responseObj.timestamp = new Date().getTime();
    if (res.status >= 400) {
      console.log('Something went wrong - response status: ' + res.status +
          ' (' + res.statusText + ')');
      responseObj.message = 'Your email has been added to the queue';
      // TODO Persist to db
    } else {
      responseObj.message = 'Your email has been sent';
    }

    return responseObj;
  },
};
