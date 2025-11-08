let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let height = canvas.height;
let width = canvas.width;

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}



//Todo 
/*

Figure out good clamping values/length interpolation
remove ball after its y position has been stable for 4 frames

Add/Display score
Count bounces (stored on ball object)
Create target line

*/
class gameBoard{
	constructor(width, height){
		this.width = width;
		this.height = height;
		this.score = 0;
		this.startpos = {x:0, y:0};
		this.pos = {x:0, y:0};
		this.ball = null;
		this.balls = [];
		this.drawing = false;
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
	shoot(){
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
		}
		this.pos, this.startpos = null;
	}

	animate(){
		ctx.clearRect(0,0,this.width,this.height);
		ctx.save();
		ctx.translate(this.width/2-25, 50);
		ctx.font = "bold 50px Roboto";
		ctx.fillText(0,0,this.score);
		ctx.restore();
		if(this.drawing){
			this.draw_line();
		}
		
		
		for(let i=0; i<this.balls.length; i++){
			this.balls[i].update();
		
		}
		requestAnimationFrame(()=> this.animate());
	}
}

class Basket{
	constructor(pos){
		this.active = true;
		this.size = 20;
		this.pos = pos;

	}
}

class Ball{
	constructor(pos,vel){
		this.active = true;
		this.radius = 5;
		this.gravity = 1;
		this.elasticity = 0.96;
		this.pos = pos;
		this.vel = vel;
	}
	update(){
		this.vel.y += this.gravity
		this.pos.x += this.vel.x;
		this.pos.y += this.vel.y;
		this.handleCollision();
		
		this.vel.x *= 0.995;
		this.vel.y *= 0.995;

		this.draw();
	}
	handleCollision(){
		if(this.pos.x + this.radius > width){
			this.pos.x = width-this.radius;
			this.vel.x = -this.vel.x;
			this.vel.x *= this.elasticity;
		}
		else if(this.pos.x - this.radius < 0){
			this.pos.x = this.radius;
			this.vel.x = -this.vel.x;
			this.vel.x *= this.elasticity;
		}
		else if(this.pos.y + this.radius > height){
			this.pos.y = height-this.radius;
			this.vel.y = -this.vel.y;
			this.vel.y *= this.elasticity;
		}
		else if(this.pos.y - this.radius < 0){
			this.pos.y = this.radius;
			this.vel.y = -this.vel.y;
			this.vel.y *= this.elasticity;
		}
	}
	draw(){
		ctx.save();
		ctx.beginPath();

		ctx.arc(this.pos.x,this.pos.y,this.radius,0,Math.PI*2);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}
}


let board = new gameBoard(width,height);
board.animate();

canvas.addEventListener('pointerdown', (e) => board.start_line(e));
canvas.addEventListener('pointermove', (e) => board.set_pos(e));
canvas.addEventListener('pointerup', (e) => board.shoot(e));

