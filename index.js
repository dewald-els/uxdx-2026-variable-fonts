// DOM Elements
const displayText = document.getElementById('display-text');
const axesContainer = document.getElementById('axes-container');
const fontSettings = document.getElementById('font-settings');
const animateBtn = document.getElementById('animate-btn');
const animateColorsCheckbox = document.getElementById('animate-colors');
const fontToggles = document.querySelectorAll('.font-toggle');

// State
let currentAxes = {};
let currentFont = 'google-sans-flex';
let isAnimating = false;
let animationInterval = null;

// Color palette matching the theme
const colorPalette = [
    '#8776ED', // Purple (primary)
    '#5CC6CE', // Cyan (secondary)
    '#1a1a2e', // Dark navy
    '#a68bff', // Light purple
    '#3dd9e6', // Light cyan
    '#6b5ce7', // Deep purple
    '#48c9d4', // Medium cyan
    '#2d2d4a', // Slate
];

// Font configurations
const fontConfigs = {
    'google-sans-flex': {
        family: 'Google Sans Flex',
        axes: [
            { tag: 'wght', name: 'Weight', min: 1, max: 1000, default: 400 },
            { tag: 'wdth', name: 'Width', min: 25, max: 151, default: 100 },
            { tag: 'GRAD', name: 'Grade', min: 0, max: 100, default: 0 },
            { tag: 'ROND', name: 'Roundness', min: 0, max: 100, default: 98 },
            { tag: 'slnt', name: 'Slant', min: -10, max: 0, default: 0 },
            { tag: 'opsz', name: 'Optical Size', min: 6, max: 144, default: 18 }
        ]
    },
    'sixtyfour': {
        family: 'Sixtyfour',
        axes: [
            { tag: 'BLED', name: 'Bleed (Custom)', min: -100, max: 100, default: 0 },
            { tag: 'SCAN', name: 'Scan (Custom)', min: -100, max: 100, default: 0 },
            { tag: 'XELA', name: 'X Elasticity (Custom)', min: -100, max: 100, default: 0 },
            { tag: 'YELA', name: 'Y Elasticity (Custom)', min: -100, max: 100, default: 0 }
        ]
    }
};

// Get current axes configuration
let axes = fontConfigs[currentFont].axes;

// Initialize
function init() {
    // Set up font toggle listeners
    fontToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const font = toggle.dataset.font;
            switchFont(font);
        });
    });
    
    // Load initial font
    loadFont(currentFont);
}

// Switch to a different font
function switchFont(font) {
    if (font === currentFont) return;
    
    // Stop any animation
    if (isAnimating) {
        toggleAnimation();
    }
    
    currentFont = font;
    axes = fontConfigs[font].axes;
    
    // Update toggle button states
    fontToggles.forEach(toggle => {
        if (toggle.dataset.font === font) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
    });
    
    // Load the new font
    loadFont(font);
}

// Load a font configuration
function loadFont(font) {
    const config = fontConfigs[font];
    
    // Update display text font family
    displayText.style.fontFamily = `"${config.family}", sans-serif`;
    
    // Clear existing controls
    axesContainer.innerHTML = '';
    currentAxes = {};
    
    // Create sliders for each axis
    config.axes.forEach(axis => {
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
    // Get current axes configuration
    const currentAxesConfig = fontConfigs[currentFont].axes;
    
    // Store target values for each axis
    const targets = {};
    const startValues = {};
    const durations = {};
    
    // Cache DOM elements
    const sliders = {};
    const valueDisplays = {};
    
    // Pick random targets for all axes
    currentAxesConfig.forEach(axis => {
        const { tag, min, max } = axis;
        startValues[tag] = currentAxes[tag];
        
        // Limit width to 100 for animation only
        const animMax = tag === 'wdth' ? 100 : max;
        
        targets[tag] = min + Math.random() * (animMax - min);
        durations[tag] = 600 + Math.random() * 600; // 0.6-1.2 seconds per transition
        
        // Cache DOM lookups
        sliders[tag] = document.getElementById(`axis-${tag}`);
        valueDisplays[tag] = document.getElementById(`value-${tag}`);
    });
    
    // Color animation setup
    let startColor = null;
    let targetColor = null;
    let colorDuration = 0;
    
    if (animateColorsCheckbox.checked) {
        const currentColor = window.getComputedStyle(displayText).color;
        startColor = currentColor;
        targetColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colorDuration = 600 + Math.random() * 600;
    }
    
    const startTime = performance.now();
    
    function animate(timestamp) {
        if (!isAnimating) return;
        
        const elapsed = timestamp - startTime;
        let allComplete = true;
        
        currentAxesConfig.forEach(axis => {
            const { tag, min, max } = axis;
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
                
                // Update slider and value display
                if (sliders[tag]) {
                    sliders[tag].value = currentValue;
                }
                
                if (valueDisplays[tag]) {
                    const range = Math.abs(max - min);
                    const step = range > 100 ? 1 : (range > 10 ? 0.1 : 0.01);
                    const displayValue = (step >= 1) ? Math.round(currentValue) : currentValue.toFixed(step < 0.1 ? 2 : 1);
                    valueDisplays[tag].textContent = displayValue;
                }
            } else {
                // Reached target, set to exact value
                currentAxes[tag] = targets[tag];
            }
        });
        
        // Animate color if enabled
        if (animateColorsCheckbox.checked && targetColor && elapsed < colorDuration) {
            allComplete = false;
            displayText.style.color = targetColor;
        }
        
        // Update font variation once per frame
        const settings = Object.entries(currentAxes)
            .map(([tag, value]) => `"${tag}" ${value}`)
            .join(', ');
        displayText.style.fontVariationSettings = settings;
        
        // Update CSS display less frequently to reduce reflows
        if (Math.floor(elapsed / 50) % 2 === 0) {
            updateFontSettings();
        }
        
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

// Reset color when checkbox is unchecked
animateColorsCheckbox.addEventListener('change', (e) => {
    if (!e.target.checked) {
        displayText.style.color = '#1a1a2e';
    }
});

// Start the app
init();
