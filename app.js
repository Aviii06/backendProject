const express=require('express');
const path=require('path');
const app=express();
const router=express.Router();
app.set('view engine', 'html');
//Body parser
const mysql = require('mysql');
const db=require('./database');
app.use(express.json());
app.use(express.urlencoded({extended:false}));

//Rendering
app.get('/',(req,res)=> {
    res.sendFile(`Static/index.html`,{root:__dirname});
});
app.get('/register',(req,res)=> {
  res.sendFile(`Static/register.html`,{root:__dirname});
});
app.get('/main',(req,res)=> {
  res.sendFile(`Static/main.html`,{root:__dirname});
});
app.use('/',require('./user'));

const PORT=process.env.PORT || 5000;

app.listen(PORT,() => 
console.log(`server started at ${PORT}`));

//post requests


app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.post('/',(req,res)=>{
  let password= req.body.password;
  var crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(password).digest('base64');
  db.query('select password from users where email_id ="'+req.body.email+'";',(error,result,fields)=>{
      console.log(result);
  });
  res.sendFile(`Static/main.html`,{root:__dirname});
});


// sha256
