// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'twitterAuth' : {
        'consumerKey'        : process.env.TWITTER_CONSUMER_KEY,
        'consumerSecret'     : process.env.TWITTER_CONSUMER_SECRET,
        'callbackURL'        : 'http://timestamp-natertot12.c9users.io:8080/auth/twitter/callback'
    },

};
