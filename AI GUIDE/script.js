document.addEventListener('DOMContentLoaded', () => {
    // --- WebGL Shaders for Generative Background ---
    // Vertex shader program
    const vsSource = `
        attribute vec4 aVertexPosition;
        void main() {
            gl_Position = aVertexPosition;
        }
    `;

    // Fragment shader program for a dynamic, subtle generative pattern
    const fsSource = `
        precision mediump float;

        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        uniform float uScrollFactor;

        /* Function to generate pseudo-random numbers */
        float random (vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
        }

        /* Function to generate noise (smooth random) */
        float noise (vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);

            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));

            vec2 u = f*f*(3.0-2.0*f); /* Smoother interpolation */
            return mix(a, b, u.x) + (c - a)*u.y * (1.0 - u.x) + (d - b)*u.x * u.y;
        }

        void main() {
            vec2 st = gl_FragCoord.xy / uResolution; /* Normalized coordinates */
            vec2 lightPos = uMouse / uResolution; /* Normalized mouse position */

            /* Add subtle animation and scroll influence */
            st.x += noise(st + uTime * 0.05) * 0.1;
            st.y += noise(st + uTime * 0.05 + 10.0) * 0.1;

            /* Create a fractal-like pattern based on time and scroll */
            vec3 color = vec3(0.0);
            float d = 0.0;
            vec2 q = st;
            q.x += uScrollFactor * 0.2; /* Scroll influence on X-axis */
            for (int i = 0; i < 5; i++) {
                q = q * 2.0; /* Zoom in */
                q.x += sin(uTime * 0.1 + float(i) * 0.5);
                q.y += cos(uTime * 0.08 + float(i) * 0.7);
                d = noise(q * 0.5); /* Generate noise based on transformed coordinates */
                color += vec3(d * 0.2, d * 0.3, d * 0.4); /* Build color layers */
            }

            /* Add a subtle vignette */
            float vignette = 1.0 - length(st - 0.5) * 1.5;
            color *= vignette;

            /* Incorporate a soft, glowing light source around the mouse */
            float distToMouse = distance(st, lightPos);
            float lightEffect = pow(max(0.0, 1.0 - distToMouse * 3.0), 2.0); /* Inverse square falloff */
            color += vec3(0.1, 0.05, 0.15) * lightEffect * 2.0; /* Purple glow */


            gl_FragColor = vec4(color, 1.0);
        }
    `;

    function initShaderProgram(gl, vsSource, fsSource) {
        const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    }

    function loadShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    let gl, programInfo, buffers;
    let mouseX = 0, mouseY = 0;
    let scrollFactor = 0;

    function initWebGL(canvas) {
        gl = canvas.getContext('webgl');
        if (!gl) {
            console.error('Unable to initialize WebGL. Your browser may not support it.');
            return;
        }

        programInfo = {
            program: initShaderProgram(gl, vsSource, fsSource),
            attribLocations: {
                vertexPosition: gl.getAttribLocation(initShaderProgram(gl, vsSource, fsSource), 'aVertexPosition'),
            },
            uniformLocations: {
                resolution: gl.getUniformLocation(initShaderProgram(gl, vsSource, fsSource), 'uResolution'),
                time: gl.getUniformLocation(initShaderProgram(gl, vsSource, fsSource), 'uTime'),
                mouse: gl.getUniformLocation(initShaderProgram(gl, vsSource, fsSource), 'uMouse'),
                scrollFactor: gl.getUniformLocation(initShaderProgram(gl, vsSource, fsSource), 'uScrollFactor'),
            },
        };

        buffers = initBuffers(gl);

        window.addEventListener('resize', resizeCanvas);
        canvas.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        window.addEventListener('scroll', () => {
            scrollFactor = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            scrollFactor = Math.max(0, Math.min(1, scrollFactor)); // Normalize to 0-1
        });

        resizeCanvas();
        requestAnimationFrame(render);
    }

    let startTime = Date.now();
    function render() {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.useProgram(programInfo.program);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

        gl.uniform2f(programInfo.uniformLocations.resolution, gl.canvas.width, gl.canvas.height);
        gl.uniform1f(programInfo.uniformLocations.time, (Date.now() - startTime) * 0.001);
        gl.uniform2f(programInfo.uniformLocations.mouse, mouseX, mouseY);
        gl.uniform1f(programInfo.uniformLocations.scrollFactor, scrollFactor);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(render);
    }

    function initBuffers(gl) {
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0,]; // Two triangles forming a quad
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        return {
            position: positionBuffer,
        };
    }

    function resizeCanvas() {
        if (gl) {
            gl.canvas.width = window.innerWidth;
            gl.canvas.height = window.innerHeight;
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }
    }

    // --- Mouse Trailer/Follower Effect ---
    const createParticle = (x, y) => {
        const particle = document.createElement('div');
        particle.className = 'mouse-particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 70%)`;
        document.body.appendChild(particle);

        setTimeout(() => {
            particle.style.transform = 'scale(1)';
            particle.style.opacity = '0';
        }, 10);

        setTimeout(() => {
            particle.remove();
        }, 800);
    };

    // --- Section Hover Effects (Subtle Parallax for Text) ---
    const sections = document.querySelectorAll('.ai-guide-section');
    sections.forEach(section => {
        const paragraphs = section.querySelectorAll('p'); // Target paragraphs for parallax
        paragraphs.forEach(p => {
            p.dataset.parallaxDepth = Math.random() * 0.08 + 0.02; // Random depth
        });

        section.addEventListener('mousemove', (e) => {
            const rect = section.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Text parallax
            paragraphs.forEach(p => {
                const depth = parseFloat(p.dataset.parallaxDepth || 0.05);
                p.style.transform = `translate(${(x - rect.width / 2) * depth}px, ${(y - rect.height / 2) * depth}px)`;
            });

            // Subtle radial light on section background
            section.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(154, 255, 154, 0.1), #1a1a33 70%)`;
        });

        section.addEventListener('mouseleave', () => {
            paragraphs.forEach(p => {
                p.style.transform = 'translate(0, 0)';
            });
            section.style.background = '#1a1a33'; // Reset
        });
    });

    // --- Audio Context for Ambient Soundscape ---
    let audioContext;
    let gainNode;
    let osc1, osc2, osc3; // Oscillators for ambient sound
    let lfo1, lfo2; // LFOs for modulation

    // Function to initialize and start the ambient soundscape
    const startAmbientSound = () => {
        if (audioContext && audioContext.state === 'running') return; // Already started

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.001, audioContext.currentTime); // Start very subtle

        // Oscillator 1: Deep drone
        osc1 = audioContext.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(50, audioContext.currentTime);
        osc1.connect(gainNode);

        // Oscillator 2: Higher frequency hum
        osc2 = audioContext.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(100, audioContext.currentTime);
        osc2.connect(gainNode);

        // Oscillator 3: Adding subtle texture/noise
        osc3 = audioContext.createOscillator();
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(200, audioContext.currentTime);
        osc3.connect(gainNode);

        // LFOs for subtle modulation of frequency
        lfo1 = audioContext.createOscillator();
        lfo1.type = 'sine';
        lfo1.frequency.setValueAtTime(0.05, audioContext.currentTime); // Very slow modulation
        lfo1.connect(osc1.frequency); // Modulate osc1 frequency
        lfo1.connect(osc2.frequency); // Modulate osc2 frequency

        lfo2 = audioContext.createOscillator();
        lfo2.type = 'triangle';
        lfo2.frequency.setValueAtTime(0.1, audioContext.currentTime);
        lfo2.connect(gainNode.gain); // Modulate overall gain for subtle volume shifts

        gainNode.connect(audioContext.destination);

        osc1.start();
        osc2.start();
        osc3.start();
        lfo1.start();
        lfo2.start();

        // Fade in sound after a short delay
        gainNode.gain.exponentialRampToValueAtTime(0.05, audioContext.currentTime + 5);
    };

    // Start sound on first user interaction (e.g., click anywhere)
    document.body.addEventListener('click', startAmbientSound, { once: true });
    document.body.addEventListener('mousemove', startAmbientSound, { once: true });

    // --- Thematic Moods (Simulated based on time, could be scroll-driven) ---
    const setThematicMood = () => {
        const hour = new Date().getHours();
        const body = document.body;

        if (hour >= 22 || hour < 6) { // Night/Deep Night (10 PM to 6 AM)
            body.className = 'mood-alert'; // Deeper, more unsettling
        } else if (hour >= 6 && hour < 12) { // Morning
            body.className = 'mood-calm'; // Brighter, more organized
        } else { // Day
            body.className = 'mood-normal'; // Default
        }
    };
    setThematicMood(); // Set initial mood
    setInterval(setThematicMood, 3600000); // Update hourly

    // --- AI Status Indicator ---
    const aiStatusIndicator = document.querySelector('.ai-status-indicator');
    if (aiStatusIndicator) { // Ensure element exists before manipulating
        aiStatusIndicator.style.display = 'block'; // Make it visible
        aiStatusIndicator.textContent = 'STATUS: OPTIMAL';

        let errorCount = 0;
        const simulateAIStatus = () => {
            if (Math.random() < 0.05) { // 5% chance of temporary error
                errorCount++;
                aiStatusIndicator.textContent = `STATUS: ANOMALY ${errorCount}`;
                aiStatusIndicator.classList.add('error');
                setTimeout(() => {
                    aiStatusIndicator.textContent = 'STATUS: OPTIMAL';
                    aiStatusIndicator.classList.remove('error');
                }, 2000); // Error lasts 2 seconds
            }
        };
        setInterval(simulateAIStatus, 10000); // Check status every 10 seconds
    }


    // --- Display Creation Info ---
    const creationTimeElement = document.getElementById('creationTime');
    const creationLocationElement = document.getElementById('creationLocation');
    const creationInfoElement = document.querySelector('.creation-info');

    const createdDate = creationInfoElement.dataset.created;
    const createdLocation = creationInfoElement.dataset.location;

    if (createdDate) {
        const date = new Date(createdDate);
        creationTimeElement.textContent = date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZoneName: 'short',
        });
    }
    if (createdLocation) {
        creationLocationElement.textContent = createdLocation;
    }

    // --- Philosophical Pause / Idle State ---
    let idleTimeout;
    let isIdleMode = false;
    const IDLE_TIME_MS = 60 * 1000; // 1 minute of idle time

    const activateIdleMode = () => {
        if (isIdleMode) return;
        isIdleMode = true;
        document.body.classList.add('idle-mode');
        // Adjust background/sound for idle, conceptual here
        if (gainNode && audioContext) {
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 5); // Quieter
        }
        // Shader parameters can be adjusted via uniform, but WebGL context needs to be available
        // to pass new uniform value (done in render loop or via separate uniform update function)
        console.log("Entering idle mode...");
    };

    const deactivateIdleMode = () => {
        if (!isIdleMode) return;
        isIdleMode = false;
        document.body.classList.remove('idle-mode');
        if (gainNode && audioContext) {
            gainNode.gain.exponentialRampToValueAtTime(0.05, audioContext.currentTime + 2); // Louder
        }
        console.log("Exiting idle mode.");
    };

    const resetIdleTimer = () => {
        clearTimeout(idleTimeout);
        if (isIdleMode) {
            deactivateIdleMode();
        }
        idleTimeout = setTimeout(activateIdleMode, IDLE_TIME_MS);
    };

    // Reset timer on user interaction
    ['mousemove', 'mousedown', 'keydown', 'scroll'].forEach(eventType => {
        document.addEventListener(eventType, resetIdleTimer, false);
    });
    resetIdleTimer(); // Initial call to start the timer

    // Initialize WebGL background
    const canvas = document.getElementById('generativeBackground');
    initWebGL(canvas);

    // Initial mouse event listener for particles (can be combined with main document mousemove)
    document.addEventListener('mousemove', createParticle); // Removed the random check here to make particles more consistent
});
