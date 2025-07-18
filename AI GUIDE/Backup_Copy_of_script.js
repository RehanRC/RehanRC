document.addEventListener('DOMContentLoaded', () => {
    // --- CORE VARIABLES ---
    let audioContext;
    let masterGain;
    let isMuted = false;
    let isSoundInitialized = false;
    let lastPingTime = 0;
    const PING_COOLDOWN = 150; // Cooldown for mouse move sound in milliseconds

    // --- INITIALIZE ALL SYSTEMS ---
    setupWebGLBackground();
    setupMouseParticles();
    setupSectionInteractivity();
    setupIdleDetection();
    setupTimeBasedMoods();
    createMuteButton();
    setupFooter();

    // --- AUDIO SYSTEM ---

    /**
     * Initializes the Web Audio API context and master gain node.
     * This must be triggered by a user gesture (click or mousemove).
     */
    function initAudioSystem() {
        if (isSoundInitialized) return;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioContext.createGain();
            masterGain.gain.value = 1.0; // Master volume is at full
            masterGain.connect(audioContext.destination);
            isSoundInitialized = true;
            console.log("Audio system initialized successfully.");
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
        }
    }

    /**
     * Resumes the audio context if it was suspended, which is common in modern browsers.
     */
    function resumeAudioContext() {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log("Audio context resumed.");
            });
        }
    }

    /**
     * Plays a short, noticeable "ping" sound. Used for mouse movement.
     */
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
        // A quick drop in frequency to create a "bell" or "bleep" sound
        osc.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.2);

        soundGain.gain.setValueAtTime(0.5, audioContext.currentTime);
        soundGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.3);
    }

    /**
     * Plays a "whoosh" sound. Used for hovering over sections.
     */
    function playShimmerWhoosh() {
        if (!isSoundInitialized || isMuted) return;

        const noise = audioContext.createBufferSource();
        const bufferSize = audioContext.sampleRate * 0.5; // 0.5 second buffer
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
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
        soundGain.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 0.05); // Quick attack
        soundGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);   // Fade out

        noise.start(audioContext.currentTime);
        noise.stop(audioContext.currentTime + 0.5);
    }

    /**
     * Plays a deep "thump" sound. Used for clicking on sections.
     */
    function playDeepThump() {
        if (!isSoundInitialized || isMuted) return;

        const osc = audioContext.createOscillator();
        const soundGain = audioContext.createGain();
        osc.connect(soundGain);
        soundGain.connect(masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.2);

        soundGain.gain.setValueAtTime(0.8, audioContext.currentTime); // Strong initial volume
        soundGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.3);
    }

    /**
     * Creates and manages the mute button.
     */
    function createMuteButton() {
        const muteButton = document.createElement('button');
        muteButton.id = 'muteButton';
        muteButton.textContent = 'Mute Sounds';
        muteButton.style.position = 'fixed';
        muteButton.style.bottom = '20px';
        muteButton.style.left = '20px';
        muteButton.style.zIndex = '10000';
        muteButton.style.padding = '10px 15px';
        muteButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        muteButton.style.color = '#e0e0f0';
        muteButton.style.border = '1px solid #e0e0f0';
        muteButton.style.borderRadius = '5px';
        muteButton.style.cursor = 'pointer';
        document.body.appendChild(muteButton);

        muteButton.addEventListener('click', () => {
            if (!isSoundInitialized) {
                initAudioSystem();
            }
            isMuted = !isMuted;
            if (isMuted) {
                masterGain.gain.cancelScheduledValues(audioContext.currentTime);
                masterGain.gain.setValueAtTime(0, audioContext.currentTime);
                muteButton.textContent = 'Unmute Sounds';
                 muteButton.style.borderColor = '#ff9a9a';
            } else {
                masterGain.gain.setValueAtTime(1.0, audioContext.currentTime);
                muteButton.textContent = 'Mute Sounds';
                muteButton.style.borderColor = '#e0e0f0';
            }
        });
    }

    // Single listener to initialize and resume audio context on the first interaction
    function userFirstInteractionHandler() {
        initAudioSystem();
        resumeAudioContext();
        // Remove the listener after the first interaction to avoid redundant calls
        document.body.removeEventListener('mousemove', userFirstInteractionHandler);
        document.body.removeEventListener('click', userFirstInteractionHandler);
    }
    document.body.addEventListener('mousemove', userFirstInteractionHandler);
    document.body.addEventListener('click', userFirstInteractionHandler);

    // --- WEBGL BACKGROUND ---
    function setupWebGLBackground() {
        const canvas = document.getElementById('generativeBackground');
        if (!canvas) return;
        const gl = canvas.getContext('webgl');
        if (!gl) {
            console.warn("WebGL not supported. Falling back to CSS background.");
            document.body.style.backgroundColor = '#0d0d1a';
            return;
        }

        // Basic WebGL setup (shaders, buffers, etc.) would go here.
        // For simplicity, we'll simulate a dynamic background with a simple animation.
        // A full implementation is extremely complex. This is a conceptual placeholder.
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

    // --- MOUSE FOLLOWER PARTICLES ---
    function setupMouseParticles() {
        document.body.addEventListener('mousemove', e => {
            if (Math.random() > 0.7) { // Rate limit particle creation
                createParticle(e.clientX, e.clientY);
            }
            // Trigger mouse move sound
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

        // Trigger animation
        requestAnimationFrame(() => {
            particle.style.transform = `translate(-50%, -50%) scale(1)`;
            particle.style.opacity = '1';

            // Start fade out animation
            setTimeout(() => {
                particle.style.transform = `translate(-50%, -50%) scale(0)`;
                particle.style.opacity = '0';
            }, 500);
        });

        // Remove from DOM after animation
        setTimeout(() => {
            particle.remove();
        }, 1000);
    }

    // --- SECTION INTERACTIVITY (Hover and Click Sounds) ---
    function setupSectionInteractivity() {
        const sections = document.querySelectorAll('.ai-guide-section');
        sections.forEach(section => {
            section.addEventListener('mouseenter', () => {
                playShimmerWhoosh();
            });
            section.addEventListener('click', () => {
                playDeepThump();
            });
             section.addEventListener('mousemove', (e) => {
                const rect = section.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                section.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(42, 42, 71, 1) 0%, rgba(26, 26, 51, 1) 70%)`;
            });
            section.addEventListener('mouseleave', () => {
                section.style.background = '#1a1a33';
            });
        });
    }

    // --- IDLE DETECTION ---
    function setupIdleDetection() {
        let idleTimer;
        const resetIdleTimer = () => {
            clearTimeout(idleTimer);
            if (document.body.classList.contains('idle-mode')) {
                document.body.classList.remove('idle-mode');
            }
            idleTimer = setTimeout(() => {
                document.body.classList.add('idle-mode');
            }, 30000); // 30 seconds of inactivity
        };

        window.addEventListener('mousemove', resetIdleTimer);
        window.addEventListener('keypress', resetIdleTimer);
        window.addEventListener('scroll', resetIdleTimer);
        resetIdleTimer();
    }

    // --- THEMATIC MOODS BASED ON TIME ---
    function setupTimeBasedMoods() {
        const hour = new Date().getHours();
        if (hour >= 22 || hour < 5) { // Late night
            document.body.classList.add('mood-night');
        } else if (hour >= 18) { // Evening
            document.body.classList.add('mood-evening');
        }
    }
    
    // --- FOOTER DYNAMIC INFO ---
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
