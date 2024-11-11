const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let lastObstacleTime = 0;
let minObstacleSpacing = 100;

canvas.width = 800;
canvas.height = 300;

// Game objects
const bus = {
    x: 50,
    y: 182,
    width: 60,
    height: 30,
    jumping: false,
    jumpForce: 0,
    jumpHeight: -15,
};

const obstacles = [];
const trees = [];
let score = 0;
let gameSpeed = 5;
let biomeTimer = 0;
let currentBiome = 'plains';

// Game state
let isGameOver = false;
let groundY = 230;

// Event listeners
document.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'ArrowUp') && !bus.jumping) {
        bus.jumping = true;
        bus.jumpForce = bus.jumpHeight;
    }
});

function drawBus() {
    // Main body
    ctx.fillStyle = '#8A2BE2'; // Purple
    ctx.fillRect(bus.x, bus.y, bus.width, bus.height);
    
    // Roof
    ctx.fillStyle = '#7B1FA2'; // Darker purple for roof
    ctx.fillRect(bus.x, bus.y - 5, bus.width, 8);
    
    // Windows
    ctx.fillStyle = '#ADD8E6'; // Light blue
    // Front window (driver)
    ctx.fillRect(bus.x + 45, bus.y + 3, 12, 12);
    // Passenger windows
    ctx.fillRect(bus.x + 30, bus.y + 3, 12, 12);
    ctx.fillRect(bus.x + 16, bus.y + 3, 12, 12);
    ctx.fillRect(bus.x+1, bus.y + 3, 12, 12);
    
    // Window frames
    ctx.strokeStyle = '#4A148C'; // Dark purple
    ctx.lineWidth = 1;
    ctx.strokeRect(bus.x + 45, bus.y + 3, 12, 12);
    ctx.strokeRect(bus.x + 30, bus.y + 3, 12, 12);
    ctx.strokeRect(bus.x + 16, bus.y + 3, 12, 12);
    ctx.strokeRect(bus.x+1, bus.y + 3, 12, 12);
    
    // Wheels
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(bus.x + 15, bus.y + 30, 5, 0, Math.PI * 2);
    ctx.arc(bus.x + 45, bus.y + 30, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Wheel rims
    ctx.fillStyle = '#777';
    ctx.beginPath();
    ctx.arc(bus.x + 15, bus.y + 30, 2, 0, Math.PI * 2);
    ctx.arc(bus.x + 45, bus.y + 30, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Headlight
    ctx.fillStyle = '#FFF9C4';
    ctx.fillRect(bus.x + 55, bus.y + 20, 4, 4);
}

function createObstacle() {
    const maxHeight = 40;
    const minHeight = 20;
    const height = minHeight + Math.random() * (maxHeight - minHeight);
    
    obstacles.push({
        x: canvas.width,
        y: groundY - height - 5,
        width: 20,
        height: height
    });
    lastObstacleTime = 0;
}

function createTree() {
    const height = 80 + Math.random() * 100;
    trees.push({
        x: canvas.width,
        y: groundY - height+40+Math.random()*10,
        width: 30,
        height: height
    });
}

function drawObstacles() {
    const pattern = ctx.createPattern(obstacleTexture, 'repeat');
    obstacles.forEach(obstacle => {
        ctx.fillStyle = pattern;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Add highlight edge
        ctx.strokeStyle = '#777';
        ctx.lineWidth = 2;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

function drawTrees() {
    trees.forEach(tree => {
        // Tree trunk with texture
        const trunkPattern = createNoiseTexture(10, 40, 
            [139, 69, 19],  // Brown
            [119, 49, 9]    // Darker brown
        );
        ctx.fillStyle = ctx.createPattern(trunkPattern, 'repeat');
        ctx.fillRect(tree.x + 10, tree.y + tree.height - 40, 10, 40);
        
        // Tree leaves with texture
        const leavesPattern = createNoiseTexture(30, 50,
            [34, 139, 34],  // Forest green
            [24, 119, 24]   // Darker forest green
        );
        ctx.fillStyle = ctx.createPattern(leavesPattern, 'repeat');
        ctx.beginPath();
        ctx.moveTo(tree.x, tree.y + tree.height - 40);
        ctx.lineTo(tree.x + 15, tree.y);
        ctx.lineTo(tree.x + 30, tree.y + tree.height - 40);
        ctx.closePath();
        ctx.fill();
        
        // Add outline to leaves
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 1;
        ctx.stroke();
    });
}

function drawGround() {
    const pattern = ctx.createPattern(
        currentBiome === 'plains' ? grassTexture : forestTexture, 
        'repeat'
    );
    ctx.fillStyle = pattern;
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    
    // Add some random grass blades with reduced height
    ctx.strokeStyle = currentBiome === 'plains' ? '#90EE90' : '#228B22';
    for (let i = 0; i < canvas.width; i += 30) { // Increased spacing between grass
        const grassHeight = Math.random() * 5; // Reduced from 10 to 5
        ctx.beginPath();
        ctx.moveTo(i, groundY);
        ctx.lineTo(i, groundY - grassHeight);
        ctx.stroke();
    }
}

function updateGame() {
    if (isGameOver) return;

    // Add this line to update road marking animation
    roadMarkingOffset += roadMarkingSpeed;
    if (roadMarkingOffset > 40) {
        roadMarkingOffset = 0;
    }

    // Update bus jump with proper physics
    if (bus.jumping) {
        bus.y += bus.jumpForce;
        bus.jumpForce += 0.8;

        if (bus.y >= groundY - 45) {
            bus.y = groundY - 45;
            bus.jumping = false;
            bus.jumpForce = 0;
        }
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            score++;
        }
    }

    // Update trees
    for (let i = trees.length - 1; i >= 0; i--) {
        trees[i].x -= gameSpeed * 0.7;
        if (trees[i].x + trees[i].width < 0) {
            trees.splice(i, 1);
        }
    }

    // Collision detection
    obstacles.forEach(obstacle => {
        const hitboxPadding = 5;
        if (
            bus.x + hitboxPadding < obstacle.x + obstacle.width &&
            bus.x + bus.width - hitboxPadding > obstacle.x &&
            bus.y + hitboxPadding < obstacle.y + obstacle.height &&
            bus.y + bus.height - hitboxPadding > obstacle.y
        ) {
            isGameOver = true;
        }
    });

    // Spawn obstacles with proper spacing
    lastObstacleTime++;
    if (lastObstacleTime > minObstacleSpacing) {
        if (Math.random() < 0.04) {
            createObstacle();
        }
    }

    // Spawn trees
    if (Math.random() < 0.02) {
        createTree();
    }

    // Update biome
    biomeTimer++;
    if (biomeTimer > 300) {
        biomeTimer = 0;
        currentBiome = currentBiome === 'plains' ? 'forest' : 'plains';
    }

    // Increase game speed
    gameSpeed += 0.001;

    // Update weather
    weatherTimer++;
    if (weatherTimer > weatherDuration) {
        weatherTimer = 0;
        weather = weather === 'sunny' ? 'rainy' : 'sunny';
    }

    // Update clouds
    for (let i = clouds.length - 1; i >= 0; i--) {
        clouds[i].x -= clouds[i].speed;
        if (clouds[i].x + clouds[i].width < 0) {
            clouds.splice(i, 1);
        }
    }

    // Create new clouds
    if (Math.random() < 0.005) {
        createCloud();
    }

    // Update rain
    if (weather === 'rainy') {
        // Create new raindrops
        if (Math.random() < 0.3) {
            createRaindrop();
        }

        // Update existing raindrops
        for (let i = raindrops.length - 1; i >= 0; i--) {
            raindrops[i].y += raindrops[i].speed;
            if (raindrops[i].y > groundY) {
                raindrops.splice(i, 1);
            }
        }
    } else {
        // Clear raindrops when weather is sunny
        raindrops.length = 0;
    }
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 20, 30);
}

function gameLoop() {
    console.log('Game loop running');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background elements first
    drawSky();
    drawClouds();
    drawRain();
    drawGround();
    drawRoad();
    
    // Middle layer - bus and obstacles
    drawObstacles();
    drawBus();
    
    // Foreground layer - trees will be drawn last to appear in front
    drawTrees();
    
    // UI elements
    drawScore();

    if (isGameOver) {
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.fillText('Game Over!', canvas.width/2 - 100, canvas.height/2);
        ctx.font = '20px Arial';
        ctx.fillText('Press R to restart', canvas.width/2 - 80, canvas.height/2 + 40);
    } else {
        updateGame();
    }

    requestAnimationFrame(gameLoop);
}

// Restart game handler
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyR' && isGameOver) {
        isGameOver = false;
        score = 0;
        gameSpeed = 5;
        obstacles.length = 0;
        trees.length = 0;
        clouds.length = 0;
        raindrops.length = 0;
        bus.y = 200;
        bus.jumping = false;
        biomeTimer = 0;
        weatherTimer = 0;
        weather = 'sunny';
        roadMarkingOffset = 0; // Reset road marking animation
    }
});

