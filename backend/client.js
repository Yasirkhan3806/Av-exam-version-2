import mongoose from 'mongoose';

const mongoURI = 'mongodb://127.0.0.1:27017/All_Data'; // Replace with your DB URI

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

export default db;     