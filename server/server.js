var fs = require('fs');

var http = require('http');
var https = require('https');

var privateKey  = fs.readFileSync(__dirname + '/cert/privatekey.pem').toString();
var certificate = fs.readFileSync(__dirname + '/cert/certificate.pem').toString();
var credentials = {key: privateKey, cert: certificate};

var express = require('express');

var mongoProxy = require('./src/mongo/mongoProxy');
var config = require('./src/mongo/mongoConfig.js');


var passport = require('passport');

require('express-namespace');

var app = express();

var secureServer = https.createServer(credentials, app);
var server = http.createServer(app);

var security = require('./src/security/security');
var protectJSON = require('./src/security/protectJSON');
var xsrf = require('./src/security/xsrf');

//require('./src/routes/static').addRoutes(app, config);

app.use(protectJSON);

app.use(express.logger());                                  // Log requests to the console
app.use(express.bodyParser());                              // Extract the data from the body of the request - this is needed by the LocalStrategy authenticate method

app.use(express.cookieParser(config.server.cookieSecret));  // Hash cookies with this secret
app.use(express.cookieSession());                           // Store the session in the (secret) cookie

app.use(passport.initialize());                             // Initialize PassportJS
app.use(passport.session());                                // Use Passport's session authentication strategy - this stores the logged in user in the session and will now run on any request

app.use(xsrf);                                            // Add XSRF checks to the request

security.initialize(config.mongo.dbUrl, config.mongo.apiKey, config.security.dbName, config.security.usersCollection); // Add a Mongo strategy for handling the authentication

//app.use(function(req, res, next) {
//  if (req.user) {
//    console.log('Current User:', req.user.firstName, req.user.lastName);
//  } else {
//    console.log('Unauthenticated');
//  }
//  next();
//});

//app.namespace('/databases/:db/collections/:collection*', function() {
//  app.all('/', function(req, res, next) {
//    if ( req.method !== 'GET' ) {
//      // We require the user is authenticated to modify any collections
//      security.authenticationRequired(req, res, next);
//    } else {
//      next();
//    }
//  });
  
//app.all('/', function(req, res, next) {
//    if ( req.method !== 'GET' && (req.params.collection === 'users' || req.params.collection === 'projects') ) {
//      // We require the current user to be admin to modify the users or projects collection
//      return security.adminRequired(req, res, next);
//    }
//    next();
//  });
//  // Proxy database calls to the MongoDB
//  app.all('/', mongoProxy(config.mongo.dbUrl, config.mongo.apiKey));
//});

//require('./lib/routes/security').addRoutes(app, security);
//require('./lib/routes/appFile').addRoutes(app, config);

var routes = require('./src/routes');
app.get('/', routes.index);

// A standard error handler - it picks up any left over errors and returns a nicely formatted server 500 error
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

// Start up the server on the port specified in the config
server.listen(config.server.listenPort, '0.0.0.0', 511, function() {

var open = require('open');
open('http://localhost:' + config.server.listenPort + '/');

});

console.log('Geodecisions App Server - listening on port: ' + config.server.listenPort);