// Add texture creation function at the top
function createNoiseTexture(width, height, color1, color2) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    const imageData = tempCtx.createImageData(width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const color = Math.random() > 0.5 ? color1 : color2;
        data[i] = color[0];     // R
        data[i + 1] = color[1]; // G
        data[i + 2] = color[2]; // B
        data[i + 3] = 255;      // A
    }
    
    tempCtx.putImageData(imageData, 0, 0);
    return tempCanvas;
}

// Create and store textures
const grassTexture = createNoiseTexture(80, 80, 
    [144, 238, 144], // Light green
    [124, 218, 124]  // Slightly darker green
);

const forestTexture = createNoiseTexture(100, 100,
    [34, 139, 34],   // Forest green
    [24, 119, 24]    // Darker forest green
);

const obstacleTexture = createNoiseTexture(20, 40,
    [102, 102, 102], // Light gray
    [92, 92, 92]     // Darker gray
);

// Add these new variables at the top with other game state variables
const clouds = [];
let weather = 'sunny';
let weatherTimer = 0;
const weatherDuration = 600; // Duration of each weather state in frames
const raindrops = [];

// Add these texture variables after other texture declarations
const asphaltTexture = createNoiseTexture(100, 100,
    [50, 50, 50],    // Dark grey
    [60, 60, 60]     // Slightly lighter grey
);

