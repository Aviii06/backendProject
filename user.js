const express = require('express');
const app = express();
const db = require('./database');
let session = require('express-session');
let cookieParser = require('cookie-parser');
db.connect();
const router = express.Router();
router.use(cookieParser());
router.use(session({ secret: "Shh, its a secret!" }));
const authUser = require('./Auth');
const { EDESTADDRREQ, ESRCH } = require('constants');

app.use(session({
  secret: 'Your_Secret_Key',
  resave: true,
  saveUninitialized: true
}));

//Landing Page
router.get('/', (req, res) => {
  db.query(`select * from book`,(err,result,fields)=>{
    res.render(`index`,{result:result});
  });
});

//Registering
router.post('/register', (req, res) => {
  let email = req.body.email;
  let name = req.body.uname;
  let password = req.body.password;
  var crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(password).digest('base64');
  let passwordC = req.body.passwordC;
  db.query("select * from users where email_id = " + db.escape(email) + " or uname = " + db.escape(name) + ";",
    (error, result, field) => {
      if (result[0] === undefined) {
        if (email && name && (password == passwordC)) {
          db.query("INSERT INTO USERS VALUES(" + db.escape(name) + "," + db.escape(email) + ",'" + hash + "','user');");
          res.render(`index`, { root: __dirname });
        }
        else if (password != passwordC) {
          res.send("Passwords didn't match");
        }
        else {
          res.send("Can't leave passwords empty");
        }
      }
      else {
        res.send("Username or email is not unique");
      }
    });
});
router.get('/register', (req, res) => {
  res.render(`register`, { root: __dirname });
});


//Login page
router.post('/login', (req, res, next) => {
  db.query('select * from users where uname =' + db.escape(req.body.name) + ';',
    (error, result, fields) => {
      let crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(req.body.password).digest('base64');
      if (error) {
        return res.redirect('/');
      }
      else {
        if (result[0] === undefined) {
          req.session.log = false;
          return res.redirect('/');
        }
        else {
          if (result[0].password != hash) {
            req.session.log = false;
            return res.redirect('/');
          }
          else {
            req.session.name = db.escape(req.body.name);
            req.session.log = true;
            if (result[0].role === "admin" && result[0].password === hash) {
              req.session.admin = true;
              req.session.name = req.body.name;
              req.session.log = true;
              return res.redirect('admin');
            }
            else {
              next();
            }
          }
        }
      }
    });
}
  , (req, res) => {
    req.session.admin = false;
    res.redirect('/main');
  });
router.get('/login', (req, res, next) => {
  if (req.session.log === true) {
    next();
  }
  else {
    return res.render('login');
  }
}, (req, res) => {
  res.redirect('/main');
});


//Main page or dashboard
router.get('/main', (req, res) => {
  if (req.session.log === true) {
    db.query(`select book.book_id,book.book_name,book.capacity from book join issue on issue.book_id=book.book_id where issue.uname='${req.session.name}' and issue.status='remind'`,
    (error,result,fields)=>{
      if (req.session.admin === true) {
        return res.render('main', { user: 'admin' ,result:result});
      }
    res.render('main', { user: 'user' ,result:result});
    }
  );
}
  else {
    res.redirect('login');
  }
});
router.post('/main', (req, res) => {
  if (req.session.log === true) {
    db.query(`select book.book_id,book.book_name,book.capacity from book join issue on issue.book_id=book.book_id where issue.uname=${req.session.name} and issue.status='remind'`,
    (error,result,fields)=>{
      if (req.session.admin === true) {
        return res.render('main', { user: 'admin' ,result:result});
      }
    res.render('main', { user: 'user' ,result:result});
    }
  );
}
  else {
    res.redirect('login');
  }
});


