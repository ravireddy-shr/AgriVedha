// Global variables
let currentFarmerId = null;
let farmerData = null;
let currentPage = 'dashboard';

// Voice synthesis texts
const voiceTexts = {
    dashboard: {
        'en-IN': 'Welcome to your AGRI VEDHA farming dashboard. Track your sustainability progress and farming achievements.',
        'hi-IN': 'നിങ്ങളുടെ AGRI VEDHA കാർഷിക ഡാഷ്ബോർഡിലേക്ക് സ്വാഗതം. നിങ്ങളുടെ സുസ്ഥിരത പുരോഗതി ട്രാക്ക് ചെയ്യുക.'
    },
    tasks: {
        'en-IN': 'Complete daily farming tasks to earn points and improve your sustainability score.',
        'hi-IN': 'ദൈനംദിന കാർഷിക പ്രവർത്തനങ്ങൾ പൂർത്തിയാക്കി പോയിന്റുകൾ നേടുക.'
    },
    rewards: {
        'en-IN': 'Redeem your points for quality seeds, training programs, and government schemes.',
        'hi-IN': 'ഗുണമേന്മയുള്ള വിത്തുകൾക്കും പരിശീലന പരിപാടികൾക്കുമായി പോയിന്റുകൾ റിഡീം ചെയ്യുക.'
    },
    market: {
        'en-IN': 'Check current market prices and set price alerts for your crops.',
        'hi-IN': 'നിലവിലെ വിപണി വിലകൾ പരിശോധിച്ച് നിങ്ങളുടെ വിളകൾക്ക് വില അലേർട്ടുകൾ സജ്ജമാക്കുക.'
    },
    'govt-bonus': {
        'en-IN': 'Get 10% government bonus on your crop sales through the government scheme.',
        'hi-IN': 'സർക്കാർ പദ്ധതിയിലൂടെ നിങ്ങളുടെ വിള വിൽപ്പനയിൽ 10% സർക്കാർ ബോണസ് നേടുക.'
    },
    leaderboard: {
        'en-IN': 'View the top performing farmers in your region and compete for the top position.',
        'hi-IN': 'നിങ്ങളുടെ പ്രദേശത്തെ മികച്ച കർഷകരെ കാണുക ഒപ്പം മുന്നിൽ എത്താൻ മത്സരിക്കുക.'
    },
    profile: {
        'en-IN': 'Update your farmer profile with personal details and farming information.',
        'hi-IN': 'നിങ്ങളുടെ കർഷക പ്രൊഫൈൽ വ്യക്തിഗത വിവരങ്ങളും കാർഷിക വിവരങ്ങളും ഉപയോഗിച്ച് അപ്ഡേറ്റ് ചെയ്യുക.'
    }
};

