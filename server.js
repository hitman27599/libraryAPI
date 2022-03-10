const express = require('express');
const app = express();
const dotenv =require('dotenv').config();
const Axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('./db/db');
const {authenticate,authAdmin,authLibrarian} = require('./auth');
const bodyParser = require('body-parser');
const cors = require('cors');
const formidable = require('formidable');
const crypto = require('crypto');
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const path = require('path');
const {v4 : uuidv4} = require('uuid');
const zlib = require('zlib');
const fs = require('fs');
const { Readable } = require('stream');
const AdmZip = require("adm-zip");
const streamifier = require('streamifier');
const { createEncryptStream, createDecryptStream, setPassword } = require('aes-encrypt-stream');
var archiver = require('archiver');
// const cookie = require('cookie-session');
const userRoutes = require('./routes/api/userRoutes');
const bookDetailRoutes = require('./routes/api/bookDetailsRoutes');
const bookRoutes = require('./routes/api/bookRoutes');
const libraryRoutes = require('./routes/api/libraryRoutes');
const ledgerRoutes = require('./routes/api/ledgerRoutes');
const { application } = require('express');
const { json } = require('body-parser');
const cookieSession = require('cookie-session');
const { User,Library,ROLES } = require('./models/user');


const algorithm = "aes-256-cbc";
const initVector = crypto.randomBytes(16);
const Securitykey = crypto.randomBytes(32);
const PORT = process.env.PORT || 8000;
app.use(cors({ origin: true, credentials: true }));

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



cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "DEV",
      public_id:(req,file)=>{
          return uuidv4();
      }
    },
});

const upload = multer({ storage: storage });
const upload1 = multer.memoryStorage();

app.post('/home',upload.array('file'),(req,res)=>{
    console.log(req.files);
    // cloudinary.v2.uploader.upload(req.files.file,(err,result)=>{
    //     console.log(result);
    // });
    // res.send(req.files);
});
app.post('/home1',async(req,res)=>{
    cloudinary.uploader.destroy("DEV");
    res.json("success");
});



app.post('/compress',multer().single('file'),async(req,res)=>{
    // res.send(req.files);
    console.log(req.file);
    var zip = zlib.createGzip();
    var write = fs.createWriteStream('uploads/new.pdf.gz');
    // const read = Readable.from(req.file.buffer.toString());
    // streamifier.createReadStream(req.file.buffer).pipe(zip).pipe(write);
    // read.pipe(zip).pipe(write);

    archiver.registerFormat('zip-encryptable', require('archiver-zip-encryptable'));
    var archive = archiver('zip-encryptable', {
        zlib: { level: 9 },
        forceLocalTime: true,
        password: 'test'
    });

    var read = streamifier.createReadStream(req.file.buffer).pipe(zip);
    archive.pipe(write);

    archive.append(read,{name:"atomicHabits.pdf"});

    archive.finalize();

    res.send("success");
});

app.get('/logout',(req,res)=>{
    req.session = null;
    res.redirect('/');
});


app.listen(PORT,(req,res)=>{
    console.log(`server connected on port ${PORT}`);
});