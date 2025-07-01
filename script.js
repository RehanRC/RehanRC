// script.js - GRIDPULSE Interface

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gridpulse-background');
    const ctx = canvas.getContext('2d');

    let width, height, gridSize, particles;
    const particleSpeed = 0.5;
    const connectionDistance = 100; // Max distance for lines between particles
    const particleColor = 'rgba(0, 255, 255, 0.7)'; // Cyan
    const lineColor = 'rgba(0, 255, 255, 0.15)'; // Fainter Cyan for lines

    // --- Dynamic Year for Footer ---
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Hero Title Glitch Effect (Subtle - CSS handles main flicker) ---
    // This can be enhanced for more complex JS-driven glitch if needed
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        // Example: Slightly change text-shadow periodically for a subtle digital pulse
        // This is more of a placeholder for complex JS glitch; CSS handles a lot.
        // setInterval(() => {
        //     const x = Math.random() * 2 - 1;
        //     const y = Math.random() * 2 - 1;
        //     heroTitle.style.textShadow = `
        //         ${x}px ${y}px 0px rgba(255,0,255,0.7),
        //         ${-x}px ${-y}px 0px rgba(0,255,255,0.7),
        //         0 0 5px var(--glow-color-primary),
        //         0 0 10px var(--glow-color-primary),
        //         0 0 20px var(--glow-color-primary),
        //         0 0 40px var(--hero-title-color),
        //         0 0 70px var(--hero-title-color)
        //     `;
        // }, 2000 + Math.random() * 1000);
    }


    // --- Animated Grid/Particle Background ---
    function setupCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        gridSize = 30; // Adjust for grid density
        particles = [];
        const numberOfParticles = Math.floor((width * height) / (gridSize * gridSize * 5)); // Adjust density

        for (let i = 0; i < numberOfParticles; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * particleSpeed, // X velocity
                vy: (Math.random() - 0.5) * particleSpeed  // Y velocity
            });
        }
    }

    function drawGrid() {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)'; // Very faint grid lines
        ctx.lineWidth = 0.5;

        // Draw vertical lines
        for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        // Draw horizontal lines
        for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    function drawParticlesAndConnections() {
        ctx.fillStyle = particleColor;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 0.5;

        particles.forEach(p => {
            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); // Small dots
            ctx.fill();

            // Update position
            p.x += p.vx;
            p.y += p.vy;

            // Boundary check (wrap around)
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            // Draw connections to nearby particles
            particles.forEach(otherP => {
                if (p === otherP) return;
                const dx = p.x - otherP.x;
                const dy = p.y - otherP.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectionDistance) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(otherP.x, otherP.y);
                    // Optional: Make line opacity based on distance
                    // ctx.strokeStyle = `rgba(0, 255, 255, ${1 - distance / connectionDistance * 0.85})`; // Fades out
                    ctx.stroke();
                }
            });
        });
    }


    function animateBackground() {
        ctx.clearRect(0, 0, width, height); // Clear canvas
        drawGrid(); // Draw the static grid lines
        drawParticlesAndConnections(); // Draw moving particles and their connections
        requestAnimationFrame(animateBackground);
    }

    // Initialize canvas and animation
    if (canvas) {
        setupCanvas();
        animateBackground();
        window.addEventListener('resize', setupCanvas); // Re-setup on resize
    } else {
        console.warn("Canvas element #gridpulse-background not found.");
    }


    // --- Scroll-Triggered Animations for Sections ---
    const sections = document.querySelectorAll('.info-section');
    const observerOptions = {
        root: null, // relative to document viewport
        rootMargin: '0px',
        threshold: 0.1 // 10% of item visible
    };

    const observer = new IntersectionObserver((entries, observerRef) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: unobserve after animation to save resources
                // observerRef.unobserve(entry.target);
            } else {
                // Optional: remove class to re-animate if scrolling up then down
                // entry.target.classList.remove('visible');
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // --- Mouse Interaction (Subtle Parallax/Spotlight - Example) ---
    // This is a very subtle effect, can be expanded or changed.
    const contentOverlay = document.querySelector('.content-overlay');
    if (contentOverlay) {
        // document.body.addEventListener('mousemove', (e) => {
        //     const { clientX, clientY } = e;
        //     const x = (clientX / window.innerWidth - 0.5) * 2; // -1 to 1
        //     const y = (clientY / window.innerHeight - 0.5) * 2; // -1 to 1

            // Example: Shift a pseudo-element or a dedicated spotlight div
            // For simplicity, let's imagine a CSS variable we could update
            // document.documentElement.style.setProperty('--mouse-x', `${x * 10}px`);
            // document.documentElement.style.setProperty('--mouse-y', `${y * 10}px`);
            // Then use these in CSS for a subtle transform on some elements or a spotlight div.
            // For now, this is commented out as it requires corresponding CSS.
        // });
    }
});
