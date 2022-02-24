const express = require('express');
const router = express.Router();
const {User,BookDetails,BOOK_STATUS,Book,Ledger} = require('../../models/user');

router.get('/',async(req,res)=>{
    const ledger = await Ledger.find({}).populate("user",{path:User ,model:User,select:{ledger:0,}}).populate("book");
    return res.status(200).send(ledger);
})

router.delete('/',(req,res)=>{
    Ledger.deleteMany({},(err,aff)=>{
        if(err){
            res.status(400).send(err);
        }else{
            res.status(200).send("all records deleted");
        }
    })
});

router.get('/lendinghistory',async(req,res)=>{
    const books = await Book.find({name:req.body.bookname,library:req.body.library},"ledger").populate("ledger");
    res.status(200).send(books);
})


module.exports = router;