require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('./models/connection');

var usersRouter = require('./routes/users');
var productsRouter = require('./routes/products');
var advicesRouter = require('./routes/advices');
var rappelConsoRouter = require('./routes/rappelconso'); 
var quickconsoRouter = require('./routes/quickconso');
var recipesRouter = require('./routes/recipes');
var inventaireRouter = require('./routes/inventaire');

var app = express();

const cors = require('cors');
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);
app.use('/products', productsRouter);
app.use('/advices', advicesRouter);
app.use('/rappels', rappelConsoRouter);
app.use('/quickconso', quickconsoRouter);
app.use('/recipes', recipesRouter);
app.use('/inventaire', inventaireRouter);


module.exports = app;
