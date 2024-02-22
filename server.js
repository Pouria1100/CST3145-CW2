const express = require('express');// Importing the Express framework to create and manage the server
const os = require('os');// Importing the OS module to interact with underlying operating system functionalities
const { MongoClient } = require('mongodb');// Destructuring MongoClient from the mongodb package to connect to MongoDB
const bodyParser = require('body-parser');// Importing body-parser middleware to parse incoming request bodies before handlers
const fs = require('fs');// Importing the File System module to interact with the file system
const path = require('path');// Importing the Path module for working with file and directory paths
const cors = require('cors');// Importing CORS (Cross-Origin Resource Sharing) to enable cross-origin requests


// Initializing Express application
const app = express();

// Setting the port for the server to listen on, using environment variable or default to 3000
const PORT = process.env.PORT || 3000;
// Getting the hostname of the operating system to use in the server listener log
const HOST= os.hostname();

// MongoDB connection URL with credentials
const url = 'mongodb+srv://pouriasabouri6771:Pou1441375@cluster0.6qzp3jb.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(url);//Initializes a new MongoDB client using the connection string

// Middleware to log each request made to the server with its method, URL, and timestamp
const recordRequest = (req, res, next) => {
    const { method, originalUrl, protocol } = req;
    const timestamp = new Date().toISOString();

    const logMessage = `[${timestamp}] ${method} ${originalUrl} - ${protocol}://${req.get('host')}${req.originalUrl}]\n`;

    console.log(logMessage);

    next();// Proceed to the next middleware or route handler
};

// Middleware to serve images from a specific directory, handling non-existent files
const getImage = (req, res, next) => {
    const image = path.join(__dirname, './images', req.params.filename);

    fs.access(image, fs.constants.F_OK, (err) => {
        if (err) {
            res.status(404).send('Image not found');
        } else {
            res.sendFile(image);
        }
    });
};


// Async function to get lessons from MongoDB and return them as JSON
const getLessons = async (req, res) => {
    try {
        await client.connect();

        const database = client.db("afterschool");
        const lesson_collection = database.collection("lessons");

        const lessons = await lesson_collection.find({}).toArray();

        res.json(lessons);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


// Async function to get orders from MongoDB and return them as JSON
const getOrders = async (req, res) => {
    try {

        const database = client.db("afterschool");
        const order_collection = database.collection("orders");

        const orders = await order_collection.find({}).toArray();

        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


// Async function to post a new order to MongoDB and return the result
const postOrder = async (req, res) => {
    try {
        await client.connect();

        const database = client.db("afterschool");
        const order_collection = database.collection("orders");

        const order = req.body;

        // Validating order data before inserting
        if (!order.full_name || !order.phone_no || !order.lessons) {
            return res.status(400).json({ status: 400, error: 'Invalid order data' });
        }

        const result = await order_collection.insertOne(order);

        if (result.acknowledged) {
            res.status(201).json({ status: 201, message: 'Order created successfully', orderId: result.insertedId });
        } else {
            res.status(500).json({ status: 500, error: 'Failed to create order' });
        }
    } catch (err) {
        console.error('Error creating order', err);
        res.status(500).json({ status: 500, error: 'Failed to create order' });
    } finally {
        await client.close();// Ensure MongoDB client is closed after operation
    }
}

// Applying CORS middleware to allow all cross-origin requests
app.use(cors({ origin: '*' }));

// Applying body-parser middleware to parse JSON request bodies
app.use(bodyParser.json());

// Applying custom request logging middleware
app.use(recordRequest);

// Route to get lessons
app.get("/lessons", getLessons)

// Route to get orders
app.get("/orders", getOrders)

// Route to post a new order
app.post("/orders", postOrder)

// Serving static images with dynamic filenames from a directory
app.use('/images/:filename', getImage)




// Starting the server and listening for connections
app.listen(PORT, () => {
    console.log(`Server is listening on http://${HOST}:${PORT}`);
})