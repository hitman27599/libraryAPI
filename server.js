const express = require('express');
const app = express();
const dotenv =require('dotenv').config();
const Axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('./db/db');
const {authenticate,authAdmin,authLibrarian} = require('./auth');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookie = require('cookie-session');
const userRoutes = require('./routes/api/userRoutes');
const bookDetailRoutes = require('./routes/api/bookDetailsRoutes');
const bookRoutes = require('./routes/api/bookRoutes');
const libraryRoutes = require('./routes/api/libraryRoutes');
const ledgerRoutes = require('./routes/api/ledgerRoutes');
const { application } = require('express');
const { json } = require('body-parser');
const cookieSession = require('cookie-session');
const { User,Library,ROLES } = require('./models/user');


const PORT = process.env.PORT || 8000;
app.use(cors({ origin: true, credentials: true }));
app.use(cookieSession({
    secret:process.env.COOKIE_SECRET,
}));
app.use(express.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use('/api/users',userRoutes);
app.use('/api/bookdetails',bookDetailRoutes);
app.use('/api/books',bookRoutes);
app.use('/api/libraries',libraryRoutes);
app.use('/api/ledger',ledgerRoutes);

app.get('/',(req,res)=>{
    res.send('hello');
})



app.post('/register',(req,res)=>{
    const user = new User({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        role:ROLES.CLIENT,
        library:req.body.library
    });
    const library = req.body.library
    Library.findOne({name:library},(err,lib)=>{
        if(err){
            return res.status(400).send(err);
        }else{
            if(lib !== null){
                user.save().then((user)=>{
                    res.status(201).send("user created");
                    Library.findByIdAndUpdate(lib._id,{$push:{users:user._id}},(err,lib)=>{
                        if(err){
                            return res.status(400).send(err);
                        }
                    })
                }).catch((err)=>{
                    return res.status(400).send(err);
                });
            }else{
                return res.status(400).send("library not present")
            }
        }
    });
})
app.get('/loginpage',(req,res)=>{
    // res.render('views/login');
})
app.post('/login',(req,res)=>{
    const name = req.body.name;
    const password = req.body.password;

    User.findOne({name:name},(err,user)=>{
        if(err){
            return res.status(400).send(err);
        }else{
            if(user === null){
                return res.status(400).send("user not found");
            }
            // check password
            if(user.password == password){
                const token = jwt.sign(user.toJSON(),process.env.ACCESS_JWT_KEY);
                req.headers.authorization = "Bearer " + token;
                cookieSession.user = user;
                cookieSession.token = token;
                // res.redirect('/home');
                res.status(200).send({token:token});
            }else{
                return res.status(200).send("password incorrect");
            }
        }
    })



});

app.get('/home',authenticate,(req,res)=>{
    res.send("home");
});
app.get('/home1',authenticate,authAdmin,(req,res)=>{
    res.send("home1");
});

app.get('/logout',(req,res)=>{
    req.session = null;
    res.redirect('/');
});


app.listen(PORT,(req,res)=>{
    console.log(`server connected on port ${PORT}`);
});