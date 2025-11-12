let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let height = canvas.height;
let width = canvas.width;

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}



//Todo 
/*

remove ball after its y position has been stable for x frames


add another life every ~5 points
implement bounce scoring, bonus point for each wallbounce before scoring

add pickup objects for bonus points
create a little text animation for points, floating/fading away from a x/y pos
}


*/
class gameBoard{
	constructor(width, height){
		this.width = width;
		this.height = height;
		this.score = 0;
		this.startpos = {x:0, y:0};
		this.pos = {x:0, y:0};
		this.lives = 5;
		this.balls = [];
		this.baskets = [];
		this.texts = [];
		this.drawing = false;
		this.setup();
	}
	start_line(e){
		this.drawing = true;
		this.startpos = {x: e.x, y: e.y};
	}
	set_pos(e){
		this.pos = {x: e.x, y: e.y};
	}
	draw_line(){
		ctx.save();
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(this.startpos.x, this.startpos.y);
		ctx.lineTo(this.pos.x, this.pos.y);
		ctx.stroke();
		ctx.closePath();
		ctx.restore();
	}
	draw_lives(){
		ctx.save();

		ctx.translate(30,30);
		for(let i=0; i<this.lives; i++){
			ctx.beginPath();
			ctx.arc(35*i,0,12,0,Math.PI*2);
			ctx.fill();
			ctx.closePath();
		}
		ctx.restore();
	}
	setup(){
		this.baskets.push(new Basket());	
	}
	shoot(){
		if(this.lives > 0){
			this.drawing = false;
			let delta_x = this.startpos.x - this.pos.x;
			let delta_y = this.startpos.y - this.pos.y;
			if(delta_x !== 0 && delta_y !== 0){
				let length = Math.sqrt(delta_x**2+delta_y**2);
				let angle = Math.atan2(delta_x,delta_y);
				let speed = clamp(length,0,30);
				let vel_x = Math.sin(angle) * speed;
				let vel_y = Math.cos(angle) * speed;
				let vel = {x: vel_x, y: vel_y}
				let ball = new Ball(this.pos, vel);
				this.balls.push(ball);
				this.lives--;
			}
		}
	}
	updateScore(ball){
		let multiplier = 2;
		let score = ball.bounces*multiplier;
		for(let i=0; i<score; i++){
			this.score++
			if(this.score%5 === 0){
				this.lives++
			}
		}

		console.log("adding ", score, " points");
		ball.bounces = 0;
		this.baskets.pop();
		this.baskets.push(new Basket());
	}
	animate(){
		ctx.clearRect(0,0,this.width,this.height);
		ctx.save();
		ctx.translate(this.width/2-25, 50);
		ctx.font = "bold 50px Roboto";
		ctx.fillText(this.score,0,0);
		ctx.restore();
		this.draw_lives();
		if(this.drawing && this.lives > 0){
			this.draw_line();
		}
		for(let i=0; i<this.baskets.length; i++){
			this.baskets[i].draw();
		}
		for(let i=0; i<this.balls.length; i++){
			let ball = this.balls[i]
			if(ball.active){
				let trail = new Trail(ball.pos, ball.radius);
				ball.trail.push(trail);
				for(let k=0; k<ball.trail.length;k++){
					if(ball.trail[k].active){
						ball.trail[k].draw();
					}
				}
			}
			ball.update();
			for(let j=0; j<this.baskets.length; j++){
				let basket = this.baskets[j];
				let score_y = (basket.coords.y1+basket.coords.y2)/2;
				if((ball.prevpos.y < score_y && ball.pos.y >= score_y) || (ball.pos.y < score_y && ball.prevpos.y >= score_y)){
					if(ball.pos.x + ball.radius > basket.coords.x1 && ball.pos.x - ball.radius < basket.coords.x2){
						this.updateScore(ball);
					}
				}
			}
			ball.trail = ball.trail.filter(trail => trail.active);
		}
		for(let k=0; k<this.texts.length; k++){
			let text = this.texts[k];
			if(text.active){
				text.draw();
			}
		}
		this.balls = this.balls.filter(balls => balls.active);
		this.texts = this.texts.filter(text => text.active);
		requestAnimationFrame(()=> this.animate());
	}
}

