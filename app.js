var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

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


//create all page routes

//create or reset the papers table
app.get('/reset', function(req, res, next) {
    var myContext = {};

    pool.query("DROP TABLE IF EXISTS papers", function(err) {
        var createString = "CREATE TABLE papers(" +
        "id INT PRIMARY KEY AUTO_INCREMENT," +
        "title VARCHAR(255) NOT NULL," +
        "author_first VARCHAR(255) NOT NULL," +
        "author_last VARCHAR(255) NOT NULL," +
        "publication_date DATE NOT NULL," +
        "field VARCHAR(255) NOT NULL)";
        pool.query(createString, function(err) {
            myContext.results = "Table reset";
            // render the login page
            res.render('login', myContext);
        });
    });
});

app.get('/', function(req, res, next){
    var context ={};
    res.render('login', context);
 });


app.get('/login', function(req, res, next){
    var context ={};
    res.render('login', context);
 });

app.get('/sign_up', function(req, res, next){
    var context ={};
    res.render('sign_up', context);
 });


app.get('/search', function(req, res, next){
    var context ={};
    res.render('search', context);
 });


app.get('/browse', function(req, res, next){
    var context ={};
    res.render('browse', context);
 });

app.get('/logout', function(req, res, next){
    var context ={};
    res.render('logout', context);
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

app.listen(app.get('port'), function(){
    console.log('Express started on localhost:' + app.get('port') + '/');
});

