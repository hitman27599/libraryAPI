const express = require('express');
const router = express.Router();
const {User,BookDetails,BOOK_STATUS,Book} = require('../../models/user');

router.post('/add',async(req,res)=>{
    const check = await BookDetails.findOne({name:req.body.name});
    if(check !== null){
        return res.status(400).send("book already present");
    }
    const bookDetails = new BookDetails({name:req.body.name});
    bookDetails.save().then((data)=>{
        res.status(201).send(data);
    }).catch((err)=>{
        res.status(400).send(err);
    });
})

module.exports = router;