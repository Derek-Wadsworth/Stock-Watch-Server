const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const signupRoutes = require('./routes/signup');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// set EJS as the view engine
app.set('view engine', 'ejs');

// connect mongodb with mongoose and store the connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log("Connected to MongoDB");
})
.catch((err) => console.log(err));

// use the mongoose connection as an app property
app.set('mongooseConnection', mongoose.connection);

// cors configurations
const corsOptions = {
    // origin: 
    methods: 'GET,POST,PATCH,DELETE',
    credentials: true,
};

// ensure proper parsing of JSON requests
app.use(express.json());

// allow Cross-Origin Resource Sharing
app.use(cors());

// API Routes
app.use('/signup', signupRoutes);

// app.use((req, res, next) => {
//     res.status(200).json({
//         message: "It works!"
//     });
// });

// listen on port 3000
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

