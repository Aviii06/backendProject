module.exports=(req,res,next)=>{
    if(req.session.user === null){
        console.log(req.user);
        res.status(403);
        return res.sendFile(`Static/index.pug`,{root:__dirname});
    }
    next();
};

