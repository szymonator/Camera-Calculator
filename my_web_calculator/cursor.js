const particles = [];
let lastMouseX = null;
let lastMouseY = null;
let lastSpawnX = null;
let lastSpawnY = null;
const canvas = document.getElementById("cursor-fx");
const helpWindow = document.getElementById("help-window");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

canvas.showPopover();

window.addEventListener("mousemove", createTrailParticle);
window.addEventListener("click", createExplosion)


helpWindow.addEventListener("toggle", (event) => {
    if (event.newState === "open") {
        canvas.hidePopover();
        canvas.showPopover(); 
    }
});

class Particle {

    constructor(x,y, vx, vy, life, hasGravity) {
        this.coords = [x,y];
        this.velocity = [vx, vy]; 
        this.life = life;
        this.maxLife = life
        this.hasGravity = hasGravity;
    }

    getX() {
        return this.coords[0];
    }

    getY() {
        return this.coords[1];
    }

    getVX() {
        return this.velocity[0];
    }

    getVY() {
        return this.velocity[1];
    }

    getLife() {
        return this.life;
    }

    getMaxLife() {
        return this.maxLife;
    }

    getGravity() {
        return this.hasGravity;
    }

    setCoords(coords) { // in the form [x,y]
        this.coords = coords;
    }

    setVelocity(velocity) { // in the form [vx, vy]
        this.velocity = velocity;
    }

    decrementLife() {
        this.life--;
        return this.life <= 0; // return false if still alive, true if dead
    }


}

function createTrailParticle(event) {

    if (lastMouseX === null) {
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
        lastSpawnX = event.clientX;
        lastSpawnY = event.clientY;
        return;
    }

    const x = event.clientX;
    const y = event.clientY+15;

    const distance = Math.sqrt((x - lastSpawnX)**2 + (y - lastSpawnY)**2)
    if (distance < 30) {
        return;
    }

    const vx = x - lastMouseX;
    const vy = y - lastMouseY;

    particles.push(new Particle(x, y, 0.1*vx, 0.1*vy, 30, true));

    lastSpawnX = x;
    lastSpawnY = y;

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    return;
    
}

function createExplosion(event) {

    const N = 8 //number of particles
    const S = 5; //speed
    let angle;
    let vx;
    let vy;
    for (let i=0; i<N; i++) {
        angle = (i*2*Math.PI)/N
        vx = Math.cos(angle) * S
        vy = Math.sin(angle) * S
        particles.push(new Particle(event.clientX, event.clientY, vx, vy, 10, false))
    }
    return;
}

function update() {

    const G = 0.2 // gravity constant

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = "white"
    ctx.font = "20px sans-serif";

    let p = new Particle();
    let newCoords;
    for (let i=particles.length-1; i>=0; i--) {
        p = particles[i];
        if (p.decrementLife()) {
            particles.splice(i, 1) // dead
            continue;
        }
        newCoords = [p.getX() + p.getVX(), p.getY() + p.getVY()];
        p.setCoords(newCoords);
        if (p.getGravity()) {
            // has gravity
            p.setVelocity([p.getVX(), p.getVY() + G])
        }

        ctx.globalAlpha = p.getLife()/p.getMaxLife()
        ctx.fillText('+', newCoords[0], newCoords[1])

    }
    requestAnimationFrame(update)
}

requestAnimationFrame(update);