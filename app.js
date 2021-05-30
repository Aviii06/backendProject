const express=require('express');
const app=express();
let cookieParser = require('cookie-parser');
let session = require('express-session');
app.set('view engine', 'ejs');
//Auth call
const authUser=require('./Auth');

//Body parser
app.use(express.json());
app.use(express.urlencoded({extended:true}));

//Static forlder for CSS
app.use(express.static('public'));

//Renderin
app.use('/',require('./user'));


const PORT=process.env.PORT || 5000;
app.listen(PORT,() => 
console.log(`server started at ${PORT}`));

//post requests


app.use(express.json());
app.use(express.urlencoded({extended:false}))


