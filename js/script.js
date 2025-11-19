// ========================================
// ENHANCED THREE.JS 3D UNIVERSE SCENE
// ========================================
const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.set(0, 0, 50);

// ========================================
// STARS - Multiple layers for depth
// ========================================
function createStarField(count, size, color, spread) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * spread;
        positions[i + 1] = (Math.random() - 0.5) * spread;
        positions[i + 2] = (Math.random() - 0.5) * spread;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        size: size,
        color: color,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    return new THREE.Points(geometry, material);
}

const starField1 = createStarField(3000, 0.5, 0xffffff, 400);
const starField2 = createStarField(2000, 0.8, 0x00f5ff, 350);
const starField3 = createStarField(1500, 1.2, 0xff00ea, 300);
scene.add(starField1, starField2, starField3);

// ========================================
// GALAXY SPIRAL EFFECT
// ========================================
const galaxyParticles = new THREE.Group();
const galaxyCount = 8000;
const galaxyGeometry = new THREE.BufferGeometry();
const galaxyPositions = new Float32Array(galaxyCount * 3);
const galaxyColors = new Float32Array(galaxyCount * 3);

for (let i = 0; i < galaxyCount; i++) {
    const i3 = i * 3;
    const radius = Math.random() * 80;
    const spinAngle = radius * 0.3;
    const branchAngle = ((i % 6) / 6) * Math.PI * 2;
    
    const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 3;
    const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 3;
    const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 3;
    
    galaxyPositions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
    galaxyPositions[i3 + 1] = randomY;
    galaxyPositions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;
    
    const color = new THREE.Color();
    color.setHSL(0.6 + Math.random() * 0.2, 1.0, 0.5 + Math.random() * 0.3);
    galaxyColors[i3] = color.r;
    galaxyColors[i3 + 1] = color.g;
    galaxyColors[i3 + 2] = color.b;
}

galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(galaxyPositions, 3));
galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(galaxyColors, 3));

