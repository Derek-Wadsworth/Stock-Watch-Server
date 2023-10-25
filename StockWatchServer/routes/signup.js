const express = require("express");
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const router = express.Router();

const User = require('../models/user');
const { default: mongoose } = require("mongoose");

// handle checking if an email address format is valid and
// is not in the Database
router.get('/email', async (req, res) => {
    try {
        // get email address from req query
        const { email } = req.query;

        // Check if the email address is valid
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const isValidEmail = emailRegex.test(email);
  
        if (!isValidEmail) {
            return res.status(400).json({
                message: 'Email address is not valid' 
            });
        }
         // Check if the email exists in the database
        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            // email is in use, so send status 409
            return res.status(409).json({ 
                message: 'Email already exists' 
            });
        }

        // email address is valid
        return res.status(200).json({
            message: 'Email address is valid and unused'
        });
    } catch (error) {
        console.error('Error', error);
        return res.status(500).json({
             error: error.message || 'Server error' 
        });
    }
});

// handling sending the user a verification email to the address
// inputted on the Email Screen
router.post('/email/verify', async (req, res) => {
    try {

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: "stockwatch.noreply1",
                pass: "gasw smjy qflq bumq"
            }
        });

        const token = jwt.sign({
            email: `${req.body.email}`,
            verified: true,
        }, 'secretKey', { expiresIn: '10m' }
        );

        const mailConfigurations = {
            // email sender
            from: 'StockWatch247@gmail.com',
            // email receiver
            to: `${req.body.email}`,
            // email subject
            subject: 'Email Verification',
            // email body
            text: `Please follow the given link to verify your email
                    http://localhost:3000/signup/email/verify/${token}.`
        };

        transporter.sendMail(mailConfigurations, function(error, info) {
            if (error) {
                res.status(500).json({
                    error: error
                });
                return console.log(error);
            }
        });

        console.log(`Email sent to address ${req.body.email}`);
        return res.status(200).json({
            message: 'Email verification initiated...' 
        });
    } catch (error) {
        console.error('Error', error);
        return res.status(500).json({
             error: error.message || 'Server error' 
        });
    }
});

// handle creation of new User to the Database
router.post('/email/verify/user', async (req, res) => {
    try {
        const user = new User({
            _id: new mongoose.Types.ObjectId(),
            email: req.body.email
        });
        user.save();
        res.status(200).json({
            message: 'User successfully added to the database'
        });
    } catch (error) {
        console.error('Error', error);
        res.status.json({
            error: 'Server error'
        });
    }
});

// handle querying of Database for user with existing email
router.get('/email/verify/user', async (req, res) => {
    try {
        const existingUser = await User.findOne({ email: req.query.email });
        console.log(`existing user is ${req.query.email}`);

        if (existingUser) {
            // user exists in the database, so email has been verified
            console.log('Status is good!');
            res.status(200).json({
                message: 'Email verification successful'
            });
        } else {
            console.log('Status is bad!');
            res.status(403).json({
                message: 'Email verification failed'
            });
        }
    } catch (error) {
        console.error('Error', error);
        res.status(500).json({
            error: 'Server error'
        });
    }
})

// handle verification of JWT token, thus ensuring the users email exists
// If the user exists, go to the next route to handle clients fetch of verification
router.get('/email/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Verification of the JWT token
        jwt.verify(token, 'secretKey', function(err, decoded) {
            if (err) {
                console.log(err);
                res.status(403).json({
                    message: "Email verification failed, possibly the link is invalid or expired"
                });
            } else {
                console.log(decoded.email);
                console.log('/email.verify:token route');
                res.render('../webpages/index.ejs', { email: decoded.email });
                // res.status(200).json({
                //     message: "Email verified successfully, please navigate back to the StockWatch app to continue the signup process."
                // });
            }
        });
    } catch (error) {
        console.log('We made an oopsie!!!!!');
        console.error('Error', error);
        res.status(500).json({
            error: 'Server error'
        });
    }
});

// handle updating a new user's password during signup
router.patch('/password', async (req, res) => {
    try {
        // hash the password 
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

        // Access the mongoose connection from the app object
        const mongooseConnection = req.app.get('mongooseConnection');

        // update user's password using User model
        const result = await User.updateOne(
            { email: req.body.email },
            { $set: { password: hashedPassword }}
        );

        if (result.nModified === 0) {
            // no user found for given email
            res.status(404).json({
                message: 'User not found'
            });
        } else {
            // user was found and updated
            console.log('patch route entered');
            res.status(200).json({
                message: 'User password successfully updated'
            });
        }
    } catch (error) {
        console.error('Error', error);
        res.status(500).json({
            error: 'Server error'
        });
    }
});

