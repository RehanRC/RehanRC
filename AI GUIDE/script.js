document.addEventListener('DOMContentLoaded', () => {
    // 1. Mouse Trailer/Follower Effect
    const createParticle = (x, y) => {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.width = '5px';
        particle.style.height = '5px';
        particle.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 70%)`; // Random color
        particle.style.borderRadius = '50%';
        particle.style.opacity = '1';
        particle.style.transform = 'scale(0)';
        particle.style.transition = 'transform 0.8s ease-out, opacity 0.8s ease-out';
        particle.style.pointerEvents = 'none'; // Ensure it doesn't interfere with clicks
        document.body.appendChild(particle);

        setTimeout(() => {
            particle.style.transform = 'scale(1)';
            particle.style.opacity = '0';
        }, 10); // Small delay to trigger transition

        setTimeout(() => {
            particle.remove();
        }, 800); // Remove after animation
    };

    document.addEventListener('mousemove', (e) => {
        // Create a particle every few pixels the mouse moves
        if (Math.random() < 0.2) { // Adjust frequency
            createParticle(e.clientX, e.clientY);
        }
    });

    // 2. Element Hover Effects (More Dynamic)
    const sections = document.querySelectorAll('section');

    sections.forEach(section => {
        section.addEventListener('mousemove', (e) => {
            const rect = section.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Simple parallax effect for text elements within the section
            const paragraphs = section.querySelectorAll('p');
            paragraphs.forEach(p => {
                const depth = parseFloat(p.dataset.parallaxDepth || 0.05); // Customizable depth
                p.style.transform = `translate(${(x - rect.width / 2) * depth}px, ${(y - rect.height / 2) * depth}px)`;
            });

            // Add a subtle radial gradient light effect
            section.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(154, 255, 154, 0.1), rgba(26, 26, 51, 1) 70%)`;
        });

        section.addEventListener('mouseleave', () => {
            // Reset parallax and background on mouse leave
            const paragraphs = section.querySelectorAll('p');
            paragraphs.forEach(p => {
                p.style.transform = 'translate(0, 0)';
            });
            section.style.background = '#1a1a33'; // Reset to original
        });
    });

    // Initialize parallax depth for some elements (can be added directly to HTML too)
    document.querySelectorAll('.intro p, .ai-rules p, .pruning-concept p, .ai-accuracy-analogy p, .project-management-tip p').forEach(p => {
        p.dataset.parallaxDepth = Math.random() * 0.08 + 0.02; // Random depth between 0.02 and 0.1
    });

    // 3. Background Particle System (Canvas based for performance)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-2'; // Below content and mouse particles
    document.body.appendChild(canvas);

    let particles = [];
    const numParticles = 100; // Adjust for density

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.color = `rgba(179, 179, 255, ${Math.random() * 0.3 + 0.1})`; // Faint blue/purple
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.size > 0.2) this.size -= 0.01; // Fade out slowly

            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height || this.size <= 0.2) {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                this.color = `rgba(179, 179, 255, ${Math.random() * 0.3 + 0.1})`;
            }
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < numParticles; i++) {
            particles.push(new Particle());
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        requestAnimationFrame(animateParticles);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    initParticles();
    animateParticles();
});
