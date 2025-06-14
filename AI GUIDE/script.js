document.addEventListener('DOMContentLoaded', () => {
    // --- CORE & STATE VARIABLES ---
    let audioContext;
    let masterGain;
    let isMuted = false;
    let isSoundInitialized = false;
    let currentMode = 'full'; // 'full', 'reduced', 'reader'

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
        // Hide prompt and show main content
        const prompt = document.getElementById('initial-prompt');
        const mainContainer = document.getElementById('main-container');
        prompt.style.transition = 'opacity 0.5s';
        prompt.style.opacity = '0';
        setTimeout(() => {
            prompt.style.display = 'none';
            mainContainer.style.display = 'block';
            mainContainer.classList.add('visible');
        }, 500);

        // Initialize systems based on mode
        if (currentMode !== 'reader') {
            setupWebGLBackground();
            setupMouseParticles();
            createMuteButton();
            setupSectionInteractivity();
            setupGlitchText();
            setupPsychologicalMirror();
        }
        setupFooter();
        setupMemoryGame();
    }

    // --- MODE SELECTION ---
    function setupModeSelection() {
        document.querySelectorAll('.mode-button').forEach(button => {
            button.addEventListener('click', (e) => {
                currentMode = e.target.dataset.mode;
                document.body.classList.add(`mode-${currentMode}`);
                
                // Initialize audio on first click
                if (!isSoundInitialized) initAudioSystem();
                if (audioContext.state === 'suspended') audioContext.resume();

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
    // Sound generation functions...
    function playSound(type, freq, vol, dur) {
        if (!isSoundInitialized || isMuted || currentMode === 'reader') return;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = type;
        osc.connect(gain);
        gain.connect(masterGain);
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);
        gain.gain.setValueAtTime(vol, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + dur);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + dur);
    }
    function createGameSound(f) { return () => playSound('sine', f, 0.3, 0.4); }
    function playFailureSound() { playSound('sawtooth', 100, 0.2, 0.6); }

    // --- VISUAL & INTERACTIVE SYSTEMS ---
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
    function setupGlitchText() {
        document.querySelectorAll('h2, h3').forEach(h => h.dataset.text = h.textContent);
    }
    function setupMouseParticles() { /* ... unchanged ... */ }
    function createParticle(e) { /* ... unchanged ... */ }
    
    function setupSectionInteractivity() {
        const sections = document.querySelectorAll('.ai-guide-section');
        sections.forEach(section => {
            if (currentMode === 'full') {
                const elementsToWarp = section.querySelectorAll('h3, p, li');
                elementsToWarp.forEach(el => el.dataset.depth = Math.random() * 0.2 + 0.1);

                section.addEventListener('mousemove', e => {
                    const rect = section.getBoundingClientRect();
                    const centerX = rect.width / 2;
                    const mouseX = e.clientX - rect.left;
                    elementsToWarp.forEach(el => {
                        const depth = el.dataset.depth;
                        const moveX = (mouseX - centerX) * -depth;
                        el.style.transform = `translate3d(${moveX}px, 0, 0)`;
                    });
                });
                section.addEventListener('mouseleave', () => {
                    elementsToWarp.forEach(el => el.style.transform = 'translate3d(0, 0, 0)');
                });
            }
        });
    }

    // --- PSYCHOLOGICAL MIRROR ---
    function setupPsychologicalMirror() {
        let lastScrollY = window.scrollY;
        let lastScrollTime = performance.now();
        
        window.addEventListener('scroll', () => {
            if (currentMode !== 'full') return;
            const now = performance.now();
            const distance = Math.abs(window.scrollY - lastScrollY);
            const timeDiff = now - lastScrollTime;
            const speed = distance / timeDiff;

            if (speed > 2.5) { // High speed scroll
                document.body.classList.add('state-hasty');
            } else {
                document.body.classList.remove('state-hasty');
            }
            lastScrollY = window.scrollY;
            lastScrollTime = now;
        }, { passive: true });
    }

    // --- GAME LOGIC ---
    function setupMemoryGame() {
        document.getElementById('start-game-btn').addEventListener('click', startGame);
        document.querySelectorAll('.game-button').forEach(b => {
            b.addEventListener('click', () => handlePlayerClick(b));
        });
    }
    function updateStatus(msg) { document.getElementById('game-status').textContent = msg; }
    function getLitColor(id) { const c = {'btn-0':'#1de9b6','btn-1':'#ff1744','btn-2':'#ffff00','btn-3':'#00e676'}; return c[id]; }
    function startGame() {
        const btn = document.getElementById('start-game-btn');
        btn.disabled = true;
        btn.textContent = "Processing...";
        game.level = 0; game.sequence = [];
        document.querySelectorAll('.game-button').forEach(b => b.classList.remove('player-active'));
        nextLevel();
    }
    function nextLevel() {
        game.level++; updateStatus(`Level ${game.level}`);
        game.playerSequence = []; game.canPlayerClick = false;
        game.sequence.push(Math.floor(Math.random() * 4));
        playSequence();
    }
    async function playSequence() {
        await new Promise(r => setTimeout(r, 700));
        for (const index of game.sequence) {
            const btn = document.getElementById(`btn-${index}`);
            btn.classList.add('lit');
            btn.style.backgroundColor = getLitColor(btn.id);
            game.buttonSounds[index]();
            await new Promise(r => setTimeout(r, 400));
            btn.classList.remove('lit');
            btn.style.backgroundColor = "";
            await new Promise(r => setTimeout(r, 200));
        }
        game.canPlayerClick = true;
        document.querySelectorAll('.game-button').forEach(b => b.classList.add('player-active'));
        updateStatus('Your turn...');
    }
    function handlePlayerClick(button) {
        if (!game.canPlayerClick) return;
        const index = parseInt(button.dataset.index, 10);
        button.classList.add('lit');
        button.style.backgroundColor = getLitColor(button.id);
        setTimeout(() => { button.classList.remove('lit'); button.style.backgroundColor = ""; }, 200);
        game.buttonSounds[index]();
        game.playerSequence.push(index);
        const currentStep = game.playerSequence.length - 1;

        if (game.playerSequence[currentStep] !== game.sequence[currentStep]) {
            gameOver(false); return;
        }
        if (game.playerSequence.length === game.sequence.length) {
            if (game.level >= 7) { gameOver(true); }
            else { game.canPlayerClick = false; setTimeout(nextLevel, 1000); }
        }
    }
    function gameOver(isWinner) {
        const btn = document.getElementById('start-game-btn');
        if (isWinner) {
            updateStatus('Decryption Key Accepted.');
            document.getElementById('final-insight').classList.remove('insight-hidden');
            btn.style.display = 'none'; // Hide button after winning
        } else {
            updateStatus(`Game Over! Reached level ${game.level}.`);
            playFailureSound();
            btn.disabled = false;
            btn.textContent = "Restart Test";
        }
        game.canPlayerClick = false;
        document.querySelectorAll('.game-button').forEach(b => b.classList.remove('player-active'));
    }
    
    // --- OTHER SETUP (UNCHANGED) ---
    function setupWebGLBackground() { const c = document.getElementById('generativeBackground'); if (!c) return; const gl = c.getContext('webgl'); if (!gl) return; let t=0; function r(){t+=0.005; gl.clearColor(0.05+0.02*Math.sin(t),0.05,0.1+0.03*Math.cos(t),1); gl.clear(gl.COLOR_BUFFER_BIT); requestAnimationFrame(r);} function re(){c.width=innerWidth;c.height=innerHeight;gl.viewport(0,0,gl.canvas.width,gl.canvas.height);} window.addEventListener('resize',re); re(); r(); }
    function setupMouseParticles() { document.body.addEventListener('mousemove', e => { if (currentMode==='full' && Math.random() > 0.5) createParticle(e); }); }
    function createParticle(e) { const p=document.createElement('div'); p.className='mouse-particle'; document.body.appendChild(p); const s=Math.random()*4+4; const c=`hsl(${Math.random()*60+200},100%,85%)`; p.style.cssText=`width:${s}px;height:${s}px;left:${e.pageX}px;top:${e.pageY}px;background-color:${c};box-shadow:0 0 15px ${c};`; setTimeout(()=>{p.style.transform=`translate(-50%,-50%) scale(0)`;p.style.opacity='0'},10); setTimeout(()=>p.remove(),500); }
    function setupFooter() { const c=document.querySelector('.creation-info'); if(c){const t=c.querySelector('#creationTime'),l=c.querySelector('#creationLocation'); if(t&&l){const d=new Date(c.dataset.created); t.textContent=d.toLocaleString(); l.textContent=c.dataset.location;}}}
});
