// By Truett Van Slyke 2022

var c = document.getElementById('canvas');
var ctx = c.getContext('2d');

const CANVAS_SCALE = 5;
const width = window.innerWidth;
const height = window.innerHeight;

// CONFIG
const STAGE_RADIUS = 2500;
const GRAVITY = 1
const COLLISION_STEPS = 10;

const STEP_TIME = 16;

const STAGE_WIDTH = width * CANVAS_SCALE
const STAGE_HEIGHT = height * CANVAS_SCALE

var ballCount = 0;

var balls = []

var mouseX = 0
var mouseY = 0

c.style = `background:black; width:${window.innerWidth}px; height:${window.innerHeight}px; position:absolute;  top:0px;
  right:0px;
  bottom:0px;
  left:0px;`;
c.height = height * CANVAS_SCALE;
c.width = width * CANVAS_SCALE;

function getRandomInt(max) {
  return Math.floor(Math.random() * max)
}

// Vector2 Class (very useful)
var Vector2 = function(x,y) 
{
  this.x = x;
  this.y = y;
}

Vector2.prototype.StringOut = function()
{
  return '(' + this.x + ', ' + this.y + ')'
}

Vector2.prototype.Normalize = function()
{
  var length = Math.sqrt(this.x*this.x+this.y*this.y);
  this.x = this.x/length;
  this.y= this.y/length;
}

Vector2.prototype.Unit = function() 
{
	var length = Math.sqrt(this.x*this.x+this.y*this.y);
	var newX = this.x/length;
	var newY = this.y/length;
	return new Vector2(newX, newY);
}

Vector2.prototype.Mag = function() 
{ 
	return Math.sqrt(this.x*this.x+this.y*this.y);
}

Vector2.prototype.Add = function(vector)
{
  return new Vector2(this.x + vector.x, this.y + vector.y)
}

Vector2.prototype.Sub = function(vector)
{
  return new Vector2(this.x - vector.x, this.y - vector.y)
}

Vector2.prototype.Mult = function(num)
{
  return new Vector2(this.x * num, this.y * num)
}


///////////////////////////////////////////////////////////////
// Get the middle of the stage (weird spot in code, I know...)
var m = new Vector2(STAGE_WIDTH, STAGE_HEIGHT)
const middlePos = m.Mult(.5)


// Ball Class (also very useful)
var Ball = function(position, radius, color, anchored)
{
  this.position = position
  this.radius = radius
  this.color = color
  this.lastPosition = position
  this.mass = radius * radius * Math.PI
  this.nextPosition = position
  this.static = anchored
  if (anchored)
  {
    this.mass = 0
  }
}

Ball.prototype.Velocity = function()
{
  return this.position.Sub(this.lastPosition)
}

Ball.prototype.Move = function(vector)
{
  this.nextPosition = this.nextPosition.Add(vector)
}

Ball.prototype.Step = function()
{
  var velocity = this.Velocity()
  this.SavePosition()
  this.Move(velocity)
}

Ball.prototype.StageCollide = function()
{
  // Circle Collide
  var relativePos = this.position.Sub(middlePos)
  var collideDist = relativePos.Mag() + this.radius
  var relativeUnit = relativePos.Unit()

  if (collideDist > STAGE_RADIUS) 
  {
    this.nextPosition = relativeUnit.Mult(STAGE_RADIUS - this.radius).Add(middlePos)
  }

  // Edge Collide
  var edgeDistance = STAGE_HEIGHT - this.position.y - this.radius
  if (edgeDistance < 0)
  {
    this.nextPosition = new Vector2(this.nextPosition.x, STAGE_HEIGHT - this.radius)
  }
}

Ball.prototype.BallCollide = function(b2)
{
  var relPos = this.position.Sub(b2.position)
  var distance = relPos.Mag() - this.radius - b2.radius
  var vec = relPos.Unit()


  if (distance < 0)
  {
    var totalMove = 0 - distance
    myMove = totalMove
    if (b2.static == false)
    {
      myMove = totalMove * (b2.mass / (this.mass + b2.mass))
    }
    this.Move(vec.Mult(myMove))
  }
}

