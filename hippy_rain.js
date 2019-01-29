/*
 * The design was inspired by @jackrugile's Rainbow Firestorm project:
 * https://codepen.io/jackrugile/pen/AokpF
 * This is a a modification and recreation of that pen
 *
 */

//==//==============//
// canvas setup //
//==//==============//

var ctx = c.getContext("2d"),
  width = (c.width = window.innerWidth),
  height = (c.height = window.innerHeight),
  //==//==================//
  // a few parameters //
  //==//==================//

  particleCount = (width / 2) | 0,
  obstacleCount = ((width + height) / 30) | 0,
  obstacleRadius = 60,
  gravity = 1.0,
  //==//========================//
  // other needed variables //
  //==//========================//

  particles = [],
  obstacles = [],
  frame = 0,
  tau = Math.PI * 2,
  //==//=========================//
  // initialization function //
  //==//=========================//

  init = function() {
    // initial fade to cancel repaint leftover lines, pointed out by the great lemon
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, width, height);

    while (--particleCount) particles.push(new Particle());
    while (--obstacleCount) obstacles.push(new Obstacle());

    anim();
  },
  //==//===================================//
  // animation loop and main functions //
  //==//===================================//

  anim = function() {
    window.requestAnimationFrame(anim);

    step();
    draw();
  },
  step = function() {
    particles.map(function(particle) {
      particle.step();
    });
    obstacles.map(function(obstacle) {
      obstacle.step();
    });
  },
  draw = function() {
    ctx.globalCompositeOperation = "destination-out";
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0, 0, 0, .1)";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";

    particles.map(function(particle) {
      particle.draw();
    });

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(25, 25, 25, .2)";
    // purposely didn't change ctx.shadowColor

    obstacles.map(function(obstacle) {
      obstacle.draw();
    });
  },
  spawnNew = function(x, y) {
    var part = new Particle();
    part.x = x;
    part.y = y;
    particles.push(part);
  },
  //==//===================//
  // utility functions //
  //==//===================//

  checkDistance = function(par, obs) {
    var x = par.x - obs.x,
      y = par.y - obs.y,
      d = obs.radius;

    return d * d >= x * x + y * y;
  },
  rand = function(min, max) {
    return Math.random() * (max - min) + min;
  },
  validateObstacleResize = function(obs) {
    obs.validateResize();
  },
  //==//====================================//
  // Particle and Obstacle constructors //
  //==//====================================//

  Particle = function() {
    this.reset();
  },
  Obstacle = function() {
    this.reset();
  };

Particle.prototype = {
  reset: function() {
    this.x = rand(0, width) | 0;
    this.y = rand(-obstacleRadius, 0) | 0;
    this.vx = this.vy = this.shine = 0;
    this.last = { x: this.x, y: this.y };

    this.color = "hsla(hue, 80%, 50%, alp)".replace(
      "hue",
      (frame + 360 * this.x / width) | 0
    );
  },

  step: function() {
    if (this.shine) --this.shine;

    this.last.x = this.x;
    this.last.y = this.y;

    this.x += this.vx;
    this.y += this.vy += gravity;

    if ((this.x < 0 || this.x > width) && Math.random() < 0.4) this.vx *= -1;

    if (this.y < -obstacleRadius || this.y > height) {
      frame += 0.3;
      this.reset();
    }

    var len = obstacles.length;
    while (--len + 1) {
      if (checkDistance(this, obstacles[len])) {
        this.hit(obstacles[len]);
        len = 0;
      }
    }
  },

  hit: function(obs) {
    this.vx = (this.x - obs.x) * rand(0.02, 0.03);
    this.vy = (this.y - obs.y) * rand(0.02, 0.03);

    this.shine = 2;
    ++obs.toRemove;
  },

  draw: function() {
    ctx.strokeStyle = this.color.replace("alp", 0.4);
    ctx.beginPath();
    ctx.moveTo(this.last.x, this.last.y);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    if (this.shine) {
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = this.shine * 3;
      ctx.fillStyle = this.color.replace("alp", 0.05);
      ctx.beginPath();
      ctx.arc(this.x | 0, this.y | 0, this.shine * 8, 0, tau);
      ctx.fill();
    } else ctx.shadowBlur = 0;
  }
};
Obstacle.prototype = {
  reset: function() {
    this.x = rand(0, width) | 0;
    this.y = rand(obstacleRadius * 2, height) | 0;

    this.maxRadius = rand(obstacleRadius / 2, obstacleRadius) | 0;
    this.radius = rand(this.maxRadius / 2, this.maxRadius);

    this.new = 30;
    this.toRemove = 0;
  },

  step: function() {
    if (this.new) this.new -= 5;

    if (this.toRemove) {
      --this.radius;
      --this.toRemove;

      if (this.radius < 0) this.reset();
    } else if (this.radius < this.maxRadius) ++this.radius;
  },

  draw: function() {
    ctx.shadowBlur = this.new;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, tau);
    ctx.fill();
  },

  validateResize: function() {
    if (this.x > width || this.y > height) this.reset();
  }
};

//==//=================//
// and here we go! //
//==//=================//

init();

//==//================//
// resize handler //
//==//================//

window.addEventListener("resize", function() {
  width = c.width = window.innerWidth;
  height = c.height = window.innerHeight;

  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, width, height);

  obstacles.map(validateObstacleResize);
});

//==//==============//
// add on click //
//==//==============//

window.addEventListener("click", function() {
  for (var i = 0; i < 10; ++i) particles.push(new Particle());
});