class FloatingText{
	constructor(text, pos){
		this.text = text;
		this.pos = {x: pos.x, y: pos.y};
		this.pos.x += 
		this.active = true;
		this.opacity = 1;
	}
	draw(){
		ctx.save();
		ctx.strokeStyle = "rgba(255,125,50,"+this.opacity+")";
		ctx.strokeText(this.text,this.pos.x-6,this.pos.y);
		ctx.restore();	
		this.opacity -= 0.01;

	}
}
class Trail{
	constructor(pos,radius){
		this.pos = {x: pos.x, y: pos.y};
		this.active = true;
		this.opacity = 1;
		this.radius = radius;
		this.green = 160;
	}
	draw(){
		ctx.save();
		ctx.fillStyle = "rgba(255,"+this.green+",50,"+this.opacity+")";
		ctx.beginPath();
		ctx.arc(this.pos.x,this.pos.y,this.radius,0,Math.PI*2);
		ctx.closePath();
		ctx.fill();
		this.green-=5;
		this.opacity -= 0.02;
		this.radius *= 0.95;

		if(this.opacity <= 0 || this.radius < 0.5){
			this.active = false;
		}
		ctx.restore();
	}
}

class Basket{
	constructor(){
		this.active = true;
		this.size = 60;
		//75 pixel offset from walls, -30 is half the width of the basket, -5 is half the height of basket
		this.pos = {x: Math.random()*(width-150)+75-30, y: Math.random()*(height-150)+75-5};
		this.coords = {x1: this.pos.x,y1: this.pos.y,x2: this.pos.x+this.size,y2: this.pos.y+5};
	}
	draw(){
		ctx.save();
		ctx.fillStyle = 'red';
		ctx.fillRect(this.pos.x,this.pos.y,this.size,5);
		ctx.restore();
	}
}

class Ball{
	constructor(pos,vel){
		this.active = true;
		this.colliding = false;
		this.radius = 5;
		this.gravity = 1;
		this.elasticity = 0.96;
		this.pos = pos;
		this.prevpos = pos;
		this.vel = vel;
		this.bounces = 0;
		this.trail = [];
		this.stability = 0;
		this.stabilityThreshold = 50;
	}
	update(){
		this.prevpos = {x: this.pos.x, y: this.pos.y} //deep copy;
		this.vel.y += this.gravity
		this.pos.x += this.vel.x;
		this.pos.y += this.vel.y;
		this.handleCollision();
		this.vel.x *= 0.995;
		this.vel.y *= 0.995;
		if(Math.abs(this.vel.y) < 0.6){
			this.stability++;
		}
		if(this.stability > this.stabilityThreshold){
			this.active = false;
		}
		this.draw();
	}
	bounce(){
		this.bounces++;
		let bounceText = new FloatingText("+1",this.pos);
		board.texts.push(bounceText);
	}
	handleCollision(){
		if(this.pos.x + this.radius > width){
			this.pos.x  = width-this.radius;
			this.vel.x  = -this.vel.x;
			this.vel.x *= this.elasticity;
			this.bounce();
		}
		else if(this.pos.x - this.radius < 0){
			this.pos.x = this.radius;
			this.vel.x = -this.vel.x;
			this.vel.x *= this.elasticity;
			this.bounce();
		}
		else if(this.pos.y + this.radius > height){
			this.pos.y = height-this.radius;
			this.vel.y = -this.vel.y;
			this.vel.y *= this.elasticity;
			this.bounce();
		}
		else if(this.pos.y - this.radius < 0){
			this.pos.y = this.radius;
			this.vel.y = -this.vel.y;
			this.vel.y *= this.elasticity;
			this.bounce();
		}
	}
	draw(){
		ctx.save();
		ctx.beginPath();
		ctx.arc(this.pos.x,this.pos.y,this.radius,0,Math.PI*2);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
	}
}


let board = new gameBoard(width,height);
board.animate();

canvas.addEventListener('pointerdown', (e) => board.start_line(e));
canvas.addEventListener('pointermove', (e) => board.set_pos(e));
canvas.addEventListener('pointerup', (e) => board.shoot(e));

