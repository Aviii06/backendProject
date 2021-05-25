const mysql=require('mysql');
module.exports=mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "ThisMypassword_1",
    database: "project",
  });