/* globals empty */

/**
 * ZIP HTTP service wrapper
 *
 * Thin wrapper around service registry to handle
 * ZIP API service calls and responses.
 */

var StringUtils = require('dw/util/StringUtils');

/**
 * Zip Error
 *
 * @param {string} message error message
 */
function ZipError(message) {
    this.name = 'ZipError';
    this.message = message;
    this.stack = (new Error()).stack;
}

ZipError.prototype = Error.prototype;

/**
 * Api Client
 *
 * The api client wraps the Zip HTTP service functionality.
 *
 * @param {dw.svc.Service} service HTTP Service
 * @param {dw.system.Logger} logger API Logger
 */
function Client(service, logger) {
    this.service = service;
    this.apiLogger = logger;
    this.baseServiceUrl = service.getURL();
    this.apiKey = '';
}

Client.prototype.setApiKey = function (apiKey) {
    this.apiKey = apiKey;
};

Client.prototype.getApiKey = function () {
    return this.apiKey;
};

Client.prototype.generateRandomString = function () {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < 12; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
};

Client.prototype.getService = function () {
    return this.service;
};

/**
 * Executes an HTTP request to ZIP API
 *
 * @param {string} urlPath - URL path.
 * @param {string} httpVerb - a valid HTTP verb.
 * @param {Object} requestBody - optional, JSON body.
 * @returns {string} Parsed JSON response; if not available - response status code.
 */
Client.prototype.call = function (urlPath, httpVerb, requestBody) {
    var callId = this.generateRandomString();
    var service = this.getService();

    service.addHeader('Zip-Version', '2017-03-01');
    service.addHeader('Authorization', 'Bearer ' + this.getApiKey());
    service.addHeader('Content-Type', 'application/json');
    service.addHeader('Accept', 'application/json');
    service.addHeader('Idempotency-Key', callId);
    service.URL = this.baseServiceUrl + urlPath;

    if (!empty(httpVerb) && this.isValidHttpVerb(httpVerb)) {
        service.setRequestMethod(httpVerb);
    } else {
        throw new Error('Invalid HTTP Verb provided for the API call.');
    }

    this.logRequestData(callId, urlPath, httpVerb, requestBody);

    var t0 = new Date().getTime();

    var responseData = {};

    if (empty(requestBody)) {
        responseData = service.call();
    } else {
        responseData = service.call(requestBody);
    }

    var t1 = new Date().getTime();

    var elapsed = t1 - t0;

    this.logResponseData(callId, elapsed, responseData);

    if (responseData.status === 'ERROR') {
        var errorData = {};
        var errorMsg = '';

        try {
            errorData = JSON.parse(responseData.errorMessage).error;
        } catch (e) {
            //
        }

        if (errorData.code === 'request_invalid') {
            errorMsg = errorData.details[0].name;
        } else {
            errorMsg = errorData.code;
        }

        throw new ZipError(errorMsg);
    }

    var parsedResponseText = JSON.parse(responseData.object.text);

    return parsedResponseText;
};

/**
 * Validates an input against the HTTP verbs.
 *
 * @param {string} httpVerb - one of POST, GET, PUT, DELETE.
 * @returns {boolean} - true, if the passed input is a valid HTTP verb.
 */
Client.prototype.isValidHttpVerb = function (httpVerb) {
    var validHttpVerbs = ['GET', 'PUT', 'POST', 'DELETE', 'PATCH'];

    if (validHttpVerbs.indexOf(httpVerb) !== -1) {
        return true;
    }

    throw new Error('Not valid HTTP verb defined - ' + httpVerb);
};

/**
 * Log debug request data for API calls.
 *
 * @param {string} callId random key to identify the API request.
 * @param {string} urlPath - URL path from last service call.
 * @param {string} httpVerb - valid HTTP verb from last service call.
 * @param {Object} requestBody - Request body of the last service call.
 */
Client.prototype.logRequestData = function (callId, urlPath, httpVerb, requestBody) {
    var requestBodyJson = JSON.stringify(requestBody, null, 4);

    var message = StringUtils.format('REQUEST [{0}]: urlPath={1}, httpVerb={2}, requestBody=[{3}]',
        callId,
        this.service.getURL(),
        httpVerb,
        requestBodyJson);

    this.apiLogger.info(message);
};

/**
 * Log debug response data for API calls.
 *
 * @param {string} callId random key to identify the API request
 * @param {int} responseTime the time difference of sending the request and receiving the response
 * @param {Object} result response object
 */
Client.prototype.logResponseData = function (callId, responseTime, result) {
    var resultObjectText = '';
    var status = result.error;

    if (!empty(result.object) && !empty(result.object.text)) {
        resultObjectText = result.object.text;
    } else if (!empty(result.errorMessage)) {
        resultObjectText = result.errorMessage;
    }

    var message = StringUtils.format('RESPONSE [{0}]: statusCode=[{1}], responseTime=[{2}], responseBody=[{3}]',
        callId,
        status + ' ' + result.msg,
        responseTime + 'ms',
        resultObjectText);

    if (status === 'ERROR') {
        this.apiLogger.error(message);
    } else {
        this.apiLogger.info(message);
    }
};

module.exports = Client;
