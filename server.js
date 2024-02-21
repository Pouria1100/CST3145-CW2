const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');


const app = express();
const PORT = process.env.PORT || 3000;

const url = 'mongodb+srv://pouriasabouri6771:Pou1441375@cluster0.6qzp3jb.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(url);


const recordRequest = (req, res, next) => {
    const { method, originalUrl, protocol } = req;
    const timestamp = new Date().toISOString();

    const logMessage = `[${timestamp}] ${method} ${originalUrl} - ${protocol}://${req.get('host')}${req.originalUrl}]\n`;

    console.log(logMessage);

    next();
};

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

const getLessons = async (req, res) => {
    try {

        const database = client.db("afterschool");
        const lesson_collection = database.collection("lessons");

        const lessons = await lesson_collection.find({}).toArray();

        res.json(lessons);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

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

const postOrder = async (req, res) => {
    try {
        await client.connect();

        const database = client.db("afterschool");
        const order_collection = database.collection("orders");

        const order = req.body;

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
        await client.close();
    }
}
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(recordRequest);
app.get("/lessons", getLessons)
app.get("/orders", getOrders)
app.post("/orders", postOrder)
app.use('/images/:filename', getImage)

app.listen(3000, () => {
    console.log(`Server is listening on http://${"localhost"}:${3000}`);
})