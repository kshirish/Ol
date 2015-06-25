var configAuth = require('../config/auth');
var request = require('request');

// middleware to check login
function isLoggedIn(req, res, next) {

    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}

module.exports = function(app, passport) {


    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    app.get('/profile', isLoggedIn, function(req, res) {

        oauth = { 
            consumer_key: configAuth.twitterAuth.consumerKey,
            consumer_secret: configAuth.twitterAuth.consumerSecret,
            token: req.user.twitter.token,
            token_secret: configAuth.twitterAuth.tokenSecret
        },
        url = 'https://api.twitter.com/1.1/statuses/home_timeline.json',
        qs = {
            screen_name: req.user.twitter.displayName,
            user_id: req.user.twitter.id,
            trim_user: true,
            count: 2,
            contributor_details: true
        };

        request.get({url:url, oauth:oauth, qs:qs, json:true}, function (e, r, user) {
            
            res.render('profile.ejs', {
                'user' : user
            });
        })

    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

    app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }));


    app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

    app.get('/connect/twitter/callback',
        passport.authorize('twitter', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }));


    app.get('/unlink/twitter', isLoggedIn, function(req, res) {
        var user           = req.user;
        user.twitter.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};