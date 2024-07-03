const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const User = require('./models/User');
const RequestRide = require('./models/requestSchema'); // Import the RequestRide model

const app = express();
const port = 3000;

const connectionString = 'mongodb+srv://harsha090500:0066@us.k3mmvap.mongodb.net/?retryWrites=true&w=majority&appName=US';

mongoose.connect(connectionString, {
    dbName: 'CarPooling',
}).then(() => {
    console.log('Connected to MongoDB Atlas');
}).catch(err => {
    console.error('Error connecting to MongoDB Atlas:', err);
});

const poolSchema = new mongoose.Schema({
    driverName: String,
    driverPhone: String,
    driverNote: String,
    pickupLocation: String,
    dropLocation: String,
    time: String,
    seats: Number,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Reference to the User model
    },
    requests: [
        {
            riderId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User' // Reference to the User model
            },
            riderName: String,
            riderPhone: String,
            pickupLocation: String,
            dropLocation: String,
            requestNote: String,
            status: {
                type: String,
                enum: ['Pending', 'Accepted'],
                default: 'Pending'
            }
        }
    ]
});


const AvailablePool = mongoose.model('AvailablePool', poolSchema);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure express-session
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Use secure: true in production with HTTPS
}));

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
    if (req.session.user) {
        next(); // User is logged in, proceed to the next middleware or route handler
    } else {
        res.status(401).json({ message: 'Not logged in' });
    }
};

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create a new pool
app.post('/api/pools', requireLogin, async (req, res) => {
    const { driverName, driverPhone, driverNote, pickupLocation, dropLocation, time, seats } = req.body;

    const newPool = new AvailablePool({
        driverName,
        driverPhone,
        driverNote,
        pickupLocation,
        dropLocation,
        time,
        seats,
        createdBy: req.session.user.id // Set createdBy to the logged-in user's ID
    });

    try {
        const savedPool = await newPool.save();
        res.status(201).json(savedPool);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// Get all pools
app.get('/api/pools', async (req, res) => {
    const createdBy = req.query.createdBy;

    try {
        let pools;
        if (createdBy) {
            pools = await AvailablePool.find({ createdBy });
        } else {
            pools = await AvailablePool.find();
        }
        res.json(pools);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




// Signup
app.post('/api/signup', async (req, res) => {
    const { email, password, firstName, lastName, mobileNumber, optionalMobileNumber } = req.body;

    try {
        // Check if user with the same email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            mobileNumber,
            optionalMobileNumber
        });

        // Save the user in MongoDB
        const savedUser = await newUser.save();
        console.log('User saved successfully:', savedUser); // Debugging

        res.status(201).json({ message: 'Signup successful' });
    } catch (error) {
        console.error('Error during signup:', error); // Debugging
        res.status(500).json({ error: error.message });
    }
});


// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Compare hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Save user info in session
        req.session.user = { id: user._id, name: user.name, email: user.email };

        res.status(200).json({ message: 'Login successful', user: req.session.user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check if user is logged in
app.get('/api/isLoggedIn', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ message: 'Not logged in' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    const userId = req.body.id;
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        console.log(`User with id ${userId} logged out`); // Logging user id
        res.status(200).json({ message: 'Logout successful' });
    });
});


// Create a new ride request
app.post('/api/pools/:poolId/requests', requireLogin, async (req, res) => {
    try {
        const pool = await AvailablePool.findById(req.params.poolId);
        if (!pool) {
            return res.status(404).json({ message: 'Pool not found' });
        }

        const { riderName, riderPhone, pickupLocation, dropLocation, requestNote } = req.body;
        const newRequest = {
            riderId: req.session.user.id,
            riderName,
            riderPhone,
            pickupLocation,
            dropLocation,
            requestNote,
            status: 'Pending'
        };

        const request = new RequestRide(newRequest);
        await request.save();

        pool.requests.push(newRequest);
        await pool.save();

        res.status(201).json({ message: 'Request created successfully', request });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Accept a ride request
app.patch('/api/pools/:poolId/requests/:requestId/accept', requireLogin, async (req, res) => {
    try {
        const { poolId, requestId } = req.params;
        console.log(`Accepting request with ID: ${requestId} for pool: ${poolId}`); // Debugging log

        const pool = await AvailablePool.findById(poolId);
        if (!pool) {
            console.log('Pool not found'); // Debugging log
            return res.status(404).json({ message: 'Pool not found' });
        }

        const request = pool.requests.id(requestId); // Use Mongoose's subdocument method
        if (!request) {
            console.log('Request not found'); // Debugging log
            return res.status(404).json({ message: 'Request not found' });
        }

        // Update request status to 'Accepted'
        request.status = 'Accepted';

        // Optionally update seats available count in the pool
        pool.seats--;
        await pool.save();

        console.log(`Request with ID: ${requestId} accepted`); // Debugging log
        res.json({ message: 'Request accepted successfully', request });
    } catch (error) {
        console.error('Error accepting request:', error);
        res.status(500).json({ error: error.message });
    }
});




// Get requests for a specific user
app.get('/api/users/:userId/requests', requireLogin, async (req, res) => {
    try {
        const userId = req.params.userId;
        const userRequests = await RequestRide.find({ riderId: userId });
        res.json(userRequests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Get user info
app.get('/api/userInfo', requireLogin, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const user = await User.findById(userId); // Adjust this based on your User model structure
        if (user) {
            res.json({
                firstName: user.firstName,
                lastName: user.lastName,
                mobileNumber: user.mobileNumber,
                optionalMobileNumber: user.optionalMobileNumber
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




// Update user information
app.put('/api/userInfo', requireLogin, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { firstName, lastName, mobileNumber, optionalMobileNumber } = req.body;

        // Find and update the user in MongoDB
        const updatedUser = await User.findByIdAndUpdate(userId, {
            firstName,
            lastName,
            mobileNumber,
            optionalMobileNumber
        }, { new: true });

        if (updatedUser) {
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// Delete a pool
app.delete('/api/pools/:poolId', requireLogin, async (req, res) => {
    const poolId = req.params.poolId;

    try {
        const deletedPool = await AvailablePool.findByIdAndDelete(poolId);
        if (!deletedPool) {
            return res.status(404).json({ message: 'Pool not found' });
        }
        res.json({ message: 'Pool deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Delete a ride request
app.delete('/api/requests/:requestId', requireLogin, async (req, res) => {
    const requestId = req.params.requestId;

    try {
        const deletedRequest = await RequestRide.findByIdAndDelete(requestId);
        if (!deletedRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});











app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});