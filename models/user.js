const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    ledger:{
        type:[{type:mongoose.Schema.Types.ObjectId, ref :'Ledger'}]
    },
    role:{
        type:String,
        required:true
    },
    library:{
        type:String
    }
});

const BookDetailsSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    }
});

const BOOK_STATUS = {
    AVAILABLE:"available",
    RESERVED:"reserved",
    LENT:"lent",
    DUE:"due"
};

const ROLES ={
    ADMIN:"admin",
    LIBRARIAN:"librarian",
    CLIENT:"client",
    INACTIVE:"inactive"
}

const BookSchema =mongoose.Schema({
    bookDetails:{
        type: mongoose.Schema.Types.ObjectId, ref : 'BookDetails'
    },
    name:{
        type:String,
        required:[true,"enter a valid object id"]
    },
    library:{
        type:String,
        required:true
    },
    status:{
        type:String,
        required:true
    },
    ledger:{
        type:[{type:mongoose.Schema.Types.ObjectId, ref : 'Ledger'}]
    }
});

const LibrarySchema =  mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    manager:{
        type:mongoose.Schema.Types.ObjectId, ref : 'User'
    },
    books:[{type:mongoose.Schema.Types.ObjectId, ref : 'Book'}],
    users:[{type:mongoose.Schema.Types.ObjectId, ref : 'User'}]
    
});

const LedgerSchema = mongoose.Schema({
    book:{
        type:mongoose.Schema.Types.ObjectId, ref : 'Book',
        required:true
    },
    bookname:{
        type:String,
        required:true
    },
    library:{
        type:String,
        required:true
    },
    reserveDate:{
        type:Date,
        required:true
    },
    borrowDate:{
        type:Date,
    },
    returnDate:{
        type:Date,
    },
    user:{
        type:mongoose.Schema.Types.ObjectId, ref : 'User',
        required:true
    },
    payment:{
        type:Number,
    }

});

const User = mongoose.model("User",UserSchema);
const BookDetails = mongoose.model("BookDetails",BookDetailsSchema);
const Book = mongoose.model("Book",BookSchema);
const Library = mongoose.model("Library",LibrarySchema);
const Ledger = mongoose.model("Ledger",LedgerSchema);

module.exports={User,BookDetails,BOOK_STATUS,ROLES,Book,Library,Ledger};