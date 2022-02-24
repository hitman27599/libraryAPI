const cookieSession = require('cookie-session');
const jwt = require('jsonwebtoken');
const { ROLES } = require('./models/user');

const authenticate = (req,res,next)=>{
    // console.log(cookieSession.user);
    // console.log(cookieSession.token);

    
    // const authHeader = req.headers['authorization'];
    // const token = authHeader && authHeader.split(' ')[1];
    const token = cookieSession.token;
    if(token == null){
        return res.status(400).send("user not authenticated");
    }
    jwt.verify(token,process.env.ACCESS_JWT_KEY,(err,user)=>{
        if(err) return res.status(403).send("token tampered");
        req.user = user;
        next();
    })
}


function authAdmin(req,res,next){
    const user = cookieSession.user;
    if(user.role !== ROLES.ADMIN ){
        return res.status(403).send("forbidden");
    }
    next();

}

function authLibrarian(req,res,next){

    if(req.user.role !== ROLES.LIBRARIAN ){
        return res.status(403).send("forbidden");
    }
    next();
}

module.exports = {authenticate,authAdmin,authLibrarian};