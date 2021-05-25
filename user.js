const express=require('express');
const path=require('path');
const app=express();
const db=require('./database');
const router=express.Router();
router.get('/',(req,res)=> res.json(members));
router.get('/:email',(req,res)=>{
    const found = members.some(member=> member.email === req.params.email);
    if(found){
      res.json(req.body.email);
    }else{
      res.status(400).json({msg:'No member found'});
    }
  });

router.post('/user',(req,res)=>{
      let email= req.body.email;
      let name= req.body.uname;
      var crypto = require('crypto');
      let password= req.body.password;
      const hash = crypto.createHash('sha256').update(password).digest('base64');
      let passwordC= req.body.passwordC;

    if(email && name &&(password==passwordC))
    {
      db.query('INSERT INTO USERS VALUES(\''+name+'\',\''+email+'\',\''+hash+'\');');
      res.send("Added");
    }
    else if(password!=passwordC){
      res.send("Passwords didn't match");
    }
    else{
      res.send("Can't leave passwords empty");
    }
});
module.exports=router;