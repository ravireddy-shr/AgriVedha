const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Create directories if they don't exist
const uploadDir = path.join(__dirname, 'uploads');
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

// Serve uploads directory
app.use('/uploads', express.static('uploads'));

// Data storage functions
function readData() {
    try {
        if (fs.existsSync('data.json')) {
            const data = fs.readFileSync('data.json', 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading data:', error);
    }
    
    // Default data structure
    return {
        farmers: {},
        tasks: [
            { id: 1, title: 'Water Conservation', description: 'Implement drip irrigation', points: 10 },
            { id: 2, title: 'Soil Testing', description: 'Test soil pH levels', points: 10 },
            { id: 3, title: 'Organic Farming', description: 'Use organic fertilizers', points: 10 },
            { id: 4, title: 'Crop Rotation', description: 'Rotate crops seasonally', points: 10 },
            { id: 5, title: 'Pest Management', description: 'Use natural pest control', points: 10 }
        ],
        marketPrices: {
            coconut: 25,
            banana: 40,
            rice: 2500,
            wheat: 2200,
            tomato: 35
        },
        alerts: [],
        rewards: [
            { id: 1, name: 'Quality Seeds', cost: 20, description: 'Premium seed varieties' },
            { id: 2, name: 'Training Program', cost: 50, description: 'Advanced farming techniques' },
            { id: 3, name: 'Govt Scheme Access', cost: 100, description: 'Priority government scheme enrollment' }
        ]
    };
}

function writeData(data) {
    try {
        fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing data:', error);
    }
}

// Initialize data
let data = readData();

// Authentication routes
app.post('/api/login/mobile', (req, res) => {
    const { mobile, otp } = req.body;
    
    // Simple OTP validation (last 4 digits)
    const expectedOtp = mobile.slice(-4);
    
    if (otp === expectedOtp) {
        const farmerId = `farmer_${mobile}`;
        
        if (!data.farmers[farmerId]) {
            data.farmers[farmerId] = {
                id: farmerId,
                mobile: mobile,
                name: '',
                location: '',
                mainCrop: '',
                farmSize: '',
                points: 0,
                badges: [],
                completedTasks: [],
                sustainabilityScore: 0,
                joinDate: new Date().toISOString()
            };
            writeData(data);
        }
        
        res.json({ success: true, farmerId: farmerId });
    } else {
        res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
});

app.post('/api/login/aadhaar', (req, res) => {
    const { aadhaar, otp } = req.body;
    
    // Simple OTP validation (last 4 digits)
    const expectedOtp = aadhaar.replace(/-/g, '').slice(-4);
    
    if (otp === expectedOtp) {
        const farmerId = `farmer_${aadhaar}`;
        
        if (!data.farmers[farmerId]) {
            data.farmers[farmerId] = {
                id: farmerId,
                aadhaar: aadhaar,
                name: '',
                location: '',
                mainCrop: '',
                farmSize: '',
                points: 0,
                badges: [],
                completedTasks: [],
                sustainabilityScore: 0,
                joinDate: new Date().toISOString()
            };
            writeData(data);
        }
        
        res.json({ success: true, farmerId: farmerId });
    } else {
        res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
});

// Farmer routes
app.get('/api/farmer/:id', (req, res) => {
    const farmer = data.farmers[req.params.id];
    if (farmer) {
        res.json(farmer);
    } else {
        res.status(404).json({ error: 'Farmer not found' });
    }
});

app.post('/api/farmer/:id/profile', (req, res) => {
    const farmerId = req.params.id;
    const { name, location, mainCrop, farmSize } = req.body;
    
    if (data.farmers[farmerId]) {
        data.farmers[farmerId] = {
            ...data.farmers[farmerId],
            name,
            location,
            mainCrop,
            farmSize
        };
        writeData(data);
        res.json({ success: true, farmer: data.farmers[farmerId] });
    } else {
        res.status(404).json({ error: 'Farmer not found' });
    }
});

// Market routes
app.get('/api/market/prices', (req, res) => {
    res.json(data.marketPrices);
});

app.post('/api/market/alerts', (req, res) => {
    const { farmerId, crop, targetPrice } = req.body;
    
    data.alerts.push({
        id: Date.now(),
        farmerId,
        crop,
        targetPrice,
        currentPrice: data.marketPrices[crop],
        created: new Date().toISOString()
    });
    
    writeData(data);
    res.json({ success: true });
});

// Tasks routes
app.get('/api/tasks/:farmerId', (req, res) => {
    const farmerId = req.params.farmerId;
    const farmer = data.farmers[farmerId];
    
    const tasksWithStatus = data.tasks.map(task => ({
        ...task,
        completed: farmer && farmer.completedTasks.includes(task.id)
    }));
    
    res.json(tasksWithStatus);
});

app.post('/api/tasks/:farmerId/upload', upload.single('proof'), (req, res) => {
    const farmerId = req.params.farmerId;
    const taskId = parseInt(req.body.taskId);
    
    if (!data.farmers[farmerId]) {
        return res.status(404).json({ error: 'Farmer not found' });
    }
    
    const farmer = data.farmers[farmerId];
    
    if (!farmer.completedTasks.includes(taskId)) {
        farmer.completedTasks.push(taskId);
        farmer.points += 10;
        farmer.sustainabilityScore = Math.min(100, farmer.completedTasks.length * 10);
        
        // Award badges
        if (farmer.completedTasks.length === 1 && !farmer.badges.includes('Green Starter')) {
            farmer.badges.push('Green Starter');
        }
        if (farmer.sustainabilityScore >= 30 && !farmer.badges.includes('Water Saver')) {
            farmer.badges.push('Water Saver');
        }
        if (farmer.sustainabilityScore >= 60 && !farmer.badges.includes('Soil Guardian')) {
            farmer.badges.push('Soil Guardian');
        }
        if (farmer.sustainabilityScore >= 90 && !farmer.badges.includes('Eco Champion')) {
            farmer.badges.push('Eco Champion');
        }
    }
    
    writeData(data);
    res.json({ success: true, points: farmer.points, sustainabilityScore: farmer.sustainabilityScore });
});

// Rewards routes
app.post('/api/rewards/redeem', (req, res) => {
    const { farmerId, rewardId } = req.body;
    
    const farmer = data.farmers[farmerId];
    const reward = data.rewards.find(r => r.id === parseInt(rewardId));
    
    if (!farmer) {
        return res.status(404).json({ error: 'Farmer not found' });
    }
    
    if (!reward) {
        return res.status(404).json({ error: 'Reward not found' });
    }
    
    if (farmer.points < reward.cost) {
        return res.status(400).json({ error: 'Insufficient points' });
    }
    
    farmer.points -= reward.cost;
    
    if (!farmer.redeemedRewards) {
        farmer.redeemedRewards = [];
    }
    
    farmer.redeemedRewards.push({
        rewardId: reward.id,
        name: reward.name,
        cost: reward.cost,
        redeemedAt: new Date().toISOString()
    });
    
    writeData(data);
    res.json({ success: true, remainingPoints: farmer.points });
});

app.get('/api/rewards', (req, res) => {
    res.json(data.rewards);
});

// Government bonus routes
app.post('/api/govt/bonus', (req, res) => {
    const { farmerId, crop, quantity, basePrice, buyer, district } = req.body;
    
    const bonusPrice = basePrice * 1.10; // 10% government bonus
    const totalAmount = bonusPrice * quantity;
    
    if (!data.govtSales) {
        data.govtSales = [];
    }
    
    data.govtSales.push({
        id: Date.now(),
        farmerId,
        crop,
        quantity,
        basePrice,
        bonusPrice,
        totalAmount,
        buyer,
        district,
        saleDate: new Date().toISOString()
    });
    
    // Store in localStorage format for frontend display
    const saleForStorage = {
        crop,
        quantity,
        totalAmount,
        district,
        buyer,
        date: new Date().toISOString()
    };
    
    writeData(data);
    res.json({ success: true, bonusPrice, totalAmount });
});

// Sales routes
app.post('/api/sell', (req, res) => {
    const { farmerId, crop, quantity, price, buyer, location } = req.body;
    
    if (!data.sales) {
        data.sales = [];
    }
    
    const totalAmount = price * quantity;
    
    data.sales.push({
        id: Date.now(),
        farmerId,
        crop,
        quantity,
        price,
        totalAmount,
        buyer,
        location,
        saleDate: new Date().toISOString()
    });
    
    writeData(data);
    res.json({ success: true, totalAmount });
});

// Leaderboard route
app.get('/api/leaderboard', (req, res) => {
    const farmers = Object.values(data.farmers)
        .filter(farmer => farmer.name && farmer.name.trim() !== '')
        .sort((a, b) => b.points - a.points)
        .slice(0, 5);
    
    res.json(farmers);
});

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`AGRI VEDHA server running on port ${PORT}`);
    console.log(`Access the application at: http://localhost:${PORT}`);
});