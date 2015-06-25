var configAuth = require('../config/auth');
var request = require('request');
var oauth, url, qs;

// middleware to check login
function isLoggedIn(req, res, next) {

    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}

function filterTwitterData(tArr) {

    var rArr = [];   // object to return 

    tArr.map(function(value, index) {

        rArr[index] = {};
        rArr[index].created_at = value.created_at;
        rArr[index].retweet_count = value.retweet_count;
        rArr[index].favorite_count = value.favorite_count;
        rArr[index].text = value.text;
        rArr[index].name = value.user.name;
        rArr[index].screen_name = value.user.screen_name;
        rArr[index].location = value.user.location;
        rArr[index].profile_image_url = value.user.profile_image_url;

    });

    return rArr;

}

module.exports = function(app, passport) {

    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    app.get('/profile', isLoggedIn, function(req, res) {
        console.log(req.user);    
        res.render('profile.ejs', {
            user : req.user[0]
        });
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

    app.get('/api/twitter', isLoggedIn, function(req, res) {
        var tempUser = req.user[0];

        oauth = { 
            consumer_key: configAuth.twitterAuth.consumerKey,
            consumer_secret: configAuth.twitterAuth.consumerSecret,
            token: tempUser.twitter.token,
            token_secret: configAuth.twitterAuth.tokenSecret
        };

        url = 'https://api.twitter.com/1.1/statuses/home_timeline.json';

        qs = {
            screen_name: tempUser.twitter.displayName,
            user_id: tempUser.twitter.id,
            // trim_user: true,
            count: 15,
            contributor_details: true
        };

        request.get({url:url, oauth:oauth, qs:qs, json:true}, function (e, r, user) {            
            
            res.json({
                results: filterTwitterData(user)
            });
        });

    });

};