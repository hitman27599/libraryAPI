const express = require('express');
const mongoose= require('mongoose');
const router = express.Router();
const {User,BookDetails,BOOK_STATUS,Book, ROLES,Library} = require('../../models/user');
const {authenticate,authAdmin} = require('../../auth');

// add library api and librarian
// ADMIN
router.post('/add',async(req,res)=>{
    const checkUser = await User.findOne({name:req.body.name});
    if(checkUser !== null){
        return res.status(400).send("user already exists");
    }
    const checkLibrary = await Library.findOne({name:req.body.library});
    if(checkLibrary !== null){
        return res.status(400).send("library already exists");
    }
    const newUser = new User({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        library:req.body.library,
        role : ROLES.LIBRARIAN
    });

    const user = await newUser.save();
    const newLibrary = new Library({
        name:req.body.library,
        manager:user._id
    });
    const library = await newLibrary.save();
    res.status(200).send("library created");
    
});
// Query book from a library
// LIBRARIAN
router.post('/books',async(req,res)=>{
    const library = req.body.library;
    const bookname = req.body.bookname;

    Book.find({name:bookname,library:library},(err,book)=>{
        if(err){
            res.status(400).send(err);
        }else{
            // console.log(book);
            // console.log(book[0]._id);
            Library.findOneAndUpdate({name:library},{$push :{books:book[0]._id}},(err,lib)=>{
                if(err){
                    res.status(400).send(err);
                }else{
                    res.status(200).send("book added");
                }
            })
        }
    });
    
});


//add user to library api
router.post('/users',async(req,res)=>{
    const library = req.body.library;
    const username = req.body.username;
    var id;
    User.find({name:username},(err,user)=>{
        if(err){
            res.status(400).send(err);
        }else{
            // console.log(book);
            // console.log(book[0]._id);
            Library.findOneAndUpdate({name:library},{$push :{users:user[0]._id}},(err,lib)=>{
                if(err){
                    res.status(400).send(err);
                }else{
                    res.status(200).send("user added");
                }
            })
        }
    })
    
});

// delete all values of library
router.delete('/',async(req,res)=>{

    Library.deleteMany({},(err)=>{
        if(err){
            res.status(400).send(err);
        }else{
            res.status(200).send("all libraries deleted");
        }
    })
});

// delete single library
router.delete('/:library',(req,res)=>{
    const library = req.params.library;
    Library.deleteOne({name:library},(err)=>{
        if(err){
            res.status(400).send(err);
        }else{
            res.status(200).send("library deleted");
        }
    })
})

// get  all values of library
router.get('/',async(req,res)=>{
    const libraries = await Library.find().populate("manager").populate("books").populate("users");
    res.json(libraries);
});

// update manager for library
// ADMIN 
router.put('/updatemanager',async(req,res)=>{

    const lib = await Library.findOne({name:req.body.library},{manager:1}).populate("manager");
    // console.log(lib);
    if(lib === null){
        return res.status(400).send("library not found");
    }
    const checkUser = await User.findOne({name:req.body.name});
    if(checkUser !== null){
        return res.status(400).send("user already exists");
    }
    // console.log(manager.manager._id);
    const oldManager = await User.findByIdAndUpdate(lib.manager._id,{role:ROLES.INACTIVE},{new:true});
    // console.log(oldManager);
    const newUser = new User({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        library:req.body.library,
        role : ROLES.LIBRARIAN
    });

    const user = await newUser.save();
    const library = await Library.findByIdAndUpdate(lib._id,{manager:user._id},{new:true});
    res.status(200).send("libaraian updated");
});

// QUERY Books in a library 
router.get('/books',(req,res)=>{
    const library = req.body.library;
    const books = [];
    Library.findOne({name:library},(err,libArray)=>{
        if(err){
            res.status(400).send(err);
        }else{
            if(libArray !==null){
                libArray.books.forEach((book)=>{
                    Book.findById(book,(err,data)=>{
                        books.push(data);
                    })
                })
            }else{
                res.status(200).send("no books");
            }
        }
    });
    res.json(books);
});

router.get('/users',async(req,res)=>{
    const users = await Library.find({name:req.body.library},"users").populate("users");
    res.status(400).send(users);
})



module.exports = router;