// handle updating a new user's full name during signup
router.patch('/fullName', async (req, res) => {
    try {
        // update user's first and last name using User model
        const result = await User.updateOne(
            { email: req.body.email },
            { $set: { firstName: req.body.firstName, lastName: req.body.lastName }}
        );
        
        if (result.nModified === 0) {
            // no user found for given email
            res.status(404).json({
                message: 'User not found'
            });
        } else {
            // user was found and updated
            console.log('patch route entered');
            res.status(200).json({
                message: 'User first and last name successfully updated'
            });
        }
    } catch (error) {
        console.error('Error', error);
        res.status(500).json({
            error: 'Server error'
        });
    }
});

// handle updating a new user's phone number during signup
router.patch('/phoneNumber', async (req, res) => {
    try {
        // Check if the phone number is valid
        const phoneRegex = /^(\+\d{1,2}\s?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
        const isValidPhoneNumber = phoneRegex.test(req.body.phoneNumber);
  
        if (!isValidPhoneNumber) {
            return res.status(400).json({
                message: 'Phone number is not valid' 
            });
        }
        
        // update user's phone number using User model
        const result = await User.updateOne(
            { email: req.body.email },
            { $set: { phoneNumber: req.body.phoneNumber }}
        );
        
        if (result.nModified === 0) {
            // no user found for given email
            res.status(404).json({
                message: 'User not found'
            });
        } else {
            // user was found and updated
            console.log('patch route entered');
            res.status(200).json({
                message: 'User phone number successfully updated'
            });
        }
    } catch (error) {
        console.error('Error', error);
        res.status(500).json({
            error: 'Server error'
        });
    }
});

// handle updating a new user's date of birth during signup
router.patch('/dateofBirth', async (req, res) => {
    try {
        // check if the date is valid
        const dateParts = req.body.dateofBirth.split('/');

        // check date has 3 parts: month, day, year
        if (dateParts.length === 3) {
            const [month, day, year] = dateParts;

            // check if parts are within reasonable ranges
            if (parseInt(month) >= 1 && parseInt(month) <= 12 &&
                parseInt(day) >= 1 && parseInt(day) <= 31 &&
                parseInt(year) >= 1923 && parseInt(year) <= 2005) {

                // create new Date
                const date = new Date(year, parseInt(month) - 1, day);

                // update user's phone number using User model
                const result = await User.updateOne(
                    { email: req.body.email },
                    { $set: { dateOfBirth: date }}
                );
                
                if (result.nModified === 0) {
                    // no user found for given email
                    return res.status(404).json({
                        message: 'User not found'
                    });
                } else {
                    // user was found and updated
                    console.log('patch route entered');
                    return res.status(200).json({
                        message: 'User phone number successfully updated'
                    });
                }
            }
        } 
        // date format is invalid
        return res.status(400).json({
            message: 'Date of birth is not valid'
        });
    } catch (error) {
        console.error('Error', error);
        return res.status(500).json({
            error: 'Server error'
        });
    }
});

// handle updating a new user's address during signup
router.patch('/address', async (req, res) => {
    try {

        // update user's Address using User model
        const result = await User.updateOne(
            { email: req.body.email },
            { $set: { address: req.body.address }}
        );
        
        if (result.nModified === 0) {
            // no user found for given email
            res.status(404).json({
                message: 'User not found'
            });
        } else {
            // user was found and updated
            console.log('patch route entered');
            res.status(200).json({
                message: 'User phone number successfully updated'
            });
        }
    } catch (error) {
        console.error('Error', error);
        res.status(500).json({
            error: 'Server error'
        });
    }
});

// handle login for a given user by matching email and pword
router.post('/login', (req, res, next) => {
    User.find({ email: req.body.email })
    .exec()
    .then(user => {
        // user does not exist
        if (user.length < 1) {
            return res.status(401).json({
                message: 'Invalid Credentials'
            });
        }
        // check for match with inputted pword and stored pword
        bcrypt.compare(req.body.password, user[0].password, (err, result) => {
            if (err) {
                return res.status(401).json({
                    message: 'Invalid Credentials'
                });
            }
            // pwords are the same
            if (result) {
                return res.status(200).json({
                    message: 'Auth successful'
                });
            }
            // pwords are not the same
            res.status(401).json({
                message: 'Invalid Credentials'
            });
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
})

module.exports = router;