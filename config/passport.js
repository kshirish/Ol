var TwitterStrategy  = require('passport-twitter').Strategy;
var InstagramStrategy  = require('passport-instagram').Strategy;
var configAuth = require('./auth');
var userId;

module.exports = function(passport, User, ObjectId) {

    // passport needs ability to serialize and unserialize users out of session
    passport.serializeUser(function(user, done) {
        userId = user._id;
        done(null, user._id);
    });

    passport.deserializeUser(function(_id, done) {

        User.find({'_id': ObjectId(_id)}, function(err, user) {
            done(err, user);
        });
    });

    // Twitter
    passport.use(new TwitterStrategy({

        consumerKey     : configAuth.twitterAuth.consumerKey,
        consumerSecret  : configAuth.twitterAuth.consumerSecret,
        callbackURL     : configAuth.twitterAuth.callbackURL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, token, tokenSecret, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in twitter
            if (!(req.user && req.user.twitter)) {

                User.findOne({ 'twitter.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {
                        // if there is a user id already but no token (user was linked at one point and then removed)
                        if (!user.twitter.token) {
                            user.twitter.token       = token;
                            user.twitter.username    = profile.username;
                            user.twitter.displayName = profile.displayName;

                            User.update({ 'twitter.id' : profile.id }, user, function(err) {
                                if (err)
                                    return done(err);
                                    
                                return done(null, user);
                            });
                        }

                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user, create them
                        var newUser                 = {twitter: {}};

                        newUser.twitter.id          = profile.id;
                        newUser.twitter.token       = token;
                        newUser.twitter.username    = profile.username;
                        newUser.twitter.displayName = profile.displayName;

                        if(userId) {

                            // update the existing user object by adding twitter object
                            User.update({'_id': userId}, {$set: {twitter: newUser.twitter}}, function(err) {
                                if (err)
                                    return done(err);

                                newUser._id = userId.toString();
                                return done(null, newUser);
                            });

                        } else {

                            // create a user object and add twitter object within
                            User.save(newUser, function(err) {
                                if (err)
                                    return done(err);

                                return done(null, newUser);
                            });
                        }

                    }
                });

            } else {
                // user already exists and is logged in, we have to link accounts
                var user                 = req.user;

                user.twitter.id          = profile.id;
                user.twitter.token       = token;
                user.twitter.username    = profile.username;
                user.twitter.displayName = profile.displayName;

                User.update({'twitter.id' : profile.id}, user, function(err) {
                    if (err)
                        return done(err);
                                    
                    return done(null, user);
                });
                
            }

        });
    }));


    // Instagram
    passport.use(new InstagramStrategy({

        clientID     : configAuth.instagramAuth.clientId,
        clientSecret  : configAuth.instagramAuth.clientSecret,
        callbackURL     : configAuth.instagramAuth.callbackURL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, token, tokenSecret, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in instagram
            if (!(req.user && req.user.instagram)) {

                User.findOne({ 'instagram.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {
                        // if there is a user id already but no token (user was linked at one point and then removed)
                        if (!user.instagram.token) {
                            user.instagram.token       = token;
                            user.instagram.username    = profile.username;
                            user.instagram.displayName = profile.displayName;

                            User.update({ 'instagram.id' : profile.id }, user, function(err) {
                                if (err)
                                    return done(err);
                                    
                                return done(null, user);
                            });
                        }

                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user, create them
                        var newUser                 = {instagram: {}};

                        newUser.instagram.id          = profile.id;
                        newUser.instagram.token       = token;
                        newUser.instagram.username    = profile.username;
                        newUser.instagram.displayName = profile.displayName;

                        if(userId) {

                            // update the existing user object by adding instagram object
                            User.update({'_id': userId}, {$set: {instagram: newUser.instagram}}, function(err) {
                                if (err)
                                    return done(err);

                                newUser._id = userId.toString()
                                return done(null, newUser);
                            });

                        } else {

                            // create a user object and add instagram object within
                            User.save(newUser, function(err) {
                                if (err)
                                    return done(err);

                                return done(null, newUser);
                            });
                        }

                    }
                });

            } else {
                // user already exists and is logged in, we have to link accounts
                var user                 = req.user;

                user.instagram.id          = profile.id;
                user.instagram.token       = token;
                user.instagram.username    = profile.username;
                user.instagram.displayName = profile.displayName;

                User.update({'instagram.id' : profile.id}, user, function(err) {
                    if (err)
                        return done(err);
                                    
                    return done(null, user);
                });
                
            }

        });
    }));

};