//Issuing book by users
router.post('/issueBooks', (req, res) => {
  if (req.session.log === true) {
    db.query(`select book.book_id,book.book_name,book.capacity from book join issue on issue.book_id=book.book_id where issue.uname=${req.session.name};`,
      (error, result, fields) => {
        if (error) {
          res.status(400);
        }
        db.query(`select * from book`, (err, comResult,fel) => {
          let newResult = [];
          let flag=false;
          for(let i in  comResult)
          {
            for(let j in result)
            {
              if(comResult[i].book_id === result[j].book_id)
              {
                flag=true;
                break;
              }
            }
            if(flag===false)
            {
              newResult.push(comResult[i]);
            }
            flag=false;
          }
          if (req.session.admin === true) {
            return res.render('issueBooks', { user: 'admin', result: newResult });
          }
          res.render('issueBooks', { user: 'user', result: newResult });
        });
      });
  }
  else {
    res.render('login');
  }
});
router.get('/issueBooks', (req, res) => {
  if (req.session.log === true) {
    db.query(`select book.book_id,book.book_name,book.capacity from book join issue on issue.book_id=book.book_id where issue.uname='${req.session.name}';`,
      (error, result, fields) => {
        if (error) {
          res.status(400);
        }
        db.query(`select * from book where capacity>0`, (err, comResult,fel) => {
          let newResult = [];
          let flag=false;
          for(let i in  comResult)
          {
            for(let j in result)
            {
              if(comResult[i].book_id === result[j].book_id)
              {
                flag=true;
                break;
              }
            }
            if(flag===false)
            {
              newResult.push(comResult[i]);
            }
            flag=false;
          }
          if (req.session.admin === true) {
            return res.render('issueBooks', { user: 'admin', result: newResult });
          }
          res.render('issueBooks', { user: 'user', result: newResult });
        });
      });
  }
  else {
    res.redirect('login');
  }
});

//Post request ot issue books
router.post('/issue', (req, res, next) => {
  if (req.session.log === true) {
    next();
  }
  else {  
    res.render('login');
  }
}, (req, res, next) => {
  db.query(`select * from issue where book_id=${db.escape(req.query.bookId)} and uname=${db.escape(req.session.name)};`, (error, result, fields) => {
    if (result[0] === undefined) {
      db.query("INSERT INTO issue VALUES(" + db.escape(req.query.bookId) + "," + db.escape(req.session.name) + ",'pending');");
      if (req.session.log === true) {
        db.query(`select book.book_id,book.book_name,book.capacity from book join issue on issue.book_id=book.book_id where issue.uname=${db.escape(req.session.name)};`,
          (error, result, fields) => {
            if (error) {
              res.status(400);
            }
            db.query(`select * from book`, (err, comResult,fel) => {
              let newResult = [];
              let flag=false;
              for(let i in  comResult)
              {
                for(let j in result)
                {
                  if(comResult[i].book_id === result[j].book_id)
                  {
                    flag=true;
                    break;
                  }
                }
                if(flag===false)
                {
                  newResult.push(comResult[i]);
                }
                flag=false;
              }
              if (req.session.admin === true) {
                return res.render('issueBooks', { user: 'admin', result: newResult });
              }
              res.render('issueBooks', { user: 'user', result: newResult });
            });
          });
      }
      else {
        res.render('login');
      }
    }
  }
);
}
);

//Admin's main page
router.get('/admin', (req, res, next) => {
  if (req.session.admin === true) {
    next();
  }
  else
    return res.redirect('login');
}, (req, res) => {
  res.render('admin', { title: 'Hey', message: 'Hello there!' });
});

router.post('/admin', (req, res, next) => {
  if (req.session.admin === true)
    next();
  else
    return res.redirect('login');
}, (req, res) => {
  res.render('admin');
});

//Admin's add books page
router.post('/addBooks', (req, res) => {
  if (req.session.admin === true)
    res.render('addBooks');
  else {
    res.status(403);
    res.send(`Not Admin <input type='submit' onclick='location.href="/login";' value='login'/>`);
  }
});
router.get('/addBooks', (req, res) => {
  if (req.session.admin === true)
    res.render('addBooks');
  else {
    res.status(403);
    res.send(`Not Admin <input type='submit' onclick='location.href="/login";' value='login'/>`);
  }
});


//Post request to add books
router.post('/adding', (req, res, next) => {
  if (req.session.admin === true)
    next();
  else {
    return res.redirect('login');
  }
},
  (req, res) => {
    db.query(`select * from book where book_id=${db.escape(req.body.book_id)}`,
      (error, result, fields) => {
        if (result[0] === undefined) {
          db.query(`insert into book values (${db.escape(req.body.book_id)},${db.escape(req.body.book_name)},${db.escape(req.body.capacity)});`);
          res.redirect('admin');
        }
        else {
          res.send('The Book Id already Exist');
        }
      })
  });

