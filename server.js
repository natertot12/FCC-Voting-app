// server.js

//all credit for twitter and login/signup integration ---> https://github.com/scotch-io/easy-node-authentication/tree/twitter

// set up ======================================================================
var app = require("express")();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var configDB = require('./config/database.js');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
//var route = require('./app/routes.js');
//route(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
//app.listen(port);
//console.log('The magic happens on port ' + port);


    
    var path = require("path"),
    fs = require("fs"),
    formidable = require("formidable"),
    util = require("util"),
    mongo = require('mongodb').MongoClient,
    express = require("express"),
    mongoUrl = 'mongodb://localhost:27017/polls';



  //var app = require('express')();
  var server = require('http').Server(app);
  var io = require('socket.io')(server);  

  var dataTest = [];
  var currentPoll = "";
  var currentDes = "";
  var currentUser = "";
  var voteNum;
  


mongo.connect(mongoUrl, function(err, db) {
   if(err) throw err;
    
  app.get("/myPolls", function(req, res) {
      var searches = db.collection('polls').find({createdBy: currentUser._id.toString()}).sort({total:-1});
    fs.readFile((path.join(__dirname + '/views/poll.html')), function(err, data) {
        if (err) throw err;
        res.write(data);
        res.write('<div class="page-header text-center"><h1><span class="fa" id="title">My Polls</span></h1></div>');
        searches.forEach(function(doc) {
            //res.write('<div id="test" class="container text-center"><form action="delete' + doc._id + '" method="post"><fieldset class="form-group"><p id="poll"><a href="/polls/' + doc._id + '">' + JSON.stringify(doc.Description) + ' Total votes: ' + JSON.stringify(doc.total) + '</a></p><input id="submit" class="btn btn-danger" type="submit" value="Delete Poll"/></fieldset></form></div>');
            
            res.write('<div id="test" class="container text-center"><form action="delete' + doc._id + '" method="post"><fieldset class="form-group"><p id="poll"><a href="/polls/' + doc._id + '">' + JSON.stringify(doc.Description) + ' Total votes: ' + JSON.stringify(doc.total) + '</a></p><input id="submit" class="btn btn-danger" type="submit" value="Delete Poll"/></fieldset></form><form action="/editpoll' + doc._id + '" method="get"><fieldset class="form-group"><input id="editpoll" class="btn btn-secondary" type="submit" value="Edit Poll"/></fieldset></form></div>');
            
        }, function(err) {
                if(err) throw err;
                res.end();
        });
    });
  });
  
  app.get("/editpoll:id", isLoggedIn, function(req, res) {
      var labels = [];
      var descript = "";
      var url = req.params.id;
      var amount = 0;
      
      var ObjectID=require('mongodb').ObjectID;
      db.collection('polls').findOne({_id: ObjectID(url)},function(err,poll){
        if(err) throw err;
        if(poll != null) {
            descript = poll.Description;
            
            for(var a = 0; a < poll.Data.length; a++) {
                labels.push(poll.Data[a].label);
            }
            amount = labels.length;
            //console.log(labels);
            //console.log(descript);
            //console.log(amount);
            res.render("editpoll.ejs", {
                labels: labels,
                descript: descript,
                amount: amount,
                id: url
            });
        } else {
            res.render("editpoll.ejs", {
                labels: labels,
                descript: descript,
                amount: amount,
                id: url
            });
            console.log("ERROR loading page");
        }
    });
  });
  
  
  app.post("/editedpoll:id", isLoggedIn, function(req, res) {
      var url = req.params.id;
      var ObjectID=require('mongodb').ObjectID;
      Object.size = function(obj) {var size = 0, key; for (key in obj) if(obj.hasOwnProperty(key)) size++; return size;};
      
      
      
      
      var form = new formidable.IncomingForm();
      function parseData(fields, files, item) {
        var str = util.inspect(fields[item], {fields: fields, files: files});
        return str.replace(/(\"|\')/g, "");
      }
      form.parse(req, function (err, fields, files) {
        if(err) throw err;
        var desc = parseData(fields, files, "description");
        db.collection("polls").findOne({
            _id: ObjectID(url)
        }, function(err, poll) {
            if(err) throw err;
            if(poll != null) {
                //console.log(poll.Data[1]);
                //console.log(poll["Data." + 1 + ".value"]);
                var total = 0;
                var newData = [];
                for(var a = 0; a < Object.size(fields) - 1; a++) {
                    var currentVal = poll.Data[a];
                    newData.push({
                        value: currentVal.value,
                        label: parseData(fields, files, "option-" + (a + 1)),
                        color: currentVal.color
                    });
                    total += currentVal.value;
                    //console.log(currentVal.value);
                }
                console.log(newData);
                console.log(total);
                dataTest = newData;
                db.collection("polls").update({
                    _id: ObjectID(url)
                },{createdBy: currentUser._id.toString(), total: total, "Description": desc, "Data": newData}, function(err) {
                    if(err) throw err;
                });
            }
        });
      });
      res.redirect("/polls/" + url);
  });
  
  
  
  app.get("/makePoll", isLoggedIn, function(req, res) {
      res.render("form.ejs");
  });
  
  
  app.get('/polls', isLoggedIn, function(req,res) {//finds most popular polls and sends
    var searches = db.collection('polls').find().limit(10).sort({total:-1});
    /*
    searches.forEach(function(doc) {
            res.write("<p><a href='/polls/" + doc._id + "'>" + JSON.stringify(doc.Description) + " Total votes: " + JSON.stringify(doc.total) + "</a></p>");
        }, function(err) {
            if(err) throw err;
            res.end();
        });
    */
    fs.readFile((path.join(__dirname + '/views/poll.html')), function(err, data) {
        if (err) throw err;
        res.write(data);
        res.write('<div class="page-header text-center"><h1><span class="fa" id="title">Top 10 Polls</span></h1></div>');
        searches.forEach(function(doc) {
            res.write("<div class='container center-block'><p id='poll'><a href='/polls/" + doc._id + "'>" + JSON.stringify(doc.Description) + " Total votes: " + JSON.stringify(doc.total) + "</a></p></div><br>");
        }, function(err) {
                if(err) throw err;
                res.end();
        });
    });
  });
  app.get('/polls/:specificPoll', isLoggedIn, function(req, res) {
    var url = req.params.specificPoll;
    //console.log(url);
    currentPoll = url;
    var ObjectID=require('mongodb').ObjectID;
    db.collection('polls').findOne({_id: ObjectID(url)},function(err,poll){
        //console.log(poll.Description);
        //console.log(poll.createdBy);
        if(err) throw err;
        if(poll != null) {
            dataTest = poll.Data;
            currentDes = poll.Description;
        }
    });
    //res.sendFile((path.join(__dirname + '/views/pie.html')));
    res.render("pie.ejs", {
        url: url.toString()
    });
  });
  
  app.post("/option:num", function(req, res) {
     voteNum = req.params.num;
     //voteNum.toString();
     //console.log(voteNum);
     //console.log("voted for " + url)
     addVote(res, voteNum);
  });
  
  
  app.post("/delete:id", function(req, res) {
      function deletePoll(poll) {
        var ObjectID=require('mongodb').ObjectID;
        db.collection('polls').remove({_id: ObjectID(poll)});
      }
      deletePoll(req.params.id);
      res.redirect("/myPolls");
  });
  
  app.post("/makePoll", function(req, res) {
    processAllFieldsOfTheForm(req, res);
  });
  function savePoll(des, chart) {
    var polls = db.collection('polls');
    polls.insertOne({createdBy: currentUser._id.toString(), total: 0, "Description": des, "Data": chart}, function(err) {
      if(err) throw err;
    });
  }
  
  function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

  function processAllFieldsOfTheForm(req, res) {
      var form = new formidable.IncomingForm();
      function parseData(fields, files, item) {
        var str = util.inspect(fields[item], {fields: fields, files: files});
        return str.replace(/(\"|\')/g, "");
      }
      form.parse(req, function (err, fields, files) {
        if(err) throw err;
            Object.size = function(obj) {
                var size = 0, key;
                for (key in obj) if(obj.hasOwnProperty(key)) size++;
                return size;
            };
          var chartData = [];
          for(var b = 1; b < Object.size(fields); b++) {
              chartData.push({
                  value: 0,
                  label: parseData(fields, files, "option-" + b),
                  color: getRandomColor()
              });
          }
         
          savePoll(parseData(fields, files, "description"), chartData);
          res.redirect("/profile");
      });
  }
  
  function addVote(res, voteNum) {
      var ObjectID=require('mongodb').ObjectID;
    db.collection('polls').findOne({
        _id: ObjectID(currentPoll),
        votedBy: {$nin:  [currentUser._id]  }
    },function(err, poll) {
        if(err) throw err;
        if(poll != null) {
    db.collection('polls').update({_id: ObjectID(currentPoll)}, { $inc: { total: 1, ["Data."+ voteNum +".value"]: 1} });

      db.collection('polls').update({
          _id: ObjectID(currentPoll)
      }, { 
          $push: { votedBy: currentUser._id } 
      });
        }
    });
    res.redirect("/polls/" + currentPoll);
  }
  
  
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
        currentUser = req.user;
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

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
        res.redirect('/');
}
server.listen(port);