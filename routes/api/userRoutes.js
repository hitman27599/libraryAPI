const express = require('express');
const router = express.Router();
const {User,BookDetails,BOOK_STATUS,Book, ROLES, Library} = require('../../models/user');
const {authenticate} = require('../../auth');

// create client role user
router.post('/register/client',(req,res)=>{
    const user = new User({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password
    });
    const library = req.body.library
    user.role = ROLES.CLIENT;
    Library.findOne({name:library},(err,lib)=>{
        if(err){
            return res.status(400).send(err);
        }else{
            if(lib !== null){
                user.save().then((user)=>{
                    res.status(201).send(user);
                    Library.findOneAndUpdate({name:library},{$push:{users:user._id}},(err,lib)=>{
                        if(err){
                            return res.status(400).send("error updating library ");
                        }
                    })
                }).catch((err)=>{
                    res.status(400).send(err);
                });
            }else{
                res.status(400).send("library not present")
            }
        }
    })
});

// create librarian role user
router.post('/register/librarian',(req,res)=>{
    const user = new User(req.body);
    user.role = ROLES.LIBRARIAN;
    user.save().then((data)=>{
        res.status(201).send(data);
    }).catch((err)=>{
        res.status(400).send(err);
    });
});

// create admin role user
router.post('/register/admin',(req,res)=>{
    const user = new User(req.body);
    user.role = ROLES.ADMIN;
    user.save().then((data)=>{
        res.status(201).send(data);
    }).catch((err)=>{
        res.status(400).send(err);
    });
});

// get all users fom a library
router.get('/',(req,res)=>{
    User.find({library:req.query.library},(err,data)=>{
        if(err){
            res.status(400).send(err);
        }else{
            res.status(200).send(data);
        }
    });
});


// get single user
router.get('/user',(req,res)=>{
    const name = req.query.name;
    User.findOne({name:name},(err,data)=>{
        if(err){
            res.status(400).send(err);
        }else{
            res.status(200).send(data);
        }
    });
});

// get all clients
router.get('/clients',(req,res)=>{
    User.find({role : ROLES.CLIENT},(err,data)=>{
        if(err){
            res.status(400).send(err);
        }else{
            console.log(data);
            res.status(200).send(data);
        }
    });
});

// get all librarians
router.get('/librarians',(req,res)=>{
    User.find({role : ROLES.LIBRARIAN},(err,data)=>{
        if(err){
            res.status(400).send(err);
        }else{
            console.log(data);
            res.status(200).send(data);
        }
    });
});

// get all admin
router.get('/admin',(req,res)=>{
    User.findOne({role : ROLES.ADMIN},(err,data)=>{
        if(err){
            res.status(400).send(err);
        }else{
            console.log(data);
            res.status(200).send(data);
        }
    });
});

// delete all users
router.delete('/',(req,res)=>{
    User.deleteMany({role:{$ne:ROLES.ADMIN}},(err,data)=>{
        if(err){
            res.status(400).send(err);
        }else{
            console.log(data);
            res.status(200).send("deleted all users");
        }
    });
});

// delete single user
router.delete('/user',(req,res)=>{
    const id = req.query.id;
    User.findByIdAndDelete(id,(err,data)=>{
        if(err){
            res.status(400).send(err);
        }else{
            // console.log(data);
            res.status(200).send("deleted the user");
        }
    });
});


module.exports = router;