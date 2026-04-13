// DOM Elements
const displayText = document.getElementById('display-text');
const axesContainer = document.getElementById('axes-container');
const fontSettings = document.getElementById('font-settings');
const animateBtn = document.getElementById('animate-btn');

// State
let currentAxes = {};
let isAnimating = false;
let animationInterval = null;

// Google Sans Flex axes (exact values from Wakamai Fondue)
const axes = [
    { tag: 'wght', name: 'Weight', min: 1, max: 1000, default: 400 },
    { tag: 'wdth', name: 'Width', min: 25, max: 151, default: 100 },
    { tag: 'GRAD', name: 'Grade', min: 0, max: 100, default: 0 },
    { tag: 'ROND', name: 'Roundness', min: 0, max: 100, default: 98 },
    { tag: 'slnt', name: 'Slant', min: -10, max: 10, default: 0 },
    { tag: 'opsz', name: 'Optical Size', min: 6, max: 144, default: 18 }
];

// Initialize
function init() {
    // Create sliders for each axis
    axes.forEach(axis => {
        createAxisControl(axis);
    });
    
    // Set initial values
    updateFontVariation();
    updateFontSettings();
}

// Create a slider control for an axis
function createAxisControl(axis) {
    const { tag, name, min, max, default: defaultValue } = axis;
    
    // Initialize axis value
    currentAxes[tag] = defaultValue;
    
    // Create control container
    const control = document.createElement('div');
    control.className = 'axis-control';
    
    // Determine step size
    const range = Math.abs(max - min);
    const step = range > 100 ? 1 : (range > 10 ? 0.1 : 0.01);
    
    control.innerHTML = `
        <div class="axis-header">
            <span class="axis-label">${name}</span>
            <span class="axis-tag">${tag}</span>
        </div>
        <div class="axis-slider">
            <div class="slider-wrapper">
                <input 
                    type="range" 
                    id="axis-${tag}" 
                    min="${min}" 
                    max="${max}" 
                    value="${defaultValue}" 
                    step="${step}"
                />
                <div class="range-labels">
                    <span>${Math.round(min)}</span>
                    <span>${Math.round(max)}</span>
                </div>
            </div>
            <span class="axis-value" id="value-${tag}">${Math.round(defaultValue)}</span>
        </div>
    `;
    
    axesContainer.appendChild(control);
    
    // Add event listener
    const slider = document.getElementById(`axis-${tag}`);
    const valueDisplay = document.getElementById(`value-${tag}`);
    
    slider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        currentAxes[tag] = value;
        
        // Format display value
        const displayValue = (step >= 1) ? Math.round(value) : value.toFixed(step < 0.1 ? 2 : 1);
        valueDisplay.textContent = displayValue;
        
        updateFontVariation();
        updateFontSettings();
    });
}

// Update the font variation settings
function updateFontVariation() {
    const settings = Object.entries(currentAxes)
        .map(([tag, value]) => `"${tag}" ${value}`)
        .join(', ');
    
    console.log('Applying font-variation-settings:', settings);
    displayText.style.fontVariationSettings = settings;
    displayText.style.fontOpticalSizing = 'auto';
}

// Update the settings display
function updateFontSettings() {
    const settings = Object.entries(currentAxes)
        .map(([tag, value]) => {
            const displayValue = (value % 1 === 0) ? value : value.toFixed(2);
            return `"${tag}" ${displayValue}`;
        })
        .join(', ');
    
    fontSettings.textContent = `font-variation-settings: ${settings};`;
}

// Animation functions
function toggleAnimation() {
    isAnimating = !isAnimating;
    
    if (isAnimating) {
        animateBtn.classList.add('active');
        animateBtn.textContent = '⏸ Stop';
        startAnimation();
    } else {
        animateBtn.classList.remove('active');
        animateBtn.textContent = '✨ Animate';
        stopAnimation();
    }
}

function startAnimation() {
    // Store target values for each axis
    const targets = {};
    const startValues = {};
    const durations = {};
    
    // Pick random targets for all axes
    axes.forEach(axis => {
        const { tag, min, max } = axis;
        startValues[tag] = currentAxes[tag];
        
        // Limit width to 100 for animation only
        const animMax = tag === 'wdth' ? 100 : max;
        
        targets[tag] = min + Math.random() * (animMax - min);
        durations[tag] = 800 + Math.random() * 800; // 0.8-1.6 seconds per transition
    });
    
    const startTime = Date.now();
    
    function animate() {
        if (!isAnimating) return;
        
        const now = Date.now();
        let allComplete = true;
        
        axes.forEach(axis => {
            const { tag, min, max } = axis;
            const elapsed = now - startTime;
            const duration = durations[tag];
            
            if (elapsed < duration) {
                allComplete = false;
                // Smooth easing function (ease-in-out)
                const progress = elapsed / duration;
                const eased = progress < 0.5 
                    ? 2 * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                
                const currentValue = startValues[tag] + (targets[tag] - startValues[tag]) * eased;
                currentAxes[tag] = currentValue;
                
                // Update the slider
                const slider = document.getElementById(`axis-${tag}`);
                const valueDisplay = document.getElementById(`value-${tag}`);
                
                if (slider && valueDisplay) {
                    slider.value = currentValue;
                    const range = Math.abs(max - min);
                    const step = range > 100 ? 1 : (range > 10 ? 0.1 : 0.01);
                    const displayValue = (step >= 1) ? Math.round(currentValue) : currentValue.toFixed(step < 0.1 ? 2 : 1);
                    valueDisplay.textContent = displayValue;
                }
            } else {
                // Reached target, set to exact value
                currentAxes[tag] = targets[tag];
            }
        });
        
        updateFontVariation();
        updateFontSettings();
        
        if (allComplete) {
            // All axes reached their targets, pick new ones
            startAnimation();
        } else {
            animationInterval = requestAnimationFrame(animate);
        }
    }
    
    animationInterval = requestAnimationFrame(animate);
}

function stopAnimation() {
    if (animationInterval) {
        cancelAnimationFrame(animationInterval);
        animationInterval = null;
    }
}

// Event listeners
animateBtn.addEventListener('click', toggleAnimation);

// Start the app
init();
