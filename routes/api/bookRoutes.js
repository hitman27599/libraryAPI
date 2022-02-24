const express = require('express');
const mongoose= require('mongoose');
const { authenticate } = require('../../auth');
const router = express.Router();
const {User,BookDetails,BOOK_STATUS,Book, Library, Ledger, ROLES} = require('../../models/user');



// add a single book api
// LIBRARIAN
router.post('/add',async(req,res)=>{
    const bookdetailsName= req.body.bookName;
    const bookDetails = await BookDetails.findOne({name:bookdetailsName});
    if(bookDetails === null){
        return res.status(400).send("book details not found");
    }
    const librarian = await User.findOne({name:req.body.librarian,library:req.body.library,role:ROLES.LIBRARIAN});
    if(librarian === null){
        return res.status(400).send("not authorised");
    }
    // const library = await Library.findOne({library:req.body.library,manager:librarian._id});
    // if(library === null){
    //     return res.status(400).send("manager/library incorrect");
    // }
    const newBook = new Book({
        bookDetails:bookDetails._id,
        name:req.body.bookName,
        library:req.body.library,
        status:BOOK_STATUS.AVAILABLE,
    });
    const book = await newBook.save();
    const library1 = await Library.findOneAndUpdate({name:req.body.library},{$push:{books:book._id}});
    res.status(200).send("book added to library");
   
})

// get all books
router.get('/',async(req,res)=>{
    const books = await Book.find().populate("bookDetails");
    res.json(books);
});

//CLIENT get books from a particular library
router.get('/clientget',async(req,res)=>{
    const username = req.query.username;
    const library = req.query.library;
    const user = await User.findOne({name:username});
    if(user!== null){
        const lib = await Library.findOne({name:library,users:user._id},{_id:0});
        if(lib!==null){
            const books = await Book.find({library:library,status:{ $ne: BOOK_STATUS.LENT }});
            // console.log(books);
            books.forEach((book)=>{
                if(book.status !== BOOK_STATUS.AVAILABLE){
                    book.status = BOOK_STATUS.LENT
                }
            });
            res.status(200).send(books);
        }else{
            return res.status(400).send("not authorized");
        }
    }else{
        return res.status(400).send("user not found");
    }
    
});

//LIBRARIAN get books from a particular library
router.get('/librarianget',async(req,res)=>{
    const library = req.query.library;
    const manager = req.query.manager;
    console.log(manager);
    console.log(library);

    const user = await User.findOne({name:manager,library:library,role:ROLES.LIBRARIAN});
    if(user === null){
        return res.status(400).send("manager not found");
    }
    const books = await Book.find({library:library,status:{$ne: BOOK_STATUS.LENT}});
    if(books === null){
        return res.status(200).send([]);
    }
    res.status(200).send(books);
    
    
});

//ADMIIN get books from a all library
router.get('/adminget',async(req,res)=>{
    var data=[];
    const library = await Library.find({},{books:1,_id:0});
    for(lib of library){
        for(bk of lib.books){
            const book = await Book.findById(bk).populate("ledger");
            data.push(book);
        }
    }
    res.status(200).send(data);

    
    
    
});

// const lib = await Library.findOne({name:library,users:{$elemMatch:{name:user._id}}},{_id:0});

// delete all books[ADMIN]
router.delete('/',(req,res)=>{
    Book.deleteMany({},(err)=>{
        if(err){
            res.status(400).send(err);
        }else{
            res.status(200).send("all books deleted");
        }
    })
});

// delete single book[LIBRARIAN]
router.delete('/book',(req,res)=>{
    Book.deleteOne({name:req.body.bookName,library:req.body.library},(err)=>{
        if(err){
            res.status(400).send(err);
        }else{
            res.status(200).send("deleted");
        }
    })
})

// GET all available books from a library
router.get('/library/available/:library',async(req,res)=>{
    const library = req.params.library;
    const books =await Book.find({library:library,status:BOOK_STATUS.AVAILABLE}).select("name library status -_id");
    res.status(200).send(books);
});

// GET all available books from a library except LENT
router.get('/library/availableall/:library',async(req,res)=>{
    const library = req.params.library;
    const books =await Book.find({library:library,status:{$ne:BOOK_STATUS.LENT}}).select("name library status -_id");
    res.status(200).send(books);
});

// Update the status of a book(RESERVE)
// for CLIENT ONLY
// RESERVE A BOOK
router.put('/reserve',async(req,res)=>{
    const library = req.body.library;
    const bookname = req.body.bookname;
    const username = req.body.username;

    const user = await User.findOne({name:username,library:library,role:ROLES.CLIENT});
    // console.log(user);
    if(user === null){
        return res.status(400).send("user not found");
    }
    const book = await Book.findOne({library:library,name:bookname,status:BOOK_STATUS.AVAILABLE});
    // console.log(book);
    if(book === null){
        return res.status(400).send("book not found");
    }
    const ledger = new Ledger({
        book:book._id,
        library:library,
        reserveDate: new Date(),
        user:user._id,
        bookname:bookname
    });
    const ledger1 = await ledger.save();
    // console.log(ledger1);
    const user1 = await User.findByIdAndUpdate(user._id,{$push:{ledger:ledger._id}},{new:true});
    const book1 = await Book.findByIdAndUpdate(book._id,{status:BOOK_STATUS.RESERVED,$push :{ledger:ledger._id}},{new:true});
    res.status(200).send("book reserved");

});