Ball.prototype.CollideAllBalls = function()
{
  for (k = 0; k < ballCount; k++)
  {
    var ball = balls[k]
    if (ball != this)
    {
      this.BallCollide(ball)
    }
  }
}

Ball.prototype.SavePosition = function()
{
  this.lastPosition = this.position
}

Ball.prototype.UpdatePosition = function()
{
  this.position = this.nextPosition
  this.nextPosition = this.position
}

function spawnBall(position, radius, color, static)
{
  balls.push(new Ball(position, radius, color, static))
  ballCount++
}

function drawCircle(position, radius, color)
{
  ctx.beginPath()
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
}

function hsvToRgb(h, s, v)
{
  var r, g, b;
  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);
  switch (i % 6) 
  {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }
  return `rgb(${r * 256}, ${g * 256}, ${b * 256})`
}

function renderBall(ball)
{
  drawCircle(ball.position, ball.radius, ball.color)
}


function step()
{

  // Simulate Velocity and forces
  for (i = 0; i < ballCount; i++)
  {
    if (balls[i].static == false) 
    {
      balls[i].Step()
      balls[i].Move(new Vector2(0, GRAVITY))
      balls[i].UpdatePosition()
    }
  }

  // Collisions
  for (i = 0; i < COLLISION_STEPS; i++)
  {
    // Run collisions multiple times during each phyisics frame to ensure satisfaction of all constraints
    for (j = 0; j < ballCount; j++)
    {
      if (balls[j].static == false)
      {
        var ball = balls[j]
        ball.StageCollide()
        ball.CollideAllBalls()
      }
    }
    for (j = 0; j < ballCount; j++)
    {
      balls[j].UpdatePosition()
    }
  }

  // Render
  ctx.clearRect(0, 0, c.width, c.height)
  drawCircle(middlePos, STAGE_RADIUS, 'White')

  for (i = 0; i < ballCount; i++)
  {
    renderBall(balls[i])
  }
  window.requestAnimationFrame(step)
}

function spawnBalls(num, num2)
{
  // Spawn all balls in scene
  for (i = 0; i < num; i++)
  {
    spawnBall(middlePos.Add(new Vector2(getRandomInt(1000) - 500, getRandomInt(1000) - 500)), getRandomInt(100) + 100, hsvToRgb(getRandomInt(100)/100, 1, 1), false)
  }

  for (i = 0; i < num2; i++)
  {
    spawnBall(middlePos.Add(new Vector2(getRandomInt(3000) - 1500, getRandomInt(3000) - 1500)), getRandomInt(100) + 100, 'Black', true)
  }
}

function init()
{
  spawnBalls(10, 5)

  // Compute frames at interval
  window.requestAnimationFrame(step)
}

setTimeout(init, 0)

document.addEventListener('keypress', (event) => {
  var name = event.key
  if (name == ' ')
  {
    spawnBall(new Vector2(mouseX, mouseY), getRandomInt(100) + 100, hsvToRgb(getRandomInt(100)/100, 1, 1), false)
  }
  if (name == ' ')
  {
    spawnBall(new Vector2(mouseX, mouseY), getRandomInt(100) + 400, hsvToRgb(getRandomInt(100)/100, 1, 1), false)
  }
  if (name == 'c')
  {
    spawnBall(new Vector2(mouseX, mouseY), getRandomInt(100) + 100, 'Black', true)
  }
  if (name == 'd')
  {
    for (t = 0; t < ballCount; t++)
    {
      var ball = balls[t]
      var offset = ball.position.Sub(new Vector2(mouseX, mouseY))
      var distance = offset.Mag()
      if (distance < ball.radius)
      {
        balls.splice(t, 1)
        ballCount -= 1
      }
    }
  }
  if (name == 'r')
  {
    location.reload()
  }
}, false)

document.addEventListener('mousemove', logKey)

function logKey(e) {
  mouseX = e.clientX * CANVAS_SCALE
	mouseY = e.clientY * CANVAS_SCALE
}
