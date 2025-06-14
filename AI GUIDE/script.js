document.addEventListener('DOMContentLoaded', () => {
    // --- CORE VARIABLES ---
    let audioContext;
    let masterGain;
    let ambientGain;
    let isMuted = false;
    let isSoundInitialized = false;
    let lastPingTime = 0;
    const PING_COOLDOWN = 150;

    // --- GAME STATE ---
    let anomalyScore = 0;
    let anomaliesMissed = 0;

    // --- INITIALIZE ALL SYSTEMS ---
    setupWebGLBackground();
    setupMouseParticles();
    setupSectionInteractivity();
    setupIdleDetection();
    setupTimeBasedMoods();
    createMuteButton();
    setupFooter();
    setupAnomalyGame(); // Initialize the game

    // --- AUDIO SYSTEM ---
    function initAudioSystem() {
        if (isSoundInitialized) return;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioContext.createGain();
            ambientGain = audioContext.createGain();
            ambientGain.connect(masterGain);
            masterGain.connect(audioContext.destination);
            masterGain.gain.value = 1.0;
            ambientGain.gain.value = 0.3;
            isSoundInitialized = true;
            console.log("Audio system initialized.");
            startAmbientSound();
        } catch (e) {
            console.error("Web Audio API not supported.", e);
        }
    }

    function resumeAudioContext() {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    function startAmbientSound() {
        if (!isSoundInitialized) return;
        const osc1 = audioContext.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(40, audioContext.currentTime);
        osc1.connect(ambientGain);
        osc1.start();
        const osc2 = audioContext.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(120, audioContext.currentTime);
        const osc2Gain = audioContext.createGain();
        osc2Gain.gain.value = 0.1;
        osc2.connect(osc2Gain);
        osc2Gain.connect(ambientGain);
        osc2.start();
        const lfo = audioContext.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.05, audioContext.currentTime);
        const lfoGain = audioContext.createGain();
        lfoGain.gain.value = 0.02;
        lfo.connect(lfoGain);
        lfoGain.connect(ambientGain.gain);
        lfo.start();
    }

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
        osc.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.2);
        soundGain.gain.setValueAtTime(0.5, audioContext.currentTime);
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
        bandpass.frequency.setValueAtTime(800, audioContext.currentTime);
        bandpass.Q.setValueAtTime(15, audioContext.currentTime);
        const soundGain = audioContext.createGain();
        noise.connect(bandpass);
        bandpass.connect(soundGain);
        soundGain.connect(masterGain);
        soundGain.gain.setValueAtTime(0, audioContext.currentTime);
        soundGain.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 0.05);
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
        osc.frequency.setValueAtTime(150, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.2);
        soundGain.gain.setValueAtTime(0.8, audioContext.currentTime);
        soundGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.3);
    }
    
    /**
     * NEW: Plays a satisfying "capture" sound for the game.
     */
    function playCaptureSound() {
        if (!isSoundInitialized || isMuted) return;
        const osc = audioContext.createOscillator();
        const soundGain = audioContext.createGain();
        osc.connect(soundGain);
        soundGain.connect(masterGain);
        osc.type = 'square';
        osc.frequency.setValueAtTime(1500, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15);
        soundGain.gain.setValueAtTime(0.4, audioContext.currentTime);
        soundGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.15);
    }


    function createMuteButton() {
        const muteButton = document.createElement('button');
        muteButton.id = 'muteButton';
        muteButton.textContent = 'Mute Sounds';
        document.body.appendChild(muteButton);
        muteButton.addEventListener('click', () => {
            if (!isSoundInitialized) { initAudioSystem(); }
            isMuted = !isMuted;
            if (isMuted) {
                masterGain.gain.cancelScheduledValues(audioContext.currentTime);
                masterGain.gain.setValueAtTime(0, audioContext.currentTime);
                muteButton.textContent = 'Unmute Sounds';
                muteButton.classList.add('muted');
            } else {
                masterGain.gain.setValueAtTime(1.0, audioContext.currentTime);
                muteButton.textContent = 'Mute Sounds';
                muteButton.classList.remove('muted');
            }
        });
    }

    function userFirstInteractionHandler() {
        initAudioSystem();
        resumeAudioContext();
        document.body.removeEventListener('mousemove', userFirstInteractionHandler);
        document.body.removeEventListener('click', userFirstInteractionHandler);
    }
    document.body.addEventListener('mousemove', userFirstInteractionHandler);
    document.body.addEventListener('click', userFirstInteractionHandler);

    // --- VISUALS & OTHER SYSTEMS (Unchanged) ---
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
    function setupMouseParticles() {
        document.body.addEventListener('mousemove', e => {
            if (Math.random() > 0.7) createParticle(e.clientX, e.clientY);
            playBellPing();
        });
    }
    function createParticle(x, y) {
        const particle = document.createElement('div');
        particle.className = 'mouse-particle';
        document.body.appendChild(particle);
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        const color = `hsl(${Math.random() * 360}, 100%, 75%)`;
        particle.style.backgroundColor = color;
        particle.style.boxShadow = `0 0 8px ${color}`;
        requestAnimationFrame(() => {
            particle.style.transform = `translate(-50%, -50%) scale(1)`;
            particle.style.opacity = '1';
            setTimeout(() => {
                particle.style.transform = `translate(-50%, -50%) scale(0)`;
                particle.style.opacity = '0';
            }, 500);
        });
        setTimeout(() => particle.remove(), 1000);
    }
    function setupSectionInteractivity() {
        const sections = document.querySelectorAll('.ai-guide-section');
        sections.forEach(section => {
            section.addEventListener('mouseenter', () => playShimmerWhoosh());
            section.addEventListener('click', () => playDeepThump());
            section.addEventListener('mousemove', e => {
                const rect = section.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                section.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(42, 42, 71, 1) 0%, rgba(26, 26, 51, 1) 70%)`;
            });
            section.addEventListener('mouseleave', () => { section.style.background = '#1a1a33'; });
        });
    }
    function setupIdleDetection() {
        let idleTimer;
        const resetIdleTimer = () => {
            clearTimeout(idleTimer);
            if (document.body.classList.contains('idle-mode')) {
                document.body.classList.remove('idle-mode');
                if (isSoundInitialized && ambientGain) {
                    ambientGain.gain.cancelScheduledValues(audioContext.currentTime);
                    ambientGain.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + 2);
                }
            }
            idleTimer = setTimeout(() => {
                document.body.classList.add('idle-mode');
                if (isSoundInitialized && ambientGain) {
                    ambientGain.gain.cancelScheduledValues(audioContext.currentTime);
                    ambientGain.gain.exponentialRampToValueAtTime(0.05, audioContext.currentTime + 5);
                }
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

    // --- ANOMALY HUNT GAME LOGIC ---
    function setupAnomalyGame() {
        // Start the first anomaly spawn after a delay
        setTimeout(spawnAnomaly, 5000);
    }

    function updateGameUI() {
        const scoreEl = document.getElementById('anomaly-score');
        const missedEl = document.getElementById('anomaly-missed');
        if (scoreEl) scoreEl.textContent = anomalyScore;
        if (missedEl) missedEl.textContent = anomaliesMissed;
    }

    function spawnAnomaly() {
        const anomaly = document.createElement('div');
        anomaly.className = 'anomaly';
        
        // Find a valid place to spawn it (within the main content area)
        const mainEl = document.querySelector('main');
        if (!mainEl) return;
        
        const mainRect = mainEl.getBoundingClientRect();
        const spawnX = Math.random() * (mainRect.width - 30) + mainRect.left;
        const spawnY = Math.random() * (mainRect.height - 30) + window.scrollY;
        
        anomaly.style.left = `${spawnX}px`;
        anomaly.style.top = `${spawnY}px`;
        
        document.body.appendChild(anomaly);
        
        // Make it appear
        requestAnimationFrame(() => {
            anomaly.style.opacity = '1';
        });

        const missTimeout = setTimeout(() => {
            anomaly.remove();
            anomaliesMissed++;
            updateGameUI();
        }, 1800); // User has 1.8 seconds to click it

        anomaly.addEventListener('click', () => {
            clearTimeout(missTimeout);
            anomalyScore++;
            playCaptureSound();
            updateGameUI();
            
            anomaly.classList.add('captured');
            setTimeout(() => anomaly.remove(), 300);
        }, { once: true });

        // Schedule the next anomaly
        const nextSpawnTime = Math.random() * 8000 + 4000; // 4 to 12 seconds
        setTimeout(spawnAnomaly, nextSpawnTime);
    }
});