// LEND a book
// for LIBRARIAN USE ONLY
router.put('/lend',async(req,res)=>{
    const library = req.body.library;
    const bookname = req.body.bookname;
    const username = req.body.username;

    const user = await User.findOne({name:username,role:ROLES.CLIENT});
    // console.log(user._id);
    if(user === null){ 
        return res.status(400).send("user not found");
    }
    const ledger = await Ledger.findOne({user:user._id,bookname:bookname,reserveDate:{$exists:true},borrowDate:{$exists:false}},).populate("book");
    // console.log(ledger);
    if(ledger === null){
        return res.status(400).send("no record of reserved book");
    }
    if(ledger.book.name === bookname){
        var ledger1 = await Ledger.findByIdAndUpdate(ledger._id,{borrowDate:new Date()},{new:true});
        var book = await Book.findByIdAndUpdate(ledger.book._id,{status:BOOK_STATUS.LENT},{new:true});
        res.status(200).send("book lent");
    }
});

// RETURN BORROWED BOOKS
// FOR CLIENT

router.put('/return',async(req,res)=>{
    const library = req.body.library;
    const bookname = req.body.bookname;
    const username = req.body.username;

    const user = await User.findOne({name:username,role:ROLES.CLIENT});
    // console.log(user);
    const ledger = await Ledger.findOne({user:user._id,bookname:bookname,reserveDate:{$exists:true},borrowDate:{$exists:true}}).populate("book");
    if(ledger ===null){
        return res.status(400).send("cannot find entry in ledger");
    }
    // console.log(ledger);
    const bDate = ledger.borrowDate ;
    const rDate = new Date();
    var time = Math.ceil((bDate - rDate)/((1000 * 3600 * 24)));
    // console.log(time);
    var payment = 0;
    if(time >7){
        payment = (time - 7)* 10;
    }
    const ledger1 = await Ledger.findByIdAndUpdate(ledger._id,{returnDate:rDate ,payment:payment},{new:true});
    const book = await Book.findByIdAndUpdate(ledger.book._id,{status:BOOK_STATUS.AVAILABLE},{new:true});
    res.status(200).send("book returned + payment="+ledger1.payment);
    
});


// update status of Libraries books [librarians ]
router.put('/updatestatus',async(req,res)=>{
    const library = req.query.library;
    const data=[];

    const ledger = await Ledger.find({library:library,borrowDate:{$exists: true},returnDate:{$exists:false}}).populate("user");
    // res.json(ledger);
    for(led of ledger){
        const bDate = led.borrowDate ;
        const rDate = new Date();
        var time = Math.ceil((rDate - bDate)/((1000 * 3600 * 24)));
        // console.log(time);
        if(time >7){
            const book = await Book.findByIdAndUpdate(led.book,{status:BOOK_STATUS.DUE},{new:true});
        }
    }


    const ledger1 = await Ledger.find({library:library,reserveDate:{$exists: true},borrowDate:{$exists:false}}).populate("user");
    // res.json(ledger);
    for(led of ledger1){
        const rDate1 = led.borrowDate ;
        const bDate1 = new Date();
        var time1 = Math.ceil((bDate1 - rDate1)/((1000 * 3600 * 24)));
        // console.log(time);
        if(time1 >7){
            const book1 = await Book.findByIdAndUpdate(led.book,{status:BOOK_STATUS.AVAILABLE},{new:true});
        }
    }
    
});

// HISTORY OF USERS ALOMG WITH DURATION
// ADMIN / LIBRARIAN
router.get('/history',async(req,res)=>{
    var data=[];
    const book = await Book.findOne({name:req.query.bookname,library:req.query.library},{ledger:1,_id:0});
    if(book === null){
        return res.status(400).send("cannot find book");
    }
    // console.log(book);
    for(id of book.ledger){
        const led = await Ledger.findById(id).populate("user");
        var obj ={
            bookname:req.query.bookname,
            username:led.user.name,
            borrowDate:led.borrowDate
        }
        if(led.borrowDate){
            obj.borrowDate = led.borrowDate;
        }
        if(led.returnDate){
            obj.returnDate = led.returnDate;
            obj.duration =Math.ceil((led.borrowDate - led.returnDate)/((1000 * 3600 * 24)));
        }
        data.push(obj);
    }
    res.status(200).send(data);
});



module.exports = router;