// Login Functions
function showMobileLogin() {
    document.getElementById('mobileLogin').style.display = 'block';
    document.getElementById('aadhaarLogin').style.display = 'none';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

function showAadhaarLogin() {
    document.getElementById('mobileLogin').style.display = 'none';
    document.getElementById('aadhaarLogin').style.display = 'block';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

async function loginWithMobile() {
    const mobile = document.getElementById('mobileNumber').value;
    const otp = document.getElementById('mobileOtp').value;

    if (!mobile || !otp) {
        alert('Please enter both mobile number and OTP');
        return;
    }

    if (mobile.length !== 10) {
        alert('Please enter a valid 10-digit mobile number');
        return;
    }

    try {
        const response = await fetch('/api/login/mobile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mobile, otp }),
        });

        const data = await response.json();

        if (data.success) {
            currentFarmerId = data.farmerId;
            localStorage.setItem('farmerId', currentFarmerId);
            showDashboard();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

async function loginWithAadhaar() {
    const aadhaar = document.getElementById('aadhaarNumber').value;
    const otp = document.getElementById('aadhaarOtp').value;

    if (!aadhaar || !otp) {
        alert('Please enter both Aadhaar number and OTP');
        return;
    }

    // Format Aadhaar number
    const formattedAadhaar = aadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');

    try {
        const response = await fetch('/api/login/aadhaar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ aadhaar: formattedAadhaar, otp }),
        });

        const data = await response.json();

        if (data.success) {
            currentFarmerId = data.farmerId;
            localStorage.setItem('farmerId', currentFarmerId);
            showDashboard();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

// Dashboard Functions
function showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'grid';
    loadFarmerData();
    showPage('dashboard');
}

async function loadFarmerData() {
    try {
        const response = await fetch(`/api/farmer/${currentFarmerId}`);
        farmerData = await response.json();
        updateDashboardStats();
        updateSidebar();
        loadTasks();
    } catch (error) {
        console.error('Error loading farmer data:', error);
    }
}

function updateDashboardStats() {
    if (!farmerData) return;

    document.getElementById('pointsEarned').textContent = farmerData.points || 0;
    document.getElementById('badgesEarned').textContent = farmerData.badges ? farmerData.badges.length : 0;
    document.getElementById('sustainabilityScore').textContent = `${farmerData.sustainabilityScore || 0}%`;
    document.getElementById('tasksCompleted').textContent = farmerData.completedTasks ? farmerData.completedTasks.length : 0;

    // Update profile form
    if (farmerData.name) document.getElementById('farmerName').value = farmerData.name;
    if (farmerData.location) document.getElementById('farmerLocation').value = farmerData.location;
    if (farmerData.mainCrop) document.getElementById('farmerMainCrop').value = farmerData.mainCrop;
    if (farmerData.farmSize) document.getElementById('farmerFarmSize').value = farmerData.farmSize;

    // Draw charts
    drawSustainabilityChart();
    drawTasksChart();
    drawSalesChart();
}

function updateSidebar() {
    if (!farmerData) return;

    document.getElementById('sidebarName').textContent = farmerData.name || 'Welcome Farmer';
    document.getElementById('sidebarLocation').textContent = farmerData.location || '-';
    document.getElementById('sidebarCrop').textContent = farmerData.mainCrop || '-';
    document.getElementById('sidebarFarmSize').textContent = farmerData.farmSize || '-';
    document.getElementById('sidebarPoints').textContent = farmerData.points || 0;
    document.getElementById('sidebarBadges').textContent = farmerData.badges ? farmerData.badges.length : 0;
    document.getElementById('sidebarSustainability').textContent = `${farmerData.sustainabilityScore || 0}%`;

    // Update badges
    const badgesContainer = document.getElementById('badgesContainer');
    badgesContainer.innerHTML = '';
    
    if (farmerData.badges && farmerData.badges.length > 0) {
        farmerData.badges.forEach(badge => {
            const badgeElement = document.createElement('span');
            badgeElement.className = 'badge';
            badgeElement.textContent = badge;
            badgesContainer.appendChild(badgeElement);
        });
    } else {
        badgesContainer.innerHTML = '<p style="color: rgba(255,255,255,0.6); font-size: 0.9em;">Complete tasks to earn badges</p>';
    }

    // Update upcoming tasks
    loadUpcomingTasks();
}

async function loadUpcomingTasks() {
    try {
        const response = await fetch(`/api/tasks/${currentFarmerId}`);
        const tasks = await response.json();
        const upcomingTasks = tasks.filter(task => !task.completed).slice(0, 3);
        
        const upcomingContainer = document.getElementById('upcomingTasks');
        upcomingContainer.innerHTML = '';
        
        if (upcomingTasks.length > 0) {
            upcomingTasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.style.cssText = 'padding: 8px; background: rgba(255,255,255,0.1); border-radius: 6px; margin: 5px 0; font-size: 0.8em;';
                taskElement.textContent = task.title;
                upcomingContainer.appendChild(taskElement);
            });
        } else {
            upcomingContainer.innerHTML = '<p style="color: rgba(255,255,255,0.6); font-size: 0.9em;">All tasks completed!</p>';
        }
    } catch (error) {
        console.error('Error loading upcoming tasks:', error);
    }
}

// Page Navigation
function showPage(pageName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item) {
            item.classList.remove('active');
        }
    });
    
    // Find and activate the correct navigation item
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item) {
            const link = item.querySelector('a');
            if (link && link.getAttribute('onclick') && link.getAttribute('onclick').includes(`showPage('${pageName}')`)) {
                item.classList.add('active');
            }
        }
    });

    // Show page
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageName + 'Page').classList.add('active');

    currentPage = pageName;

    // Load page-specific data
    switch (pageName) {
        case 'tasks':
            loadTasks();
            break;
        case 'rewards':
            loadRewards();
            break;
        case 'market':
            loadMarketPrices();
            break;
        case 'govt-bonus':
            loadRecentSales();
            break;
        case 'leaderboard':
            loadLeaderboard();
            break;
    }
}

