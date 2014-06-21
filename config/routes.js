var router = require('koa-router');

var countController = require('../src/controllers/count');
var indexController = require('../src/controllers/index');
var authController = require('../src/controllers/auth');
var casController = require('../src/controllers/cas');

var secured = function *(next) {
  if (this.isAuthenticated()) {
    yield next;
  } else {
    this.status = 401;
  }
};

var service = 'service=http%3A%2F%2Flocalhost%3A3000%2Flogin%2Fcas%2Fcb'

module.exports = function (app, passport) {
  // register functions
  app.use(router(app));

  app.get('/login', authController.login);
  app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login?error=local'
  }));

  app.get('/auth/cas', passport.authenticate('cas'));
  app.all('/auth/cas/callback', passport.authenticate('cas', {
    successRedirect: '/',
    failureRedirect: '/login?error=cas'
  }));

  app.get('/user/:cip/:password', authController.createUser);

  app.get('/', function *() {
    if (this.isAuthenticated()) {
      yield indexController.index.apply(this);
    } else {
      this.redirect('/login');
    }
  });

  // secured routes
  app.get('/value', secured, countController.getCount);
  app.get('/inc', secured, countController.increment);
  app.get('/dec', secured, countController.decrement);
};


//service=http%3A%2F%2Flocalhost%3A3000%2Flogin%2Fcas%2Fcb
