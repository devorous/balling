let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let height = canvas.height;
let width = canvas.width;

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function calculateIntercept(x1,y1,x2,y2,x3,y3,x4,y4){
	let rect_center = {x: (x3+x4)/2, y: (y3+y4)/2 };
	//Calculate center of rectangle to determine distance from ball
	let dist = Math.sqrt((x1-rect_center.x)**2+(y1-rect_center.y)**2);
	let dist2 = Math.sqrt((x2-rect_center.x)**2+(y2-rect_center.y)**2);
	if(dist > 30){
		//Don't calculate anything if the ball pos/prevpos is not close to the basket
		return false
	}
	let x_min = Math.min(x1,x2);
	let x_max = Math.max(x1,x2);
	let y_min = Math.min(y1,y2);
	let y_max = Math.max(y1,y2);
	//This function calculates the interception points of a line and rectangle
	//point 1 & 2 represent the line the ball is travelling on
	//point 3 and 4 represent 2 diagonally opposite corners of the basket 
	//y = mx  + b
	let intersections = 0;
	let slope = (y2-y1)/(x2-x1);
	let y_int = y1 - slope*x1;
	//First two collisions the horizontal line intercepts of the lines y=y3 and y=y4
	//y = slope*x + y_int
	// (y - y_int)/slope = x //solving for x
	let collision1 = 	{x: (y3-y_int)/slope, y: y3};
	let collision2 =  {x: (y4-y_int)/slope, y: y4};
	//Next two are the vertical intercepts of the lines x=x3 and x=x4
	//There is no slope for a vertical line so 
	// y = slope*x + y_int  becomes
	// y = slope*x3 + y_int 
  
	let collision3 = {x: x3, y: (slope*x3)+y_int};
	let collision4 = {x: x4, y: (slope*x4)+y_int};

	//With these four collision points we can see if any are within bounds of the basket
	//But first I must check that the ball is actually within the bounds of the basket, too!
	if (collision1.x >= x_min && collision1.x <= x_max) { 
      if (collision1.y >= y_min && collision1.y <= y_max) {
             if(collision1.x > x3 && collision1.x < x4 ){
								intersections++;
							}
							if(collision1.x > x3 && collision1.x < x4 ){
								intersections++;
							}
							if(collision1.y > x3 && collision1.y < x4 ){
								intersections++;
							}
							if(collision1.y > x3 && collision1.y < x4 ){
								intersections++;
							}
        }
	}
	if(intersections > 1){
		return true
	}
}


//Todo 
/*

remove ball after its y position has been stable for x frames

Maybe use the advanced check before the simple one? 
I'm unsure if the simple one is actually useful
Ball radius is not accounted for in the collision calculation in the advanced one, too!
This is causing the edge cases not to count as scores I believe
}


*/
class gameBoard{
	constructor(width, height){
		this.width = width;
		this.height = height;
		this.score = 0;
		this.startpos = {x:0, y:0};
		this.pos = {x:0, y:0};
		this.balls = [];
		this.baskets = [];
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
	setup(){
		let basket_pos = {x: Math.random()*(width-150)+75-30, y: Math.random()*(height-150)+75-5};
		//75 pixel offset from walls, -30 is half the width of the basket, -5 is half the height of basket
		this.baskets.push(new Basket(basket_pos));	
		
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
	}

	animate(){
		ctx.clearRect(0,0,this.width,this.height);
		ctx.save();
		ctx.translate(this.width/2-25, 50);
		ctx.font = "bold 50px Roboto";
		ctx.fillText(this.score,0,0);
		ctx.restore();
		if(this.drawing){
			this.draw_line();
		}
		for(let i=0; i<this.baskets.length; i++){
			this.baskets[i].draw();
		}
		for(let i=0; i<this.balls.length; i++){
			let ball = this.balls[i]
			ball.update();
			for(let j=0; j<this.baskets.length; j++){
				let basket = this.baskets[j];

				
				//Simple hitreg using exact coordinates
				if(ball.pos.x > basket.coords.x1 && ball.pos.x < basket.coords.x2 && ball.pos.y > basket.coords.y1 && ball.pos.y < basket.coords.y2){
					if(ball.colliding){
						console.log("Still colliding!");
					}
					else{
						ball.colliding = true;
						this.score++;
						console.log("First Hit!");
					}
					
				}
				else{
					if(ball.colliding){
						ball.colliding = false;
					}
				}
				//Advanced hitreg using algebra
				if(!ball.colliding){
					let collision = calculateIntercept(ball.prevpos.x, ball.prevpos.y,ball.pos.x, ball.pos.y, basket.coords.x1, basket.coords.y1, basket.coords.x2, basket.coords.y2);
					if(collision){
					this.score++;
					}
				}
				

			}
		}
		requestAnimationFrame(()=> this.animate());
	}
}

class Basket{
	constructor(pos){
		this.active = true;
		this.size = 60;
		this.pos = pos;
		this.coords = {x1: pos.x,y1: pos.y,x2: pos.x+this.size,y2: pos.y+10};
	}
	draw(){
		ctx.save();
		ctx.fillStyle = 'red';
		ctx.fillRect(this.pos.x,this.pos.y,this.size,10);
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
	}
	update(){
		this.prevpos = {x: this.pos.x, y: this.pos.y} //deep copy;
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
			this.pos.x  = width-this.radius;
			this.vel.x  = -this.vel.x;
			this.vel.x *= this.elasticity;
			this.bounces++;
		}
		else if(this.pos.x - this.radius < 0){
			this.pos.x = this.radius;
			this.vel.x = -this.vel.x;
			this.vel.x *= this.elasticity;
			this.bounces++;
		}
		else if(this.pos.y + this.radius > height){
			this.pos.y = height-this.radius;
			this.vel.y = -this.vel.y;
			this.vel.y *= this.elasticity;
			this.bounces++;
		}
		else if(this.pos.y - this.radius < 0){
			this.pos.y = this.radius;
			this.vel.y = -this.vel.y;
			this.vel.y *= this.elasticity;
			this.bounces++;
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

