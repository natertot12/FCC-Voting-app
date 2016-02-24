module.exports = function(app, passport) {


var path = require("path"),
    fs = require("fs"),
    formidable = require("formidable"),
    util = require("util"),
    mongo = require('mongodb').MongoClient,
    express = require("express"),
    mongoUrl = 'mongodb://localhost:27017/polls';



  //var app = require('express')();
  //var server = require('http').Server(port);
  //var io = require('socket.io')(server);  

  var dataTest = [];
  var currentPoll = "";
  var currentDes = "";
  


mongo.connect(mongoUrl, function(err, db) {
   if(err) throw err;
    db.createCollection("polls", {
        capped: true,
        size: 5242880,
        max: 5000
    });


app.get('/polls', function(req,res) {//finds most popular polls and sends
    var searches = db.collection('polls').find().limit(10).sort({total:-1});
    searches.forEach(function(doc) {
            res.write("<p><a href='/polls/" + doc._id + "'>" + JSON.stringify(doc.Description) + " Total votes: " + JSON.stringify(doc.total) + "</a></p>");
        }, function(err) {
            if(err) throw err;
            res.end();
        });
  });
  
  app.get('/polls/:specificPoll', function(req, res) {//sends chart data
    var url = req.params.specificPoll;
    console.log(url);
    currentPoll = url;
    var ObjectID=require('mongodb').ObjectID;
    
    db.collection('polls').findOne({_id: ObjectID(url)},function(err,poll){
        console.log(poll.Description);
        if(err) throw err;
        dataTest = poll.Data;
        currentDes = poll.Description;
    });
    //updatePoll();
    //res.sendFile((path.join(__dirname + '/views/pie/pie.html')));
    res.sendFile((path.join(__dirname + '/../views/pie.html')));
    //res.sendFile('pie.html');
    //res.render("pie.ejs");
  });
  
  app.post("/option1", function(req, res) {
    console.log("Voted for Option 1");
    addVote(res, "option-1");
  });
  app.post("/option2", function(req, res) {
    console.log("Voted for Option 2");
    addVote(res, "option-2");
  });
  app.post("/option3", function(req, res) {
    console.log("Voted for Option 3");
    addVote(res, "option-3");
  });
  app.post("/option4", function(req, res) {
    console.log("Voted for Option 4");
    addVote(res, "option-4");
  });
  app.post("/option5", function(req, res) {
    console.log("Voted for Option 5");
    addVote(res, "option-5");
  });
  app.post("/profile", function(req, res) {
    processAllFieldsOfTheForm(req, res);
  });

  function savePoll(des, chart) {
    var polls = db.collection('polls');
    polls.insertOne({total: 0, "Description": des, "Data": chart}, function(err) {
      if(err) throw err;
    });
  }
  
  //will have to add users polls
  function processAllFieldsOfTheForm(req, res) {
      var form = new formidable.IncomingForm();
      function parseData(fields, files, item) {
        var str = util.inspect(fields[item], {fields: fields, files: files});
        return str.replace(/(\"|\')/g, "");
      }
      form.parse(req, function (err, fields, files) {
        if(err) throw err;
          //res.writeHead(200, {'content-type': 'text/plain'});
          
          var rawData = [
            {
              value: 0,
              label: parseData(fields, files, "option-1"),
              color: "#4169E1"
            },
            {
              value: 0,
              label: parseData(fields, files, "option-2"),
              color: "#C0C0C0"
            },
            {
              value: 0,
              label: parseData(fields, files, "option-3"),
              color: "#FFA500"
            },
            {
              value: 0,
              label: parseData(fields, files, "option-4"),
              color: "#FF4500"
            },
            {
              value: 0,
              label: parseData(fields, files, "option-5"),
              color: "#EE82EE"
            }
          ];
          //condenses from data
          var chartData = [];
          for(var a = 0; a < rawData.length; a++) if(rawData[a].label != '' && rawData[a].label != "") chartData.push(rawData[a]);
          
          savePoll(parseData(fields, files, "description"), chartData);
          //console.log(parseData(fields, files, "description"), chartData);
          res.redirect("/profile");
      });
  }
  
  function addVote(res, thing) {
      var ObjectID=require('mongodb').ObjectID;
      switch(thing) {
        case "option-1":
            db.collection('polls').update({_id: ObjectID(currentPoll)}, { $inc: { total: 1, "Data.0.value": 1} });
            break;
        case "option-2":
            db.collection('polls').update({_id: ObjectID(currentPoll)}, { $inc: { total: 1, "Data.1.value": 1} });
            break;
        case "option-3":
            db.collection('polls').update({_id: ObjectID(currentPoll)}, { $inc: { total: 1, "Data.2.value": 1} });
            break;
        case "option-4":
            db.collection('polls').update({_id: ObjectID(currentPoll)}, { $inc: { total: 1, "Data.3.value": 1} });
            break;
        case "option-5":
            db.collection('polls').update({_id: ObjectID(currentPoll)}, { $inc: { total: 1, "Data.4.value": 1} });
            break;
      }
    res.redirect("/polls/" + currentPoll);
  }
  
  /*
  function updatePoll() {
      io.on('connection', function (socket) {
      socket.emit('chart', dataTest);
      socket.emit('description', currentDes);
      
      socket.on('recieved', function (data) {
        //console.log(data);
      });
    });
  }
  updatePoll();
  */




// normal routes ===============================================================
    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });
    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user
        });
    });
    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================
    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });
        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));
        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });
        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));
    // twitter --------------------------------
        // send to twitter to do the authentication
        app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));
        // handle the callback after twitter has authenticated the user
        app.get('/auth/twitter/callback',
            passport.authenticate('twitter', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));
// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================
    // locally --------------------------------
        app.get('/connect/local', function(req, res) {
            res.render('connect-local.ejs', { message: req.flash('loginMessage') });
        });
        app.post('/connect/local', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));
    // twitter --------------------------------
        // send to twitter to do the authentication
        app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

        // handle the callback after twitter has authorized the user
        app.get('/connect/twitter/callback',
            passport.authorize('twitter', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));
// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future
    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            if(err) throw err;
            res.redirect('/profile');
        });
    });
    // twitter --------------------------------
    app.get('/unlink/twitter', isLoggedIn, function(req, res) {
        var user           = req.user;
        user.twitter.token = undefined;
        user.save(function(err) {
            if(err) throw err;
            res.redirect('/profile');
        });
    });
});
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}