//Admin's page to see the requested books
router.post('/requestedBooks', (req, res, next) => {
  if (req.session.admin === true)
    next();
  else {
    return res.redirect('login');
  }
},
  (req, res) => {
    db.query(`select i.book_id,i.uname,i.status,b.book_name,b.capacity from issue as i left join book as b on b.book_id=i.book_id`,
      (error, result, fields) => {
        let newResult = [];
        for (let i in result) {
          if (result[i].status === 'pending')
            newResult.push(result[i]);
        }
        if (req.session.admin === true) {
          return res.render('acceptBooks', { user: 'admin', result: newResult });
        }
        res.render('acceptBooks', { user: 'user', result: newResult });
      });
  });
router.get('/requestedBooks', (req, res, next) => {
  if (req.session.admin === true)
    next();
  else {
    return res.redirect('login');
  }
},
  (req, res) => {
    db.query(`select i.book_id,i.uname,i.status,b.book_name,b.capacity from issue as i left join book as b on b.book_id=i.book_id;`,
      (error, result, fields) => {
        let newResult = [];
        for (let i in result) {
          if (result[i].status === 'pending')
            newResult.push(result[i]);
        }
        if (req.session.admin === true) {
          return res.render('acceptBooks', { user: 'admin', result: newResult });
        }
        res.render('acceptBooks', { user: 'user', result: newResult });
      });
  });


//Post to accept the requested books
router.post('/accept', (req, res, next) => {
  if (req.session.admin === true && req.session.log === true) {
    next();
  }
  else {
    return res.redirect('login');
  }
},
  (req, res) => {
    db.query(`update issue  set status='taken' where book_id=${db.escape(req.query.bookId)} and uname='${req.query.userName}'`);
    db.query(`select * from book where book_id=${db.escape(req.query.bookId)}`, (error, result, feilds) => {
      db.query(`update book set capacity=${result[0].capacity - 1} where book_id=${db.escape(req.query.bookId)}`);
    })
    res.redirect('/requestedBooks');
  });
router.post('/reject', (req, res, next) => {
    if (req.session.admin === true) {
      next();
    }
    else {
      return res.redirect('login');
    }
  },
    (req, res) => {
      db.query(`delete from issue where book_id=${db.escape(req.query.bookId)} and uname=${db.escape(req.query.userName)}`);
      res.redirect('/requestedBooks');
    });
  

//User's return books page
router.post('/returnBooks', (req, res) => {
  db.query(`select i.book_id,i.uname,i.status,b.book_name,b.capacity from issue as i left join book as b on b.book_id=i.book_id`,
    (error, result, fields) => {
      let newResult = [];
      for (let i in result) {
        if (result[i].uname === req.session.name && (result[i].status === 'taken' || result[i].status === 'remind')) {
          newResult.push(result[i]);
        }
      }
      if (req.session.admin === true) {
        return res.render('returnBooks', { user: 'admin', result: newResult });
      }
      res.render('returnBooks', { user: 'user', result: newResult });
    });
});
router.get('/returnBooks', (req, res) => {
  db.query(`select i.book_id,i.uname,i.status,b.book_name,b.capacity from issue as i left join book as b on b.book_id=i.book_id`,
    (error, result, fields) => {
      let newResult = [];
      for (let i in result) {
        if (result[i].uname === req.session.name && (result[i].status === 'taken' || result[i].status === 'remind')) {
          newResult.push(result[i]);
        }
      }
      if (req.session.admin === true) {
        return res.render('returnBooks', { user: 'admin', result: newResult });
      }
      res.render('returnBooks', { user: 'user', result: newResult });
    });
});

//Return post request
router.post('/userReturn', (req, res, next) => {
  if (req.session.log === true) {
    next();
  }
  else {
    res.render('login');
  }
}, (req, res, next) => {
  if (req.session.log === true) {
    db.query(`update issue set status ='returned' where uname=${db.escape(req.session.name)} and book_id=${db.escape(req.query.bookId)};`,
      (error, result, fields) => {
        if (error) {
          return res.status(400);
        }
      });
      db.query(`select i.book_id,i.uname,i.status,b.book_name,b.capacity from issue as i left join book as b on b.book_id=i.book_id`,
      (error, result, fields) => {
        let newResult = [];
        for (let i in result) {
          if (result[i].uname === req.session.name && result[i].status === 'taken') {
            newResult.push(result[i]);
          }
        }
        if (req.session.admin === true) {
          return res.render('returnBooks', { user: 'admin', result: newResult });
        }
        res.render('returnBooks', { user: 'user', result: newResult });
      });
  }
  else {
    return res.redirect('login');
  }
});


