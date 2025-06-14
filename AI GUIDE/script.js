document.addEventListener('DOMContentLoaded', () => {
    // --- CORE & STATE VARIABLES ---
    let audioContext;
    let masterGain;
    let isMuted = false;
    let isSoundInitialized = false;
    let currentMode = 'full';

    const game = {
        sequence: [],
        playerSequence: [],
        level: 0,
        canPlayerClick: false,
        buttonSounds: []
    };

    // --- INITIALIZATION ---
    setupModeSelection();

    function bootUp() {
        const prompt = document.getElementById('initial-prompt');
        const mainContainer = document.getElementById('main-container');
        prompt.style.transition = 'opacity 0.5s';
        prompt.style.opacity = '0';
        setTimeout(() => {
            prompt.style.display = 'none';
            mainContainer.style.display = 'block';
            mainContainer.classList.add('visible');
        }, 500);

        if (currentMode !== 'reader') {
            setupWebGLBackground();
            createMuteButton();
            setupPsychologicalMirror();
            if (currentMode === 'full') {
                setupMouseParticles();
            }
        }
        setupSectionInteractivity();
        setupGlitchText();
        setupFooter();
        setupMemoryGame();
    }

    // --- MODE SELECTION ---
    function setupModeSelection() {
        document.querySelectorAll('.mode-button').forEach(button => {
            button.addEventListener('click', (e) => {
                currentMode = e.target.dataset.mode;
                document.body.classList.add(`mode-${currentMode}`);
                if (!isSoundInitialized && currentMode !== 'reader') {
                    initAudioSystem();
                    if (audioContext.state === 'suspended') {
                        audioContext.resume();
                    }
                }
                bootUp();
            }, { once: true });
        });
    }

    // --- AUDIO SYSTEM ---
    function initAudioSystem() {
        if (isSoundInitialized) return;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioContext.createGain();
            masterGain.connect(audioContext.destination);
            isSoundInitialized = true;
            const freqs = [261.63, 329.63, 392.00, 440.00];
            game.buttonSounds = freqs.map(f => createGameSound(f));
        } catch (e) { console.error("Web Audio API not supported."); }
    }

    function playSound(type, freq, vol, dur, endFreq = freq) {
        if (!isSoundInitialized || isMuted || currentMode === 'reader') return;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = type;
        osc.connect(gain);
        gain.connect(masterGain);
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, audioContext.currentTime + (dur * 0.8));
        gain.gain.setValueAtTime(vol, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + dur);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + dur);
    }
    
    function playShimmerWhoosh() {
        if (!isSoundInitialized || isMuted || currentMode === 'reader') return;
        const noise = audioContext.createBufferSource();
        const bufferSize = audioContext.sampleRate * 0.4;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        const filter = audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
        filter.Q.value = 20;
        const gain = audioContext.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);
        noise.start(audioContext.currentTime);
        noise.stop(audioContext.currentTime + 0.4);
    }
    function playDeepThump() { playSound('sine', 100, 0.5, 0.3, 30); }
    function createGameSound(f) { return () => playSound('sine', f, 0.3, 0.4); }
    function playFailureSound() { playSound('sawtooth', 150, 0.2, 0.6, 50); }

    function createMuteButton() {
        const muteButton = document.createElement('button');
        muteButton.id = 'muteButton';
        muteButton.textContent = 'Mute';
        muteButton.style.cssText = 'position: fixed; bottom: 20px; left: 20px; z-index: 10000; padding: 10px 15px; background: rgba(255,255,255,0.1); color: #e0e0f0; border: 1px solid #e0e0f0; border-radius: 5px; cursor: pointer;';
        document.body.appendChild(muteButton);
        muteButton.addEventListener('click', () => {
            isMuted = !isMuted;
            masterGain.gain.value = isMuted ? 0 : 1;
            muteButton.textContent = isMuted ? 'Unmute' : 'Mute';
            muteButton.style.borderColor = isMuted ? '#ff9a9a' : '#e0e0f0';
        });
    }

    document.body.addEventListener('click', function handler() {
        if (!isSoundInitialized && currentMode !== 'reader') initAudioSystem();
        if (audioContext && audioContext.state === 'suspended') audioContext.resume();
    }, { once: true });

    // --- VISUAL & INTERACTIVE SYSTEMS ---
    function setupGlitchText() {
        if (currentMode === 'reader') return;
        document.querySelectorAll('h2').forEach(h => h.dataset.text = h.textContent);
    }

    function setupMouseParticles() {
        document.body.addEventListener('mousemove', e => {
            if (currentMode === 'full' && Math.random() > 0.5) {
                createParticle(e);
            }
            // "Bing" sound on mouse move has been permanently removed.
        });
    }

    function createParticle(e) { /* ... unchanged ... */ }
    
    // --- UPDATED: Centralized Parallax Effect Logic ---
    function setupSectionInteractivity() {
        const sections = document.querySelectorAll('.ai-guide-section');
        let activeSection = null;

        // Add sound listeners to each section
        sections.forEach(section => {
            section.addEventListener('mouseenter', playShimmerWhoosh);
            section.addEventListener('click', playDeepThump);

            // Assign depth to warpable elements within this section
            if (currentMode === 'full') {
                const elementsToWarp = section.querySelectorAll('h3, p, li');
                elementsToWarp.forEach(el => {
                    el.dataset.depth = Math.random() * 0.2 + 0.1;
                });
            }
        });

        // A single listener on the body for efficient parallax calculation
        if (currentMode === 'full') {
            document.body.addEventListener('mousemove', e => {
                let foundSection = false;
                for (const section of sections) {
                    const rect = section.getBoundingClientRect();
                    // Check if mouse is inside the current section
                    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                        activeSection = section;
                        foundSection = true;
                        
                        const elementsToWarp = section.querySelectorAll('h3, p, li');
                        const centerX = rect.width / 2;
                        const centerY = rect.height / 2;
                        const mouseX = e.clientX - rect.left;
                        const mouseY = e.clientY - rect.top;

                        elementsToWarp.forEach(el => {
                            const depth = el.dataset.depth;
                            const moveX = (mouseX - centerX) * -depth;
                            const moveY = (mouseY - centerY) * -depth;
                            el.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
                        });
                        break; // Stop checking once the active section is found
                    }
                }

                // If mouse is not over any section, reset the text of the last active section
                if (!foundSection && activeSection) {
                    const elementsToWarp = activeSection.querySelectorAll('h3, p, li');
                    elementsToWarp.forEach(el => {
                        el.style.transform = 'translate3d(0, 0, 0)';
                    });
                    activeSection = null;
                }
            });
        }
    }


    // --- UNCHANGED LOGIC (Psychological Mirror, Game, etc.) ---
    function setupPsychologicalMirror() { /* ... unchanged ... */ }
    function setupMemoryGame() { /* ... unchanged ... */ }
    function startGame() { /* ... unchanged ... */ }
    function nextLevel() { /* ... unchanged ... */ }
    async function playSequence() { /* ... unchanged ... */ }
    function handlePlayerClick(button) { /* ... unchanged ... */ }
    function gameOver(isWinner) { /* ... unchanged ... */ }
    
    // (Full unchanged code for completeness)
    function createParticle(e) { const p=document.createElement('div'); p.className='mouse-particle'; document.body.appendChild(p); const s=Math.random()*4+4,c=`hsl(${Math.random()*60+200},100%,85%)`; p.style.cssText=`width:${s}px;height:${s}px;left:${e.pageX}px;top:${e.pageY}px;background-color:${c};box-shadow:0 0 15px ${c};`; setTimeout(()=>{p.style.transform=`translate(-50%,-50%) scale(0)`;p.style.opacity='0'},10); setTimeout(()=>p.remove(),500); }
    function setupPsychologicalMirror() { let l=window.scrollY,t=performance.now();window.addEventListener('scroll',()=>{if(currentMode!=='full')return;const n=performance.now(),d=Math.abs(window.scrollY-l),i=n-t;if(d/i>2.5){document.body.classList.add('state-hasty')}else{document.body.classList.remove('state-hasty')}l=window.scrollY;t=n},{passive:true}) }
    function setupMemoryGame() { document.getElementById('start-game-btn').addEventListener('click', startGame); document.querySelectorAll('.game-button').forEach(b => { b.addEventListener('click', () => handlePlayerClick(b)); }); }
    function updateStatus(m) { document.getElementById('game-status').textContent = m; }
    function getLitColor(id) { const c = {'btn-0':'#1de9b6','btn-1':'#ff1744','btn-2':'#ffff00','btn-3':'#00e676'}; return c[id]; }
    function startGame() { const b = document.getElementById('start-game-btn'); b.disabled = true; b.textContent = "Processing..."; game.level = 0; game.sequence = []; document.querySelectorAll('.game-button').forEach(b => b.classList.remove('player-active')); nextLevel(); }
    function nextLevel() { game.level++; updateStatus(`Level ${game.level}`); game.playerSequence = []; game.canPlayerClick = false; game.sequence.push(Math.floor(Math.random() * 4)); playSequence(); }
    async function playSequence() { await new Promise(r => setTimeout(r, 700)); for (const i of game.sequence) { const b = document.getElementById(`btn-${i}`); b.classList.add('lit'); b.style.backgroundColor = getLitColor(b.id); game.buttonSounds[i](); await new Promise(r => setTimeout(r, 400)); b.classList.remove('lit'); b.style.backgroundColor = ""; await new Promise(r => setTimeout(r, 200)); } game.canPlayerClick = true; document.querySelectorAll('.game-button').forEach(b => b.classList.add('player-active')); updateStatus('Your turn...'); }
    function handlePlayerClick(b) { if (!game.canPlayerClick) return; const i = parseInt(b.dataset.index, 10); b.classList.add('lit'); b.style.backgroundColor = getLitColor(b.id); setTimeout(() => { b.classList.remove('lit'); b.style.backgroundColor = ""; }, 200); game.buttonSounds[i](); game.playerSequence.push(i); const s = game.playerSequence.length - 1; if (game.playerSequence[s] !== game.sequence[s]) { gameOver(false); return; } if (game.playerSequence.length === game.sequence.length) { if (game.level >= 7) { gameOver(true); } else { game.canPlayerClick = false; setTimeout(nextLevel, 1000); } } }
    function gameOver(isWinner) { const btn = document.getElementById('start-game-btn'); if (isWinner) { updateStatus('Decryption Key Accepted.'); document.getElementById('final-insight').classList.add('visible'); btn.style.display = 'none'; } else { updateStatus(`Game Over! Reached level ${game.level}.`); playFailureSound(); btn.disabled = false; btn.textContent = "Restart Test"; } game.canPlayerClick = false; document.querySelectorAll('.game-button').forEach(b => b.classList.remove('player-active')); }
    function setupWebGLBackground() { const c = document.getElementById('generativeBackground'); if (!c) return; const gl = c.getContext('webgl'); if (!gl) return; let t=0; function r(){t+=0.005; gl.clearColor(0.05+0.02*Math.sin(t),0.05,0.1+0.03*Math.cos(t),1); gl.clear(gl.COLOR_BUFFER_BIT); requestAnimationFrame(r);} function re(){c.width=innerWidth;c.height=innerHeight;gl.viewport(0,0,gl.canvas.width,gl.canvas.height);} window.addEventListener('resize',re); re(); r(); }
    function setupFooter() { const c=document.querySelector('.creation-info'); if(c){const t=c.querySelector('#creationTime'),l=c.querySelector('#creationLocation'); if(t&&l){const d=new Date(c.dataset.created); t.textContent=d.toLocaleString(); l.textContent=c.dataset.location;}}}
});
