const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const User = require('./models/User');
const RequestRide = require('./models/requestSchema'); // Import the RequestRide model
const HistoricalRide = require('./models/history');


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
        console.log(`Accepting request with ID: ${requestId} for pool: ${poolId}`);

        const pool = await AvailablePool.findById(poolId);
        if (!pool) {
            console.log('Pool not found');
            return res.status(404).json({ message: 'Pool not found' });
        }

        const request = pool.requests.id(requestId);
        if (!request) {
            console.log('Request not found');
            return res.status(404).json({ message: 'Request not found' });
        }

        request.status = 'Accepted';
        pool.seats--;
        await pool.save();

        console.log(`Request with ID: ${requestId} accepted`);

        let poolCompleted = false;
        // Check if seats are now 0
        if (pool.seats === 0) {
            // Move pool to history
            const historicalRideData = {
                poolId: pool._id,
                driverName: pool.driverName,
                driverPhone: pool.driverPhone,
                driverNote: pool.driverNote,
                pickupLocation: pool.pickupLocation,
                dropLocation: pool.dropLocation,
                time: new Date(pool.time),
                seats: pool.seats,
                createdBy: pool.createdBy,
                requests: pool.requests
            };

            const historicalRide = new HistoricalRide(historicalRideData);
            await historicalRide.save();

            // Delete the pool from AvailablePool
            await AvailablePool.findByIdAndDelete(poolId);

            console.log(`Pool moved to history as seats became 0`);
            poolCompleted = true;
        }

        res.json({ 
            message: poolCompleted ? 'Request accepted and pool completed' : 'Request accepted successfully', 
            request,
            poolCompleted
        });
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




// Mark a pool as completed
app.post('/api/pools/:poolId/complete', requireLogin, async (req, res) => {
    try {
        const poolId = req.params.poolId;
        console.log(`Attempting to complete pool: ${poolId}`);
        
        const pool = await AvailablePool.findById(poolId);
        if (!pool) {
            console.log(`Pool not found: ${poolId}`);
            return res.status(404).json({ message: 'Pool not found' });
        }

        console.log(`Found pool:`, JSON.stringify(pool, null, 2));

        // Create a historical ride entry
        const historicalRideData = {
            poolId: pool._id,
            driverName: pool.driverName || '',
            driverPhone: pool.driverPhone || '',
            driverNote: pool.driverNote || '',
            pickupLocation: pool.pickupLocation || '',
            dropLocation: pool.dropLocation || '',
            time: new Date(pool.time),
            seats: pool.seats || 0,
            createdBy: pool.createdBy,
            requests: (pool.requests || []).map(request => ({
                riderId: request.riderId,
                riderName: request.riderName || '',
                riderPhone: request.riderPhone || '',
                pickupLocation: request.pickupLocation || '',
                dropLocation: request.dropLocation || '',
                requestNote: request.requestNote || '',
                status: request.status || ''
            }))
        };

        console.log(`Historical ride data:`, JSON.stringify(historicalRideData, null, 2));

        const historicalRide = new HistoricalRide(historicalRideData);

        console.log(`Created historical ride:`, JSON.stringify(historicalRide, null, 2));

        const savedHistoricalRide = await historicalRide.save();
        console.log(`Saved historical ride:`, JSON.stringify(savedHistoricalRide, null, 2));

        // Delete the pool from AvailablePool
        const deletedPool = await AvailablePool.findByIdAndDelete(poolId);
        console.log(`Deleted pool:`, JSON.stringify(deletedPool, null, 2));

        res.json({ message: 'Pool completed and moved to history' });
    } catch (error) {
        console.error('Error completing pool:', error);
        res.status(500).json({ error: error.message });
    }
});


// Get ride history for a user
app.get('/api/users/:userId/history', requireLogin, async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log(`Fetching ride history for user: ${userId}`);
        
        const historicalRides = await HistoricalRide.find({ 
            $or: [
                { createdBy: userId },
                { 'requests.riderId': userId }
            ]
        });
        
        console.log(`Found ${historicalRides.length} historical rides for user ${userId}`);
        res.json(historicalRides);
    } catch (error) {
        console.error('Error fetching ride history:', error);
        res.status(500).json({ error: 'Failed to fetch ride history', details: error.message });
    }
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});