//Admins page to see the returned books
router.post('/returnedBooks', (req, res, next) => {
  if (req.session.admin === true)
    next();
  else {
    return res.redirect('login');
  }
},
  (req, res) => {
    db.query(`select i.book_id,i.uname,b.book_name,b.capacity,i.status from issue as i left join book as b on b.book_id=i.book_id`,
      (error, result, fields) => {
        let newResult = [];
        for (let i in result) {
          if (result[i].status === 'returned') {
            newResult.push(result[i]);
          }
        }
        if (req.session.admin === true) {
          return res.render('confirmReturns', { user: 'admin', result: newResult });
        }
        res.render('confirmReturns', { user: 'user', result: newResult });
      });
  });
router.get('/returnedBooks', (req, res, next) => {
  if (req.session.admin === true)
    next();
  else {
    return res.redirect('login');
  }
},
  (req, res) => {
    db.query(`select i.book_id,i.uname,b.book_name,b.capacity,i.status from issue as i left join book as b on b.book_id=i.book_id`,
      (error, result, fields) => {
        let newResult = [];
        for (let i in result) {
          if (result[i].status === 'returned') {
            newResult.push(result[i]);
          }
        }
        if (req.session.admin === true) {
          return res.render('confirmReturns', { user: 'admin', result: newResult });
        }
        res.render('confirmReturns', { user: 'user', result: newResult });
      });
  });

//Post request for the returned books
router.post('/returned', (req, res, next) => {
  if (req.session.admin === true && req.session.log === true) {
    next();
  }
  else {
    return res.redirect('login');
  }
},
  (req, res) => {
    db.query(`delete from issue where book_id=${db.escape(req.query.bookId)} and uname='${req.query.userName}'`);
    db.query(`select * from book where book_id=${db.escape(req.query.bookId)}`, (error, result, feilds) => {
      db.query(`update book set capacity=${result[0].capacity + 1} where book_id=${db.escape(req.query.bookId)}`);
    })
    res.redirect('/returnedBooks');
  });

//Taken
router.get('/taken', (req, res, next) => {
  if (req.session.admin === true) {
    next();
  }
  else
    return res.redirect('login');
}, (req, res) => {
  db.query(`select i.book_id,i.uname,b.book_name,b.capacity,i.status from issue as i left join book as b on b.book_id=i.book_id`,
      (error, result, fields) => {
        let newResult = [];
        for (let i in result) {
          if (result[i].status === 'taken' ) {
            newResult.push(result[i]);
          }
        }
        if (req.session.admin === true) {
          return res.render('taken', { user: 'admin', result: newResult });
        }
        res.render('taken', { user: 'user', result: newResult });
      });
});

router.post('/taken', (req, res, next) => {
  if (req.session.admin === true) {
    next();
  }
  else
    return res.redirect('login');
}, (req, res) => {
  db.query(`select i.book_id,i.uname,b.book_name,b.capacity,i.status from issue as i left join book as b on b.book_id=i.book_id`,
      (error, result, fields) => {
        let newResult = [];
        for (let i in result) {
          if (result[i].status === 'taken'  ) {
            newResult.push(result[i]);
          }
        }
        if (req.session.admin === true) {
          return res.render('taken', { user: 'admin', result: newResult });
        }
        res.render('taken', { user: 'user', result: newResult });
      });
});

//Reminders
router.post('/remind',(req,res,next)=>{
  if(req.session.log===true)
  {
    next();
  }
  else{
    res.redirect('/');  
}
},
(req,res)=>{
  db.query(`update issue set status='remind' where uname='${req.query.userName}' and book_id=${db.escape(req.query.bookId)}`);
  res.redirect('/taken');
});
router.get('/remind',(req,res,next)=>{
  if(req.session.log===true)
  {
    next();
  }
  else{
    res.redirect('/');  
}
},
(req,res)=>{
  db.query(`update issue set status='remind' where uname='${req.query.userName}' and book_id=${db.escape(req.query.bookId)}`);
  res.redirect('/taken');
});

//Logout request
router.get('/logout', (req, res) => {
  req.session.user = [];
  req.session.log = false;
  req.session.admin = false;
  res.redirect('/');
});

module.exports = router;