// Chart Drawing Functions
function drawSustainabilityChart() {
    const canvas = document.getElementById('sustainabilityChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Mock data for sustainability progress
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const scores = [10, 20, 35, 45, 60, farmerData?.sustainabilityScore || 0];

    // Set up drawing
    ctx.strokeStyle = '#4CAF50';
    ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
    ctx.lineWidth = 3;

    // Draw axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, height - 50);
    ctx.lineTo(width - 50, height - 50);
    ctx.moveTo(50, 50);
    ctx.lineTo(50, height - 50);
    ctx.stroke();

    // Draw grid lines
    for (let i = 0; i <= 5; i++) {
        const x = 50 + (i * (width - 100) / 5);
        const y = height - 50 - (i * (height - 100) / 5);
        
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(x, height - 50);
        ctx.lineTo(x, height - 40);
        ctx.stroke();
        
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(60, y);
        ctx.stroke();
    }

    // Draw line chart
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    scores.forEach((score, index) => {
        const x = 50 + (index * (width - 100) / (scores.length - 1));
        const y = height - 50 - (score * (height - 100) / 100);
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();

    // Fill area under line
    ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
    ctx.beginPath();
    ctx.moveTo(50, height - 50);
    scores.forEach((score, index) => {
        const x = 50 + (index * (width - 100) / (scores.length - 1));
        const y = height - 50 - (score * (height - 100) / 100);
        ctx.lineTo(x, y);
    });
    ctx.lineTo(width - 50, height - 50);
    ctx.closePath();
    ctx.fill();

    // Draw points
    ctx.fillStyle = '#4CAF50';
    scores.forEach((score, index) => {
        const x = 50 + (index * (width - 100) / (scores.length - 1));
        const y = height - 50 - (score * (height - 100) / 100);
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    months.forEach((month, index) => {
        const x = 50 + (index * (width - 100) / (months.length - 1));
        ctx.fillText(month, x, height - 25);
    });
}

function drawTasksChart() {
    const canvas = document.getElementById('tasksChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const completed = farmerData?.completedTasks?.length || 0;
    const total = 5; // Total available tasks
    const pending = total - completed;

    // Draw bars
    const barWidth = 60;
    const gap = 20;
    const startX = (width - (barWidth * 2 + gap)) / 2;

    // Completed tasks bar
    ctx.fillStyle = '#4CAF50';
    const completedHeight = (completed / total) * (height - 80);
    ctx.fillRect(startX, height - 50 - completedHeight, barWidth, completedHeight);

    // Pending tasks bar
    ctx.fillStyle = '#FF9800';
    const pendingHeight = (pending / total) * (height - 80);
    ctx.fillRect(startX + barWidth + gap, height - 50 - pendingHeight, barWidth, pendingHeight);

    // Labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    ctx.fillText('Completed', startX + barWidth / 2, height - 30);
    ctx.fillText(`${completed}`, startX + barWidth / 2, height - 15);
    
    ctx.fillText('Pending', startX + barWidth + gap + barWidth / 2, height - 30);
    ctx.fillText(`${pending}`, startX + barWidth + gap + barWidth / 2, height - 15);
}

function drawSalesChart() {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Mock sales data
    const sales = [100, 150, 120, 180, 200];
    const maxSale = Math.max(...sales);

    ctx.fillStyle = '#2196F3';
    
    sales.forEach((sale, index) => {
        const barWidth = (width - 60) / sales.length - 10;
        const barHeight = (sale / maxSale) * (height - 80);
        const x = 30 + index * (barWidth + 10);
        const y = height - 50 - barHeight;
        
        ctx.fillRect(x, y, barWidth, barHeight);
    });

    // Labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    ctx.fillText('Last 5 Sales', width / 2, height - 15);
}

// Profile Functions
document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('farmerName').value,
        location: document.getElementById('farmerLocation').value,
        mainCrop: document.getElementById('farmerMainCrop').value,
        farmSize: document.getElementById('farmerFarmSize').value
    };

    try {
        const response = await fetch(`/api/farmer/${currentFarmerId}/profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (data.success) {
            farmerData = data.farmer;
            updateSidebar();
            alert('Profile updated successfully!');
        } else {
            alert('Error updating profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile');
    }
});

// Tasks Functions
async function loadTasks() {
    try {
        const response = await fetch(`/api/tasks/${currentFarmerId}`);
        const tasks = await response.json();
        
        const tasksContainer = document.getElementById('tasksList');
        tasksContainer.innerHTML = '';
        
        tasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = `task-card ${task.completed ? 'completed' : ''}`;
            
            taskCard.innerHTML = `
                <div class="task-header">
                    <h3 class="task-title">${task.title}</h3>
                    <span class="task-points">+${task.points} points</span>
                </div>
                <p class="task-description">${task.description}</p>
                ${task.completed ? 
                    '<span class="completed-badge">✓ Completed</span>' :
                    `<div class="task-upload">
                        <input type="file" id="proof-${task.id}" accept="image/*,application/pdf">
                        <button class="upload-btn" onclick="uploadTaskProof(${task.id})">Upload Proof</button>
                    </div>`
                }
            `;
            
            tasksContainer.appendChild(taskCard);
        });
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

async function uploadTaskProof(taskId) {
    const fileInput = document.getElementById(`proof-${taskId}`);
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file to upload');
        return;
    }

    const formData = new FormData();
    formData.append('proof', file);
    formData.append('taskId', taskId);

    try {
        const response = await fetch(`/api/tasks/${currentFarmerId}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            alert(`Task completed! You earned 10 points. Total points: ${data.points}`);
            loadFarmerData();
            loadTasks();
        } else {
            alert('Error uploading proof');
        }
    } catch (error) {
        console.error('Error uploading proof:', error);
        alert('Error uploading proof');
    }
}

// Rewards Functions
async function loadRewards() {
    try {
        const response = await fetch('/api/rewards');
        const rewards = await response.json();
        
        // Update current points display
        document.getElementById('currentPoints').textContent = farmerData?.points || 0;
        
        const rewardsContainer = document.getElementById('rewardsList');
        rewardsContainer.innerHTML = '';
        
        rewards.forEach(reward => {
            const rewardCard = document.createElement('div');
            rewardCard.className = 'reward-card';
            
            const canAfford = (farmerData?.points || 0) >= reward.cost;
            
            rewardCard.innerHTML = `
                <div class="reward-icon">🎁</div>
                <h3 class="reward-name">${reward.name}</h3>
                <p class="reward-cost">${reward.cost} Points</p>
                <p class="reward-description">${reward.description}</p>
                <button class="redeem-btn" ${!canAfford ? 'disabled' : ''} 
                        onclick="redeemReward(${reward.id}, ${reward.cost})">
                    ${canAfford ? 'Redeem' : 'Insufficient Points'}
                </button>
            `;
            
            rewardsContainer.appendChild(rewardCard);
        });
    } catch (error) {
        console.error('Error loading rewards:', error);
    }
}

async function redeemReward(rewardId, cost) {
    if ((farmerData?.points || 0) < cost) {
        alert('Insufficient points');
        return;
    }

    if (!confirm(`Are you sure you want to redeem this reward for ${cost} points?`)) {
        return;
    }

    try {
        const response = await fetch('/api/rewards/redeem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ farmerId: currentFarmerId, rewardId }),
        });

        const data = await response.json();

        if (data.success) {
            alert(`Reward redeemed successfully! Remaining points: ${data.remainingPoints}`);
            loadFarmerData();
            loadRewards();
        } else {
            alert(data.error || 'Error redeeming reward');
        }
    } catch (error) {
        console.error('Error redeeming reward:', error);
        alert('Error redeeming reward');
    }
}

// Market Functions
async function loadMarketPrices() {
    try {
        const response = await fetch('/api/market/prices');
        const prices = await response.json();
        
        const pricesContainer = document.getElementById('pricesGrid');
        pricesContainer.innerHTML = '';
        
        Object.entries(prices).forEach(([crop, price]) => {
            const priceCard = document.createElement('div');
            priceCard.className = 'price-card';
            
            priceCard.innerHTML = `
                <h3 class="crop-name">${crop}</h3>
                <div class="crop-price">₹${price}</div>
                <div class="price-unit">per kg</div>
            `;
            
            pricesContainer.appendChild(priceCard);
        });
        
        // Load active alerts
        loadActiveAlerts();
    } catch (error) {
        console.error('Error loading market prices:', error);
    }
}

async function loadActiveAlerts() {
    try {
        // Get alerts from localStorage or make API call
        const alerts = JSON.parse(localStorage.getItem('priceAlerts') || '[]');
        const alertsContainer = document.getElementById('activeAlerts');
        
        if (alerts.length === 0) {
            alertsContainer.innerHTML = '<p style="color: rgba(255,255,255,0.6);">No active alerts</p>';
            return;
        }
        
        alertsContainer.innerHTML = '';
        alerts.forEach((alert, index) => {
            const alertItem = document.createElement('div');
            alertItem.className = 'alert-item';
            alertItem.innerHTML = `
                <div>
                    <span class="alert-crop">${alert.crop}</span>
                    <span style="color: rgba(255,255,255,0.8); margin-left: 10px;">Target: ₹${alert.targetPrice}/kg</span>
                </div>
                <button onclick="removeAlert(${index})" style="background: #f44336; border: none; border-radius: 4px; color: white; padding: 4px 8px; cursor: pointer;">Remove</button>
            `;
            alertsContainer.appendChild(alertItem);
        });
    } catch (error) {
        console.error('Error loading alerts:', error);
    }
}

function removeAlert(index) {
    const alerts = JSON.parse(localStorage.getItem('priceAlerts') || '[]');
    alerts.splice(index, 1);
    localStorage.setItem('priceAlerts', JSON.stringify(alerts));
    loadActiveAlerts();
}
async function setAlert() {
    const crop = document.getElementById('alertCrop').value;
    const targetPrice = document.getElementById('targetPrice').value;
    
    if (!crop || !targetPrice) {
        alert('Please select crop and enter target price');
        return;
    }

    try {
        const response = await fetch('/api/market/alerts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                farmerId: currentFarmerId, 
                crop, 
                targetPrice: parseFloat(targetPrice) 
            }),
        });

        const data = await response.json();

        if (data.success) {
            // Store alert locally for display
            const alerts = JSON.parse(localStorage.getItem('priceAlerts') || '[]');
            alerts.push({ crop, targetPrice: parseFloat(targetPrice) });
            localStorage.setItem('priceAlerts', JSON.stringify(alerts));
            
            alert(`Price alert set for ${crop} at ₹${targetPrice}/kg`);
            document.getElementById('alertCrop').value = '';
            document.getElementById('targetPrice').value = '';
            loadActiveAlerts();
        } else {
            alert('Error setting alert');
        }
    } catch (error) {
        console.error('Error setting alert:', error);
        alert('Error setting alert');
    }
}