const galaxyMaterial = new THREE.PointsMaterial({
    size: 0.3,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const galaxyPoints = new THREE.Points(galaxyGeometry, galaxyMaterial);
galaxyPoints.position.z = -150;
galaxyPoints.rotation.x = Math.PI / 4;
scene.add(galaxyPoints);

// ========================================
// REALISTIC SPIRAL GALAXY (Andromeda-style)
// ========================================
const realisticGalaxy = new THREE.Group();

// Galaxy Core (bright center)
const coreGeometry = new THREE.SphereGeometry(8, 32, 32);
const coreGradient = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 }
    },
    vertexShader: `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 vPosition;
        uniform float time;
        void main() {
            float dist = length(vPosition) / 8.0;
            vec3 color1 = vec3(1.0, 0.8, 0.6); // Orange
            vec3 color2 = vec3(1.0, 0.4, 0.8); // Pink
            vec3 color3 = vec3(0.4, 0.6, 1.0); // Blue
            
            vec3 color = mix(color1, color2, dist);
            color = mix(color, color3, dist * dist);
            
            float alpha = 1.0 - (dist * 0.8);
            gl_FragColor = vec4(color, alpha);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const galaxyCore = new THREE.Mesh(coreGeometry, coreGradient);

// Galaxy Disk with Spiral Pattern
const diskGeometry1 = new THREE.CircleGeometry(50, 128);
const diskMaterial1 = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform float time;
        
        float spiral(vec2 uv, float arms) {
            vec2 centered = uv - 0.5;
            float angle = atan(centered.y, centered.x);
            float radius = length(centered) * 2.0;
            
            float spiral = sin(angle * arms - radius * 10.0 + time * 0.5);
            return spiral;
        }
        
        void main() {
            vec2 centered = vUv - 0.5;
            float dist = length(centered) * 2.0;
            
            // Create spiral arms
            float spiralPattern = spiral(vUv, 3.0);
            spiralPattern = smoothstep(0.0, 0.3, spiralPattern);
            
            // Colors
            vec3 color1 = vec3(0.3, 0.5, 1.0); // Blue
            vec3 color2 = vec3(1.0, 0.3, 0.7); // Pink
            vec3 color3 = vec3(0.8, 0.6, 1.0); // Purple
            
            vec3 color = mix(color1, color2, dist);
            color = mix(color, color3, spiralPattern);
            
            // Fade out at edges
            float alpha = (1.0 - dist) * 0.6 * (0.5 + spiralPattern * 0.5);
            alpha = smoothstep(0.0, 0.5, alpha);
            
            gl_FragColor = vec4(color, alpha);
        }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const galaxyDisk = new THREE.Mesh(diskGeometry1, diskMaterial1);
galaxyDisk.rotation.x = -Math.PI / 2;

// Additional particle layer for galaxy arms
const armParticlesGeometry = new THREE.BufferGeometry();
const armCount = 15000;
const armPositions = new Float32Array(armCount * 3);
const armColors = new Float32Array(armCount * 3);

for (let i = 0; i < armCount; i++) {
    const i3 = i * 3;
    const radius = Math.random() * 50;
    const angle = (Math.random() * Math.PI * 2);
    const spiralOffset = radius * 0.3;
    const armNumber = Math.floor(Math.random() * 3);
    const armAngle = (armNumber * (Math.PI * 2 / 3)) + spiralOffset;
    
    const x = Math.cos(angle + armAngle) * radius;
    const z = Math.sin(angle + armAngle) * radius;
    const y = (Math.random() - 0.5) * 2 * (1 - radius / 50);
    
    armPositions[i3] = x;
    armPositions[i3 + 1] = y;
    armPositions[i3 + 2] = z;
    
    // Color gradient from center to edge
    const distFactor = radius / 50;
    const color = new THREE.Color();
    if (distFactor < 0.3) {
        color.setRGB(1.0, 0.9, 0.7); // Yellow center
    } else if (distFactor < 0.6) {
        color.setRGB(1.0, 0.4, 0.7); // Pink middle
    } else {
        color.setRGB(0.3, 0.5, 1.0); // Blue outer
    }
    
    armColors[i3] = color.r;
    armColors[i3 + 1] = color.g;
    armColors[i3 + 2] = color.b;
}

armParticlesGeometry.setAttribute('position', new THREE.BufferAttribute(armPositions, 3));
armParticlesGeometry.setAttribute('color', new THREE.BufferAttribute(armColors, 3));

const armParticlesMaterial = new THREE.PointsMaterial({
    size: 0.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const galaxyArms = new THREE.Points(armParticlesGeometry, armParticlesMaterial);

// Outer glow
const glowGeometry2 = new THREE.CircleGeometry(55, 64);
const glowMaterial2 = new THREE.MeshBasicMaterial({
    color: 0x6b4c9a,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
});
const outerGlow = new THREE.Mesh(glowGeometry2, glowMaterial2);
outerGlow.rotation.x = -Math.PI / 2;

// Assemble galaxy
realisticGalaxy.add(galaxyCore, galaxyDisk, galaxyArms, outerGlow);
realisticGalaxy.position.set(0, 20, -100);
realisticGalaxy.rotation.x = Math.PI / 6;
realisticGalaxy.rotation.y = Math.PI / 8;
scene.add(realisticGalaxy);

// ========================================
// BLACK HOLE with Event Horizon
// ========================================
const blackHoleGroup = new THREE.Group();

// Black hole core
const blackHoleGeometry = new THREE.SphereGeometry(8, 32, 32);
const blackHoleMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 1
});
const blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);

// Event Horizon glow
const glowGeometry1 = new THREE.SphereGeometry(12, 32, 32);
const glowMaterial1 = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
});
const glow = new THREE.Mesh(glowGeometry1, glowMaterial1);

// Accretion disk
const diskGeometry2 = new THREE.TorusGeometry(15, 3, 16, 100);
const diskMaterial2 = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
});
const accretionDisk = new THREE.Mesh(diskGeometry2, diskMaterial2);
accretionDisk.rotation.x = Math.PI / 2;

blackHoleGroup.add(blackHole, glow, accretionDisk);
blackHoleGroup.position.set(30, -20, -100);
scene.add(blackHoleGroup);

// ========================================
// PLANETS
// ========================================
const planets = [];

// Saturn-like planet
const saturnGeometry = new THREE.SphereGeometry(5, 32, 32);
const saturnMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4a460,
    emissive: 0x221100,
    metalness: 0.3,
    roughness: 0.7
});
const saturn = new THREE.Mesh(saturnGeometry, saturnMaterial);

// Saturn's rings
const ringGeometry = new THREE.TorusGeometry(7, 1.5, 2, 100);
const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xccaa88,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
});
const saturnRing = new THREE.Mesh(ringGeometry, ringMaterial);
saturnRing.rotation.x = Math.PI / 2;

const saturnGroup = new THREE.Group();
saturnGroup.add(saturn, saturnRing);
saturnGroup.position.set(-40, 15, -80);
scene.add(saturnGroup);
planets.push({ mesh: saturnGroup, speed: 0.002 });

// Jupiter-like planet
const jupiterGeometry = new THREE.SphereGeometry(7, 32, 32);
const jupiterMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4a574,
    emissive: 0x332211,
    metalness: 0.2,
    roughness: 0.8
});
const jupiter = new THREE.Mesh(jupiterGeometry, jupiterMaterial);
jupiter.position.set(50, -30, -120);
scene.add(jupiter);
planets.push({ mesh: jupiter, speed: 0.001 });

// Earth-like planet
const earthGeometry = new THREE.SphereGeometry(4, 32, 32);
const earthMaterial = new THREE.MeshStandardMaterial({
    color: 0x4169e1,
    emissive: 0x001133,
    metalness: 0.4,
    roughness: 0.6
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.position.set(-30, -40, -60);
scene.add(earth);
planets.push({ mesh: earth, speed: 0.003 });

// ========================================
// NEBULA CLOUDS
// ========================================
function createNebula(color, position, size) {
    const nebulaGeometry = new THREE.SphereGeometry(size, 32, 32);
    const nebulaMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
    nebula.position.copy(position);
    return nebula;
}

const nebula1 = createNebula(0xff00ff, new THREE.Vector3(40, 30, -150), 30);
const nebula2 = createNebula(0x00ffff, new THREE.Vector3(-50, -20, -180), 40);
const nebula3 = createNebula(0xff6600, new THREE.Vector3(20, -40, -120), 35);
scene.add(nebula1, nebula2, nebula3);


// ========================================
// SOLAR SYSTEM - Sun and 9 Planets
// ========================================
const solarSystem = new THREE.Group();
solarSystem.position.set(50, 0, -150); // Closer and centered
solarSystem.scale.set(1, 1, 1); // Visible by default
solarSystem.visible = true; // Always visible

// SUN - The center of our solar system
const sunGeometry = new THREE.SphereGeometry(15, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    emissive: 0xffa500,
    emissiveIntensity: 1
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);

// Sun glow effect
const sunGlowGeometry = new THREE.SphereGeometry(18, 64, 64);
const sunGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
});
const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);

// Sun corona (outer glow)
const coronaGeometry = new THREE.SphereGeometry(22, 64, 64);
const coronaMaterial = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
});
const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);

const sunGroup = new THREE.Group();
sunGroup.add(sun, sunGlow, corona);
solarSystem.add(sunGroup);

// Planet data: [name, size, color, orbitRadius, speed, hasRing]
const planetData = [
    { name: 'Mercury', size: 1.2, color: 0x8c7853, orbit: 25, speed: 0.04, ring: false },
    { name: 'Venus', size: 2.5, color: 0xffc649, orbit: 32, speed: 0.035, ring: false },
    { name: 'Earth', size: 2.6, color: 0x4169e1, orbit: 40, speed: 0.03, ring: false },
    { name: 'Mars', size: 1.8, color: 0xcd5c5c, orbit: 48, speed: 0.025, ring: false },
    { name: 'Jupiter', size: 8, color: 0xdaa520, orbit: 65, speed: 0.015, ring: false },
    { name: 'Saturn', size: 7, color: 0xf4a460, orbit: 82, speed: 0.012, ring: true },
    { name: 'Uranus', size: 4, color: 0x4fd0e7, orbit: 95, speed: 0.009, ring: true },
    { name: 'Neptune', size: 4, color: 0x4169e1, orbit: 105, speed: 0.007, ring: false },
    { name: 'Pluto', size: 0.8, color: 0xbc9574, orbit: 115, speed: 0.005, ring: false }
];

const solarPlanets = [];

planetData.forEach(data => {
    // Create planet
    const planetGeometry = new THREE.SphereGeometry(data.size, 32, 32);
    const planetMaterial = new THREE.MeshStandardMaterial({
        color: data.color,
        emissive: data.color,
        emissiveIntensity: 0.2,
        metalness: 0.4,
        roughness: 0.7
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    
    // Create orbit path (visual ring)
    const orbitGeometry = new THREE.RingGeometry(data.orbit - 0.1, data.orbit + 0.1, 128);
    const orbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
    });
    const orbitRing = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbitRing.rotation.x = Math.PI / 2;
    solarSystem.add(orbitRing);
    
    // Add rings for Saturn and Uranus
    if (data.ring) {
        const ringGeometry = new THREE.RingGeometry(
            data.size * 1.5, 
            data.size * 2.5, 
            64
        );
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: data.name === 'Saturn' ? 0xc4a570 : 0x90c4e0,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        planet.add(ring);
    }
    
    // GIVE EACH PLANET A RANDOM STARTING ANGLE
    const startAngle = Math.random() * Math.PI * 2;
    
    // Position planet in circular orbit using trigonometry
    planet.position.x = Math.cos(startAngle) * data.orbit;
    planet.position.z = Math.sin(startAngle) * data.orbit;
    planet.position.y = 0;
    
    // Add planet directly to solar system (no orbit group needed)
    solarSystem.add(planet);
    
    // Store reference for animation
    solarPlanets.push({
        planet: planet,
        speed: data.speed,
        orbitRadius: data.orbit,
        startAngle: startAngle, // Store starting angle
        name: data.name
    });
});

// Add asteroid belt between Mars and Jupiter
const asteroidBelt = new THREE.Group();
for (let i = 0; i < 500; i++) {
    const asteroidSize = Math.random() * 0.2 + 0.1;
    const asteroidGeometry = new THREE.SphereGeometry(asteroidSize, 8, 8);
    const asteroidMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        metalness: 0.5,
        roughness: 0.9
    });
    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    
    const angle = Math.random() * Math.PI * 2;
    const radius = 55 + Math.random() * 8; // Between Mars and Jupiter
    const height = (Math.random() - 0.5) * 2;
    
    asteroid.position.x = Math.cos(angle) * radius;
    asteroid.position.z = Math.sin(angle) * radius;
    asteroid.position.y = height;
    
    asteroidBelt.add(asteroid);
}
solarSystem.add(asteroidBelt);

// Add moon for Earth
const earthPlanet = solarPlanets.find(p => p.name === 'Earth');
if (earthPlanet) {
    const moonGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const moonMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        metalness: 0.2,
        roughness: 0.9
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.x = 5;
    earthPlanet.planet.add(moon);
    
    solarPlanets.push({
        orbit: earthPlanet.planet,
        planet: moon,
        speed: 0.05,
        orbitRadius: 5,
        name: 'Moon',
        isMoon: true
    });
}

scene.add(solarSystem);

// Add point light from the sun
const sunLight = new THREE.PointLight(0xffd700, 3, 200);
sunLight.position.copy(solarSystem.position);
scene.add(sunLight);

// ========================================
// ASTRONAUT (Simple representation)
// ========================================
const astronautGroup = new THREE.Group();

// Head
const headGeometry = new THREE.SphereGeometry(1.5, 32, 32);
const headMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0x222222
});
const head = new THREE.Mesh(headGeometry, headMaterial);
head.position.y = 2;

// Body (using CylinderGeometry for r128 compatibility)
const bodyGeometry = new THREE.CylinderGeometry(1, 1, 2, 16);
const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.7,
    roughness: 0.3
});
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);

// Arms (simple cylinders)
const armGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
const armMaterial = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    metalness: 0.6,
    roughness: 0.4
});
const leftArm = new THREE.Mesh(armGeometry, armMaterial);
leftArm.position.set(-1.2, 0.5, 0);
leftArm.rotation.z = Math.PI / 6;

const rightArm = new THREE.Mesh(armGeometry, armMaterial);
rightArm.position.set(1.2, 0.5, 0);
rightArm.rotation.z = -Math.PI / 6;

// Legs
const legGeometry = new THREE.CylinderGeometry(0.35, 0.35, 1.8, 8);
const legMaterial = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    metalness: 0.6,
    roughness: 0.4
});
const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
leftLeg.position.set(-0.5, -1.8, 0);

const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
rightLeg.position.set(0.5, -1.8, 0);

// Visor glow
const visorGeometry = new THREE.SphereGeometry(1.3, 32, 32);
const visorMaterial = new THREE.MeshBasicMaterial({
    color: 0x00f5ff,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending
});
const visor = new THREE.Mesh(visorGeometry, visorMaterial);
visor.position.y = 2;

astronautGroup.add(head, body, visor);
astronautGroup.position.set(0, 10, 30);
astronautGroup.scale.set(0.8, 0.8, 0.8);
scene.add(astronautGroup);

// ========================================
// LIGHTING
// ========================================
const pointLight1 = new THREE.PointLight(0x00f5ff, 2, 100);
pointLight1.position.set(30, 30, 30);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xff00ea, 1.5, 100);
pointLight2.position.set(-30, -30, 20);
scene.add(pointLight2);

const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

// ========================================
// MOUSE INTERACTION
// ========================================
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

// ========================================
// SCROLL-BASED ANIMATION
// ========================================
let scrollPercent = 0;

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    scrollPercent = scrollTop / scrollHeight;
});

// ========================================
// ANIMATION LOOP
// ========================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();
    
    // Rotate star fields at different speeds
    starField1.rotation.y += 0.0002;
    starField2.rotation.y += 0.0003;
    starField3.rotation.y += 0.0001;
    
    // Rotate galaxy spiral
    galaxyPoints.rotation.z += 0.0005;
    
    // Animate black hole
    blackHoleGroup.rotation.y += 0.01;
    accretionDisk.rotation.z += 0.02;
    glow.scale.set(
        1 + Math.sin(elapsedTime * 2) * 0.1,
        1 + Math.sin(elapsedTime * 2) * 0.1,
        1 + Math.sin(elapsedTime * 2) * 0.1
    );
    
    // Rotate planets
    planets.forEach(planet => {
        planet.mesh.rotation.y += planet.speed;
        if (planet.mesh === saturnGroup) {
            planet.mesh.rotation.z += 0.001;
        }
    });
    
    // Pulse nebulas
    nebula1.scale.set(
        1 + Math.sin(elapsedTime * 0.5) * 0.1,
        1 + Math.sin(elapsedTime * 0.5) * 0.1,
        1 + Math.sin(elapsedTime * 0.5) * 0.1
    );
    nebula2.scale.set(
        1 + Math.cos(elapsedTime * 0.7) * 0.1,
        1 + Math.cos(elapsedTime * 0.7) * 0.1,
        1 + Math.cos(elapsedTime * 0.7) * 0.1
    );
        // Animate realistic galaxy
        realisticGalaxy.rotation.z += 0.0003;
    
        // Update shader time uniforms
        if (galaxyCore.material.uniforms) {
            galaxyCore.material.uniforms.time.value = elapsedTime;
        }
        if (galaxyDisk.material.uniforms) {
            galaxyDisk.material.uniforms.time.value = elapsedTime;
        }
        
        // Pulse the galaxy core
        galaxyCore.scale.set(
            1 + Math.sin(elapsedTime * 0.5) * 0.05,
            1 + Math.sin(elapsedTime * 0.5) * 0.05,
            1 + Math.sin(elapsedTime * 0.5) * 0.05
        );
        
        // Rotate galaxy arms slowly
        galaxyArms.rotation.y += 0.0005;
        
    
        // Pulse the sun (still time-based for continuous animation)
        if (sunGroup && solarSystem.visible) {
            sunGroup.rotation.y = scrollPercent * Math.PI * 4;
            
            // Pulse based on time for nice effect
            sun.scale.set(
                1 + Math.sin(elapsedTime * 2) * 0.05,
                1 + Math.sin(elapsedTime * 2) * 0.05,
                1 + Math.sin(elapsedTime * 2) * 0.05
            );
            sunGlow.scale.set(
                1 + Math.sin(elapsedTime * 2) * 0.08,
                1 + Math.sin(elapsedTime * 2) * 0.08,
                1 + Math.sin(elapsedTime * 2) * 0.08
            );
            corona.scale.set(
                1 + Math.cos(elapsedTime * 1.5) * 0.1,
                1 + Math.cos(elapsedTime * 1.5) * 0.1,
                1 + Math.cos(elapsedTime * 1.5) * 0.1
            );
        }
        
        
        
// SCROLL-BASED Solar System Animation
// Solar system always visible, planets orbit based on scroll
if (solarSystem.visible) {
    // Calculate orbital progress based on scroll (0-100% = continuous orbit)
    const orbitProgress = scrollPercent; // 0 to 1 for full page scroll
    
    // Rotate planets around the sun based on scroll (CIRCULAR ORBITS)
    solarPlanets.forEach(p => {
        if (p.isMoon) {
            // Moon orbits Earth based on scroll
            const moonAngle = orbitProgress * Math.PI * 2; // Full rotation
            p.planet.position.x = Math.cos(moonAngle) * p.orbitRadius;
            p.planet.position.z = Math.sin(moonAngle) * p.orbitRadius;
        } else {
            // Planets orbit the sun in circles using trigonometry
            // Calculate current angle based on starting angle + scroll progress
            // Speed matched to asteroid belt rotation
            const currentAngle = p.startAngle + (orbitProgress * Math.PI * 2);
            
            // Update position in circular orbit
            p.planet.position.x = Math.cos(currentAngle) * p.orbitRadius;
            p.planet.position.z = Math.sin(currentAngle) * p.orbitRadius;
            p.planet.position.y = 0;
            
            // Rotate planet on its axis
            p.planet.rotation.y = orbitProgress * Math.PI * 4;
        }
    });
}

// Rotate asteroid belt based on scroll
if (asteroidBelt && solarSystem.visible) {
    asteroidBelt.rotation.y = scrollPercent * Math.PI * 2;
    asteroidBelt.children.forEach((asteroid, i) => {
        asteroid.rotation.x = scrollPercent * Math.PI * (i % 3);
        asteroid.rotation.y = scrollPercent * Math.PI * (i % 2);
    });
}

    // ASTRONAUT SCROLL ANIMATION
    // Falling into black hole (0-50% scroll)
    if (scrollPercent < 0.5) {
        const fallProgress = scrollPercent * 2; // 0 to 1
        
        // Move toward black hole
        astronautGroup.position.x = 0 + (30 * fallProgress);
        astronautGroup.position.y = 10 - (30 * fallProgress);
        astronautGroup.position.z = 30 - (130 * fallProgress);
        
        // Rotate and shrink as falling
        astronautGroup.rotation.x = fallProgress * Math.PI * 4;
        astronautGroup.rotation.y = fallProgress * Math.PI * 3;
        astronautGroup.scale.set(
            0.8 * (1 - fallProgress * 0.7),
            0.8 * (1 - fallProgress * 0.7),
            0.8 * (1 - fallProgress * 0.7)
        );
        
        astronautGroup.visible = true;
    }
    // Emerging from black hole (50-100% scroll)
    else {
        const emergeProgress = (scrollPercent - 0.5) * 2; // 0 to 1
        
        // Emerge from opposite side
        astronautGroup.position.x = 30 - (40 * emergeProgress);
        astronautGroup.position.y = -20 + (30 * emergeProgress);
        astronautGroup.position.z = -100 + (130 * emergeProgress);
        
        // Rotate and grow as emerging
        astronautGroup.rotation.x = Math.PI * 4 + (emergeProgress * Math.PI * 2);
        astronautGroup.rotation.y = Math.PI * 3 + (emergeProgress * Math.PI * 2);
        astronautGroup.scale.set(
            0.24 + (emergeProgress * 0.6),
            0.24 + (emergeProgress * 0.6),
            0.24 + (emergeProgress * 0.6)
        );
        
        astronautGroup.visible = emergeProgress < 0.95;
    }
    
    // Camera follows mouse with smooth interpolation
    camera.position.x += (mouseX * 3 - camera.position.x) * 0.05;
    camera.position.y += (mouseY * 3 - camera.position.y) * 0.05;
    
    // Subtle camera zoom based on scroll
    camera.position.z = 50 - (scrollPercent * 20);
    
    camera.lookAt(scene.position);
    
    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ========================================
// NAVIGATION
// ========================================
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

hamburger?.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger?.classList.remove('active');
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ========================================
// STATS COUNTER ANIMATION
// ========================================
const statNumbers = document.querySelectorAll('.stat-number');

const animateCounter = (element) => {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.ceil(current) + '+';
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target + '+';
        }
    };
    
    updateCounter();
};

// ========================================
// INTERSECTION OBSERVER (AOS Alternative)
// ========================================
const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('aos-animate');
            
            // Trigger counter animation for stats
            if (entry.target.classList.contains('about-section')) {
                statNumbers.forEach(stat => animateCounter(stat));
            }
        }
    });
}, observerOptions);

// Observe all elements with data-aos attribute
document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));

// ========================================
// SMOOTH SCROLL
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ========================================
// SCROLL INDICATOR CLICK
// ========================================
const scrollIndicator = document.querySelector('.scroll-indicator');

scrollIndicator?.addEventListener('click', () => {
    const aboutSection = document.querySelector('#about');
    if (aboutSection) {
        aboutSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
});

// Add cursor pointer style
if (scrollIndicator) {
    scrollIndicator.style.cursor = 'pointer';
}


// ========================================
// FORM SUBMISSION
// ========================================
const contactForm = document.getElementById('contact-form');

contactForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
    };
    
    // Get button
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Show loading state
    submitBtn.innerHTML = '<span>Sending...</span><i class="fas fa-spinner fa-spin"></i>';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show success
            submitBtn.innerHTML = '<span>Sent!</span><i class="fas fa-check"></i>';
            alert('Thank you for your message! I will get back to you soon.');
            contactForm.reset();
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Error:', error);
        submitBtn.innerHTML = '<span>Failed</span><i class="fas fa-times"></i>';
        alert('Oops! Something went wrong. Please try again or email me directly at muhammad@codebrisk.com');
    } finally {
        // Reset button after 3 seconds
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 3000);
    }
});

// ========================================
// CURSOR TRAIL EFFECT (Optional)
// ========================================
const createCursorTrail = () => {
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    document.body.appendChild(trail);
    
    document.addEventListener('mousemove', (e) => {
        const dot = document.createElement('div');
        dot.style.position = 'fixed';
        dot.style.width = '5px';
        dot.style.height = '5px';
        dot.style.borderRadius = '50%';
        dot.style.background = 'rgba(0, 245, 255, 0.6)';
        dot.style.pointerEvents = 'none';
        dot.style.left = e.clientX + 'px';
        dot.style.top = e.clientY + 'px';
        dot.style.zIndex = '9999';
        
        document.body.appendChild(dot);
        
        setTimeout(() => {
            dot.style.transition = 'all 0.5s ease';
            dot.style.transform = 'scale(0)';
            dot.style.opacity = '0';
        }, 10);
        
        setTimeout(() => dot.remove(), 500);
    });
};

// Uncomment to enable cursor trail
// createCursorTrail();

// ========================================
// PROJECT CARD TILT EFFECT
// ========================================
const projectCards = document.querySelectorAll('.project-card');

projectCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
});

console.log('🚀 Portfolio loaded successfully!');