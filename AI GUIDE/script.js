document.addEventListener('DOMContentLoaded', () => {
    // --- CORE VARIABLES ---
    let audioContext;
    let masterGain;
    let isMuted = false;
    let isSoundInitialized = false;
    let lastPingTime = 0;
    const PING_COOLDOWN = 250; // Increased cooldown for subtlety

    // --- GAME STATE ---
    const game = {
        sequence: [],
        playerSequence: [],
        level: 0,
        canPlayerClick: false,
        buttonSounds: []
    };

    // --- INITIALIZE ALL SYSTEMS ---
    setupWebGLBackground();
    setupMouseParticles();
    createMuteButton();
    setupFooter();
    setupMemoryGame();
    setupSectionInteractivity(); // Re-enabled for interactive sounds
    setupGlitchText(); // NEW: Adds support for CSS glitch effect

    // --- AUDIO SYSTEM ---

    function initAudioSystem() {
        if (isSoundInitialized) return;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioContext.createGain();
            masterGain.gain.value = 1.0;
            masterGain.connect(audioContext.destination);
            isSoundInitialized = true;
            
            const frequencies = [261.63, 329.63, 392.00, 440.00]; // C4, E4, G4, A4
            game.buttonSounds = frequencies.map(freq => createGameSound(freq));
        } catch (e) {
            console.error("Web Audio API is not supported.", e);
        }
    }
    
    // --- DISCRETE SOUND FUNCTIONS ---

    function playBellPing() {
        if (!isSoundInitialized || isMuted) return;
        const now = performance.now();
        if (now - lastPingTime < PING_COOLDOWN) return;
        lastPingTime = now;

        const osc = audioContext.createOscillator();
        const soundGain = audioContext.createGain();
        osc.connect(soundGain);
        soundGain.connect(masterGain);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
        soundGain.gain.setValueAtTime(0.1, audioContext.currentTime); // Subtle volume
        soundGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.3);
    }

    function playShimmerWhoosh() {
        if (!isSoundInitialized || isMuted) return;
        const noise = audioContext.createBufferSource();
        const bufferSize = audioContext.sampleRate * 0.5;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; }
        noise.buffer = buffer;

        const bandpass = audioContext.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(1200, audioContext.currentTime);
        bandpass.Q.setValueAtTime(15, audioContext.currentTime);

        const soundGain = audioContext.createGain();
        noise.connect(bandpass);
        bandpass.connect(soundGain);
        soundGain.connect(masterGain);
        
        soundGain.gain.setValueAtTime(0, audioContext.currentTime);
        soundGain.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.05); // Subtle volume
        soundGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);

        noise.start(audioContext.currentTime);
        noise.stop(audioContext.currentTime + 0.5);
    }

    function playDeepThump() {
        if (!isSoundInitialized || isMuted) return;
        const osc = audioContext.createOscillator();
        const soundGain = audioContext.createGain();
        osc.connect(soundGain);
        soundGain.connect(masterGain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 0.2);
        soundGain.gain.setValueAtTime(0.3, audioContext.currentTime); // Subtle volume
        soundGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.3);
    }

    function createGameSound(frequency) {
        return () => {
            if (!isSoundInitialized || isMuted) return;
            const osc = audioContext.createOscillator();
            const soundGain = audioContext.createGain();
            osc.connect(soundGain);
            soundGain.connect(masterGain);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
            soundGain.gain.setValueAtTime(0.3, audioContext.currentTime);
            soundGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.4);
        };
    }

    function playFailureSound() {
        if (!isSoundInitialized || isMuted) return;
        const osc = audioContext.createOscillator();
        const soundGain = audioContext.createGain();
        osc.connect(soundGain);
        soundGain.connect(masterGain);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.6);
        soundGain.gain.setValueAtTime(0.2, audioContext.currentTime);
        soundGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.6);
    }

    // --- MUTE BUTTON ---
    function createMuteButton() {
        const muteButton = document.createElement('button');
        muteButton.id = 'muteButton';
        muteButton.textContent = 'Mute Sounds';
        muteButton.style.cssText = 'position: fixed; bottom: 20px; left: 20px; z-index: 10000; padding: 10px 15px; background-color: rgba(255,255,255,0.1); color: #e0e0f0; border: 1px solid #e0e0f0; border-radius: 5px; cursor: pointer; transition: background-color 0.3s, border-color 0.3s;';
        document.body.appendChild(muteButton);
        muteButton.addEventListener('click', toggleMute);
    }

    function toggleMute() {
        if (!isSoundInitialized) initAudioSystem();
        isMuted = !isMuted;
        const muteButton = document.getElementById('muteButton');
        if (isMuted) {
            masterGain.gain.setValueAtTime(0, audioContext.currentTime);
            muteButton.textContent = 'Unmute';
            muteButton.style.borderColor = '#ff9a9a';
        } else {
            masterGain.gain.setValueAtTime(1.0, audioContext.currentTime);
            muteButton.textContent = 'Mute';
            muteButton.style.borderColor = '#e0e0f0';
        }
    }
    
    // Initialize audio on first user gesture
    function userFirstInteractionHandler() {
        if (!isSoundInitialized) {
            initAudioSystem();
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }
        document.body.removeEventListener('click', userFirstInteractionHandler);
        document.body.removeEventListener('mousemove', userFirstInteractionHandler);
    }
    document.body.addEventListener('click', userFirstInteractionHandler);
    document.body.addEventListener('mousemove', userFirstInteractionHandler);

    // --- NEW: Glitch Text Setup ---
    function setupGlitchText() {
        document.querySelectorAll('h2, h3').forEach(header => {
            header.setAttribute('data-text', header.textContent);
        });
    }

    // --- ENHANCED MOUSE PARTICLES ---
    function setupMouseParticles() { 
        document.body.addEventListener('mousemove', e => {
            // Create particles more frequently for a denser trail
            if (Math.random() > 0.4) {
                createParticle(e.clientX, e.clientY);
            }
            // Also play the subtle ping sound on movement
            playBellPing();
        });
    }

    function createParticle(x, y) { 
        const particle = document.createElement('div');
        particle.className = 'mouse-particle';
        document.body.appendChild(particle);

        const size = Math.random() * 5 + 3; // Random size between 3px and 8px
        const color = `hsl(${Math.random() * 60 + 180}, 100%, 80%)`; // Electric blue/cyan tones

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.backgroundColor = color;
        particle.style.boxShadow = `0 0 12px ${color}`;

        // Animate out
        setTimeout(() => {
            particle.style.transform = `translate(-50%, -50%) scale(0)`;
            particle.style.opacity = '0';
        }, 10); // Start fade out almost immediately

        // Remove from DOM after animation
        setTimeout(() => particle.remove(), 500);
    }
    
    // --- RESTORED: Section Interactivity Sounds ---
    function setupSectionInteractivity() {
        const sections = document.querySelectorAll('.ai-guide-section');
        sections.forEach(section => {
            // Add sound triggers
            section.addEventListener('mouseenter', playShimmerWhoosh);
            section.addEventListener('click', playDeepThump);

            // Keep visual effect
            section.addEventListener('mousemove', e => {
                const rect = section.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                section.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(42, 42, 71, 1) 0%, rgba(26, 26, 51, 1) 70%)`;
            });
            section.addEventListener('mouseleave', () => { section.style.background = '#1a1a33'; });
        });
    }

    // --- MEMORY SEQUENCE GAME LOGIC (Unchanged) ---
    function setupMemoryGame() {
        const startBtn = document.getElementById('start-game-btn');
        const gameButtons = document.querySelectorAll('.game-button');

        startBtn.addEventListener('click', startGame);
        gameButtons.forEach(button => {
            button.addEventListener('click', () => handlePlayerClick(button));
        });
    }

    function startGame() {
        const startBtn = document.getElementById('start-game-btn');
        const gameButtons = document.querySelectorAll('.game-button');
        
        game.level = 0;
        game.sequence = [];
        startBtn.disabled = true;
        startBtn.textContent = "Game in Progress";
        gameButtons.forEach(btn => btn.classList.remove('player-active'));
        
        nextLevel();
    }

    function nextLevel() {
        game.level++;
        updateStatus(`Level ${game.level}`);
        game.playerSequence = [];
        game.canPlayerClick = false;

        const newStep = Math.floor(Math.random() * 4);
        game.sequence.push(newStep);

        playSequence();
    }

    async function playSequence() {
        await new Promise(resolve => setTimeout(resolve, 700));
        for (let i = 0; i < game.sequence.length; i++) {
            const index = game.sequence[i];
            const button = document.getElementById(`btn-${index}`);
            
            button.classList.add('lit');
            button.style.backgroundColor = getLitColor(button.id);
            game.buttonSounds[index]();
            
            await new Promise(resolve => setTimeout(resolve, 400));
            button.classList.remove('lit');
            button.style.backgroundColor = "";
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        game.canPlayerClick = true;
        document.querySelectorAll('.game-button').forEach(btn => btn.classList.add('player-active'));
        updateStatus('Your turn...');
    }

    function handlePlayerClick(button) {
        if (!game.canPlayerClick) return;

        const clickedIndex = parseInt(button.dataset.index, 10);
        
        button.classList.add('lit');
        button.style.backgroundColor = getLitColor(button.id);
        setTimeout(() => {
            button.classList.remove('lit');
            button.style.backgroundColor = "";
        }, 200);
        game.buttonSounds[clickedIndex]();

        game.playerSequence.push(clickedIndex);
        const currentStep = game.playerSequence.length - 1;

        if (game.playerSequence[currentStep] !== game.sequence[currentStep]) {
            gameOver();
            return;
        }

        if (game.playerSequence.length === game.sequence.length) {
            game.canPlayerClick = false;
            document.querySelectorAll('.game-button').forEach(btn => btn.classList.remove('player-active'));
            setTimeout(nextLevel, 1000);
        }
    }

    function gameOver() {
        updateStatus(`Game Over! You reached level ${game.level}.`);
        playFailureSound();
        const startBtn = document.getElementById('start-game-btn');
        startBtn.disabled = false;
        startBtn.textContent = "Restart Game";
        document.querySelectorAll('.game-button').forEach(btn => btn.classList.remove('player-active'));
    }
    
    function getLitColor(buttonId) {
        const colors = {
            'btn-0': '#1de9b6',
            'btn-1': '#ff1744',
            'btn-2': '#ffff00',
            'btn-3': '#00e676'
        };
        return colors[buttonId];
    }

    function updateStatus(message) {
        document.getElementById('game-status').textContent = message;
    }


    // --- OTHER UNCHANGED SYSTEMS ---
    function setupWebGLBackground() { 
        const canvas = document.getElementById('generativeBackground');
        if (!canvas) return;
        const gl = canvas.getContext('webgl');
        if (!gl) { return; }
        let time = 0;
        function render() {
            time += 0.01;
            const r = 0.5 + 0.5 * Math.sin(time);
            const g = 0.5 + 0.5 * Math.sin(time + 2);
            const b = 0.5 + 0.5 * Math.sin(time + 4);
            gl.clearColor(0.05 * r, 0.05 * g, 0.1 * b, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            requestAnimationFrame(render);
        }
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        render();
    }
    function setupIdleDetection() {
        let idleTimer;
        const resetIdleTimer = () => {
            clearTimeout(idleTimer);
            if (document.body.classList.contains('idle-mode')) {
                document.body.classList.remove('idle-mode');
            }
            idleTimer = setTimeout(() => {
                document.body.classList.add('idle-mode');
            }, 30000);
        };
        ['mousemove', 'keypress', 'scroll'].forEach(e => window.addEventListener(e, resetIdleTimer));
        resetIdleTimer();
    }
    function setupTimeBasedMoods() { 
        const hour = new Date().getHours();
        if (hour >= 22 || hour < 5) { document.body.classList.add('mood-night'); } 
        else if (hour >= 18) { document.body.classList.add('mood-evening'); }
    }
    function setupFooter() {
        const creationInfo = document.querySelector('.creation-info');
        if (creationInfo) {
            const timeEl = creationInfo.querySelector('#creationTime');
            const locEl = creationInfo.querySelector('#creationLocation');
            if (timeEl && locEl) {
                const createdDate = new Date(creationInfo.dataset.created);
                timeEl.textContent = createdDate.toLocaleString();
                locEl.textContent = creationInfo.dataset.location;
            }
        }
    }
});