// Government Bonus Functions
document.getElementById('bonusForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        farmerId: currentFarmerId,
        crop: document.getElementById('bonusCrop').value,
        quantity: parseFloat(document.getElementById('bonusQuantity').value),
        basePrice: parseFloat(document.getElementById('bonusBasePrice').value),
        district: document.getElementById('bonusDistrict').value,
        buyer: document.getElementById('bonusBuyer').value,
    };

    try {
        const response = await fetch('/api/govt/bonus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (data.success) {
            const bonusAmount = data.totalAmount - (formData.basePrice * formData.quantity);
            document.getElementById('bonusResult').style.display = 'block';
            document.getElementById('bonusResult').innerHTML = `
                <h3>Government Bonus Calculation</h3>
                <p><strong>Crop:</strong> ${formData.crop}</p>
                <p><strong>District:</strong> ${formData.district}</p>
                <p><strong>Buyer:</strong> ${formData.buyer}</p>
                <p><strong>Base Price:</strong> ₹${formData.basePrice}/quintal</p>
                <p><strong>Bonus Price:</strong> ₹${data.bonusPrice}/quintal (10% bonus)</p>
                <p><strong>Quantity:</strong> ${formData.quantity} quintals</p>
                <p><strong>Total Amount:</strong> ₹${data.totalAmount}</p>
                <p><strong>Bonus Earned:</strong> ₹${bonusAmount}</p>
                <p style="color: #4CAF50; font-weight: bold;">Sale registered successfully!</p>
            `;
            
            // Reset form
            document.getElementById('bonusForm').reset();
            
            // Load recent sales
            loadRecentSales();
        } else {
            alert('Error processing bonus');
        }
    } catch (error) {
        console.error('Error processing bonus:', error);
        alert('Error processing bonus');
    }
});

