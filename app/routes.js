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

    var rArr = [];   // array to return 

    tArr.map(function(value, index) {

        rArr[index] = {};
        rArr[index].created_at = (new Date(value.created_at)).toLocaleString();
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

function filterInstagramData(tObj) {

    var rArr = [];   // array to return 

    tObj.data.map(function(value, index) {

        rArr[index] = {};
        rArr[index].tags = value.tags;
        rArr[index].caption_text = (value.caption && value.caption.text) || '';
        rArr[index].created_at = (new Date(parseInt(value.created_time))).toLocaleString();
        rArr[index].username = value.user.username;
        rArr[index].full_name = value.user.full_name;
        rArr[index].profile_picture = value.user.profile_picture;
        rArr[index].location = (value.location && value.location.name) || 'NA';
        rArr[index].likes_count = value.likes.count;
        rArr[index].comments_count = value.comments.count;
        rArr[index].image_url = value.images.standard_resolution.url;

    });

    return rArr;

}

module.exports = function(app, passport) {

    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user[0]
        });
    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // Twitter
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

    // Instagram
    app.get('/auth/instagram', passport.authenticate('instagram'));

    app.get('/auth/instagram/callback',
        passport.authenticate('instagram', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }));


    app.get('/connect/instagram', passport.authorize('instagram'));

    app.get('/connect/instagram/callback',
        passport.authorize('instagram', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }));


    app.get('/unlink/instagram', isLoggedIn, function(req, res) {
        var user           = req.user;
        user.instagram.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    app.get('/api/instagram', isLoggedIn, function(req, res) {
            
        var tempUser = req.user[0];
        qs = { 
            access_token: tempUser.instagram.token
        };

        url = 'https://api.instagram.com/v1/users/self/feed';

        request.get({url:url, qs:qs, json:true}, function (e, r, user) {            
            res.json({
                results: filterInstagramData(user)
            });
        });

    });

};