var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const aws = require('aws-sdk');

var app = express();

//mysql setup
var mysql = require('mysql');
var pool = mysql.createPool({
    host  : 'classmysql.engr.oregonstate.edu',
    user  : 'cs361_mackeyl',
    password: '1259',
    database: 'cs361_mackeyl',
    dateStrings: true
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var handlebars = require('express-handlebars').create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.argv[2]);

// configure the AWS region of the target bucket
aws.config.region = 'us-east-1';

// Load the S3 information from the environment variable
const S3_BUCKET = "negative-results-in-science";

//global variable to denote either logged-in or logged-out state
//we may want to move these lines to a script.js file if we end up creating one
var loggedInState = 0;

function setLoggedInState(state) {
    loggedInState = state;
}

function getLoggedInState() {
    return loggedInState;
}

//create all page routes

//create or reset the papers table
app.get('/reset_papers', function(req, res, next) {
    var context = {};

    pool.query("DROP TABLE IF EXISTS papers", function(err) {
        var createString = "CREATE TABLE papers(" +
        "id INT PRIMARY KEY AUTO_INCREMENT," +
        "title VARCHAR(255) NOT NULL," +
        "author_first VARCHAR(255) NOT NULL," +
        "author_last VARCHAR(255) NOT NULL," +
        "publication_date DATE NOT NULL," +
        "field VARCHAR(255) NOT NULL)";
        pool.query(createString, function(err) {
            //insert values into paper
            pool.query("INSERT INTO papers(`title`, `author_first`, `author_last`, `publication_date`, `field`) VALUES \
                        ('Air Pollution Not Linked to Respiratory Disease', 'Bob', 'Smith', '2017-01-22 06:14:12', 'Health Sciences'), \
                        ('Exercise Not Shown to Improve Weight Loss', 'Belinda', 'Knox', '2003-01-31 04:14:34', 'Health Sciences'), \
                        ('The Effects of Drug Decriminilization on Low-Income Neighborhoods', 'Jane', 'Lee', '2014-11-12 16:14:12', 'Social Sciences'), \
                        ('Bridge Stability in Chronic High-Wind Areas', 'Austin', 'Cross', '2018-09-02 08:58:13', 'Engineering'), \
                        ('Womb Conditions Not Shown to Impact Bacterial Infection Response', 'Alexa', 'Patel', '2005-04-04 12:54:02', 'Life Sciences')"
            , function(err, result) {
                if(err) {
                next(err);
                return;
                }
            })

            // render the login page
            context.results = "Table reset";
            context.loggedIn = getLoggedInState();
            res.render('login', context);
        });
    });
});

//create or reset the users table
app.get('/reset_users', function(req, res, next) {
    var context = {};

    pool.query("DROP TABLE IF EXISTS users", function(err) {
        var createString = "CREATE TABLE users(" +
        "id INT PRIMARY KEY AUTO_INCREMENT," +
        "first_name VARCHAR(255) NOT NULL," +
        "last_name VARCHAR(255) NOT NULL," +
        "email VARCHAR(255) NOT NULL," +
        "password VARCHAR(255) NOT NULL," +
        "type VARCHAR(255) NOT NULL)";
        pool.query(createString, function(err) {
            //insert values into paper
            pool.query("INSERT INTO users(`first_name`, `last_name`, `email`, `password`, `type`) VALUES \
                        ('Bob', 'Smith', 'bsmith@princeton.edu', 'bob123', 'user'), \
                        ('Belinda', 'Knox', 'bknox@standford.edu', 'belinda123', 'user'), \
                        ('Jane', 'Lee', 'jlee@oregonstate.edu', 'jane123', 'user'), \
                        ('Austin', 'Cross', 'across@msu.edu', 'austin123', 'user'), \
                        ('Alexa', 'Patel', 'apatel@lse.edu', 'alexa123', 'user')"
            , function(err, result) {
                if(err) {
                next(err);
                return;
                }
            })

            // render the login page
            context.results = "Table reset";
            context.loggedIn = getLoggedInState();
            res.render('login', context);
        });
    });
});

app.get('/', function(req, res, next) {
    var context = {};
    context.loggedIn = getLoggedInState();
    res.render('login', context);
});

app.get('/login', function(req, res, next) {
    var context = {};
    context.loggedIn = getLoggedInState();
    res.render('login', context);
});

app.post('/login_validate', function(req, res, next) {
    var context = {};
    pool.query("SELECT * FROM users WHERE email = ? AND password = ?", 
                [req.body.email, req.body.password], function(err, rows, fields) {
        if (err) {
            next(err);
            return;
        }
        
        context.results = rows;
        
        //if no results are returned, user doesn't exist, so tell client to display error
        if (context.results == undefined || context.results.length == 0) {
            context.error = true;
            context.loggedIn = getLoggedInState();
            res.render('login', context);
        } else {
            //otherwise set logged in state to true and render browse page
            setLoggedInState(1);
            context.loggedIn = getLoggedInState();
            context.loggedIn = getLoggedInState();
            res.render('browse', context);
        }
    });
});

app.get('/sign_up', function(req, res, next) {
    var context = {};
    context.loggedIn = getLoggedInState();
    res.render('sign_up', context);
});

app.get('/search', function(req, res, next) {
    var context = {};
    context.loggedIn = getLoggedInState();
    res.render('search', context);
});

app.post('/search_results', function(req, res, next) {
    var context = {};

    //get relevant papers to display based on search term
    pool.query("SELECT * FROM papers WHERE title = ? OR author_first = ? OR author_last = ? OR \
                YEAR(publication_date) = ? OR field = ? ORDER BY title ASC", 
                [req.body.paperTitle, req.body.firstName, req.body.lastName, req.body.publicationYear, req.body.field]
                , function(err, rows, fields) {
        if (err) {
            next(err);
            return;
        }
        //send relevant data to client
        context.loggedIn = getLoggedInState();
        context.rows = rows;
        res.render('search_results', context);
    });
});

app.get('/browse', function(req, res, next) {
    var context = {};
    context.loggedIn = getLoggedInState();
    res.render('browse', context);
});

app.post('/browse_specific', function(req, res, next) {
    var context = {};

    //get relevant papers to display
    pool.query("SELECT * FROM papers WHERE field = ? ORDER BY title ASC", [req.body.field], function(err, rows, fields) {
        if (err) {
            next(err);
            return;
        }
        //send relevant data to client
        context.loggedIn = getLoggedInState();
        context.rows = rows;
        res.render('browse_specific', context);
    });
});

app.get('/browse_all', function(req, res, next) {
    var context = {};
    
    //get relevant papers to display
    pool.query("SELECT * FROM papers ORDER BY title ASC", function(err, rows, fields) {
        if (err) {
            next(err);
            return;
        }
        //send relevant data to client
        context.loggedIn = getLoggedInState();
        context.rows = rows;
        res.render('browse_all', context);
    });
});

app.get('/logout', function(req, res, next) {
    var context = {};
    setLoggedInState(0);
    context.loggedIn = getLoggedInState();
    res.render('logout', context);
});

app.get('/upload-paper', function(req, res, next){
    var context = {};
    context.loggedIn = getLoggedInState();
    res.render('upload_paper', context);
 });

app.get('/upload-paper-s3', (req, res) => {
    const s3 = new aws.S3();
    const fileName = req.query['file-name'];
    const fileType = req.query['file-type'];
    const s3Params = {
        Bucket: S3_BUCKET,
        Key: fileName,
        Expires: 60,
        ContentType: fileType,
        ACL: 'public-read'
    };

    s3.getSignedUrl('putObject', s3Params, (err, data) => {
        if (err){
            console.log(err);
            return res.end();
        }
        const returnData = {
            signedRequest: data,
            url: 'https://${S3_BUCKET}.s3.amazonaws.com/${fileName}'
        };
        res.write(JSON.stringify(returnData));
        res.end();
    });
});

app.post('/save_details', (req, res) => {
    var context = {};
    context.loggedIn = getLoggedInState();
    res.render('save_details', context);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

app.listen(app.get('port'), function() {
    console.log('Express started on localhost:' + app.get('port') + '/');
});