async function loadRecentSales() {
    try {
        // Get sales from localStorage or make API call
        const sales = JSON.parse(localStorage.getItem('recentSales') || '[]');
        const salesContainer = document.getElementById('recentSales');
        
        if (sales.length === 0) {
            salesContainer.innerHTML = '<p style="color: rgba(255,255,255,0.6);">No recent sales</p>';
            return;
        }
        
        salesContainer.innerHTML = '';
        sales.slice(-5).reverse().forEach(sale => {
            const saleItem = document.createElement('div');
            saleItem.className = 'sale-item';
            saleItem.innerHTML = `
                <div class="sale-header">
                    <span class="sale-crop">${sale.crop}</span>
                    <span class="sale-amount">₹${sale.totalAmount}</span>
                </div>
                <div class="sale-details">
                    ${sale.quantity} quintals • ${sale.district} • ${sale.buyer} • ${new Date(sale.date).toLocaleDateString()}
                </div>
            `;
            salesContainer.appendChild(saleItem);
        });
    } catch (error) {
        console.error('Error loading recent sales:', error);
    }
}
// Leaderboard Functions
async function loadLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard');
        const farmers = await response.json();
        
        const leaderboardContainer = document.getElementById('leaderboardList');
        leaderboardContainer.innerHTML = '';
        
        if (farmers.length === 0) {
            leaderboardContainer.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.8);">No farmers found. Complete your profile to appear on the leaderboard.</p>';
            return;
        }
        
        farmers.forEach((farmer, index) => {
            const position = index + 1;
            const rankClass = position === 1 ? 'first' : position === 2 ? 'second' : position === 3 ? 'third' : '';
            
            const leaderboardItem = document.createElement('div');
            leaderboardItem.className = 'leaderboard-item';
            
            leaderboardItem.innerHTML = `
                <div class="rank ${rankClass}">${position}</div>
                <div class="farmer-info">
                    <div class="farmer-name">${farmer.name || 'Anonymous Farmer'}</div>
                    <div class="farmer-location">${farmer.location || 'Unknown Location'}</div>
                    <div class="farmer-crop">${farmer.mainCrop || 'Various Crops'}</div>
                </div>
                <div class="farmer-stats">
                    <div class="farmer-points">${farmer.points} pts</div>
                    <div class="farmer-sustainability">${farmer.sustainabilityScore}% sustainable</div>
                </div>
            `;
            
            leaderboardContainer.appendChild(leaderboardItem);
        });
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        document.getElementById('leaderboardList').innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.8);">Error loading leaderboard</p>';
    }
}

// Voice Assistant Functions
function speakInLanguage(language) {
    if (!('speechSynthesis' in window)) {
        alert('Speech synthesis not supported in this browser');
        return;
    }

    const text = voiceTexts[currentPage]?.[language] || voiceTexts.dashboard[language];
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.8;
    utterance.pitch = 1;
    
    speechSynthesis.speak(utterance);
}

// Utility Functions
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('farmerId');
        currentFarmerId = null;
        farmerData = null;
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
    }
}

// Auto-format Aadhaar input
document.getElementById('aadhaarNumber')?.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
    e.target.value = value;
});

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    const savedFarmerId = localStorage.getItem('farmerId');
    if (savedFarmerId) {
        currentFarmerId = savedFarmerId;
        showDashboard();
    }
    
    // Test voice support
    testVoiceSupport();
});