// Add road marking animation variables at the top with other game state variables
let roadMarkingOffset = 0;
const roadMarkingSpeed = -1.5; // Speed of the marking animation

// Add this new function to draw the road
function drawRoad() {
    const roadHeight = 40;
    const roadY = groundY - roadHeight/2;
    
    // Draw asphalt
    const pattern = ctx.createPattern(asphaltTexture, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, roadY, canvas.width, roadHeight);
    
    // Draw road edges
    ctx.fillStyle = '#777';
    ctx.fillRect(0, roadY, canvas.width, 2);
    ctx.fillRect(0, roadY + roadHeight, canvas.width, 2);
    
    // Draw animated dashed line in the middle of the road
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]); // Create dashed line pattern
    ctx.lineDashOffset = -roadMarkingOffset; // Animate the dash
    ctx.beginPath();
    ctx.moveTo(0, roadY + roadHeight/2);
    ctx.lineTo(canvas.width, roadY + roadHeight/2);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash
}

// Add this new function to create clouds
function createCloud() {
    clouds.push({
        x: canvas.width,
        y: 30 + Math.random() * 50,
        width: 60 + Math.random() * 40,
        height: 20 + Math.random() * 20,
        speed: 1 + Math.random() * 0.5
    });
}

// Add function to create raindrops
function createRaindrop() {
    raindrops.push({
        x: Math.random() * canvas.width,
        y: 0,
        speed: 7 + Math.random() * 5,
        length: 10 + Math.random() * 10
    });
}

// Add function to draw clouds
function drawClouds() {
    ctx.fillStyle = '#FFFFFF';
    clouds.forEach(cloud => {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.height/2, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width/3, cloud.y - cloud.height/4, cloud.height/2, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width/1.5, cloud.y, cloud.height/1.5, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Add function to draw rain
function drawRain() {
    if (weather === 'rainy') {
        ctx.strokeStyle = '#ADD8E6';
        ctx.lineWidth = 1;
        raindrops.forEach(drop => {
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x - 2, drop.y + drop.length);
            ctx.stroke();
        });
    }
}

// Add function to draw sky
function drawSky() {
    // Create gradient for sky
    let gradient = ctx.createLinearGradient(0, 0, 0, groundY);
    if (weather === 'sunny') {
        gradient.addColorStop(0, '#87CEEB');  // Light blue
        gradient.addColorStop(1, '#B0E2FF');  // Slightly darker blue
    } else {
        gradient.addColorStop(0, '#465A61');  // Dark grey
        gradient.addColorStop(1, '#98A5A8');  // Lighter grey
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, groundY);
}

// Start the game
gameLoop(); 