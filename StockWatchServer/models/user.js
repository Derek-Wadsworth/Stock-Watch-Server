const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        default: '',
    },
    firstName: {
        type: String,
        default: '',
    },
    lastName: {
        type: String,
        default: '',
    },
    dateOfBirth: {
        type: Date,
    },
    phoneNumber: {
        type: String,
        default: '',
    },
    portfolio: [
        {
            symbol: String,
            shares: Number,
            averagePrice: Number,
        }
    ],
    transactions: [
        {
            symbol: String,
            shares: Number,
            price: Number,
            type: String,
            date: Date,
        }
    ],
    balance: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("User", userSchema);