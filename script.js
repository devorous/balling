let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let height = canvas.height;
let width = canvas.width;

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function get_distance(pos1, pos2){
	let delta_x = pos1.x-pos2.x;
	let delta_y = pos1.y-pos2.y;
	return Math.sqrt(delta_x**2+delta_y**2);
}

function draw_rect(pos1, pos2, fill=null){
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(pos1.x,pos1.y);
	ctx.lineTo(pos2.x, pos1.y);
	ctx.lineTo(pos2.x, pos2.y);
	ctx.lineTo(pos1.x, pos2.y);
	ctx.closePath();
	ctx.stroke();
	if(fill){
		ctx.fill();
	}
}

/*
TODO

Add some different coloured floating texts, bonuses

Green bonus gives 0 gravity for 10 seconds


*/
class gameBoard{
	constructor(width, height){
		this.width = width;
		this.height = height;
		this.score = 0;
		this.startpos = {x:0, y:0};
		this.pos = {x:0, y:0};
		this.ballpos = {x:0, y:0};
		this.lives = 5;
		this.balls = [];
		this.baskets = [];
		this.texts = [];
		this.bonuses = [];
		this.drawing = false;
		this.move = false;
		this.in_menu = true;
		this.interval = null;
		//this.setup();
		this.draw_menu();
	}
	start_game(){
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0,0,width,height);
		this.in_menu = false;
		this.setup();
	}
	draw_menu(){
		ctx.save();
		ctx.translate(width/2, height/2+25);
		ctx.fillStyle = '#CBB';
		draw_rect({x:-50,y:-100},{x:50,y:-50}, true);

		ctx.font = "bold 50px Roboto";
		ctx.fillStyle = 'yellow';
		ctx.strokeStyle = 'red';
		ctx.fillText("Rebounder", -125, -150);
		ctx.strokeText("Rebounder", -125, -150);
		ctx.fillStyle = "black";
		ctx.font = '40px Roboto';
		ctx.fillText("Start",-43,-62);
		ctx.font = "bold 25px Roboto";
		ctx.fillText("How to Play", -65, -5);
		ctx.fillStyle = 'black';
		ctx.font = '18px Roboto';
		ctx.translate(0,15);
		ctx.fillText("Bounce the ball off walls to increase their score", -190,20);
		ctx.fillText("Hit bonus hexagons for special effects", -160,45);
		ctx.fillText("Pass through the hoops to score", -140,70);
		ctx.font = 'italic 17px Roboto';
		ctx.fillText("Multiply ball score by 2", -280,-60);
		ctx.fillText('Remove gravity for 1.5 sec', 90, -60);

		ctx.restore();
		let mult_bonus = new Bonus(this, 'mult', {x:-200, y: -100} );
		mult_bonus.draw();
		let grav_bonus = new Bonus(this, 'grav', {x:180, y: -100} );
		grav_bonus.draw();
	}
	mouse_down(e){
		if(!this.in_menu){
			this.drawing = true;
			this.startpos = {x: e.x, y: e.y};
		}
		else{
			if(e.x > 250 && e.x < 350 && e.y > 135 && e.y < 185  ){
				//If you click  within the start button area
				console.log("start!");
				this.start_game()
			}
		}

		
	}
	set_pos(e){
		this.pos = {x: e.x, y: e.y};
		if(this.drawing){
			this.moved = true;
		}
	}
	draw_sling(){
		if(this.moved){
			ctx.save();
			ctx.lineWidth = 2;
			let delta_x = this.startpos.x - this.pos.x;
			let delta_y = this.startpos.y - this.pos.y;
			let angle = Math.atan2(delta_y, delta_x);
			let distance = Math.sqrt(delta_x**2+delta_y**2);
			let distance_clamped = clamp(distance,0,50);
			let ratio = distance > 0 ? distance_clamped / distance : 0;
			let spread = 20;

			let delta_x_clamped = delta_x*ratio*0.9;
			let delta_y_clamped = delta_y*ratio*0.9;

			this.ball_startpos = {
				x: this.startpos.x - delta_x_clamped,
				y: this.startpos.y - delta_y_clamped
			};

			ctx.save();
			ctx.arc(this.ball_startpos.x,this.ball_startpos.y,5,0,Math.PI*2);
			ctx.fill();
			ctx.restore();

			ctx.beginPath();
			ctx.translate(this.startpos.x, this.startpos.y);
			ctx.rotate(angle);

			ctx.moveTo(0, -spread);
			ctx.lineTo(-distance_clamped,0);
			ctx.moveTo(0, spread);
			ctx.lineTo(-distance_clamped,0);
			ctx.closePath();
			ctx.stroke();
			
			ctx.restore();
		}
	}
	draw_lives(){
		ctx.save();
		ctx.translate(30,30);
		let y = 0;
		let x = -35;
		for(let i=0; i<this.lives; i++){
			if(i%5===0 && i > 0 ){
				y += 35;
				x -= (35*5);
			}
			x += 35;
			ctx.beginPath();
			ctx.arc(x,y,12,0,Math.PI*2);
			ctx.fill();
			ctx.closePath();
		}
		ctx.restore();
	}
	setup(){
		//Send board object to be referred to within Basket/Bonus as this
		this.baskets.push(new Basket(this));
		this.bonuses.push(new Bonus(this));
		this.interval = setInterval(this.animate.bind(this), 1000/60);
		//Need to bind the interval to the board object to access its properties within the animate method
	}
	shoot(){
		if(this.in_menu || !this.drawing){
			return;
		}
		if(this.lives > 0){
			this.drawing = false;
			this.moved = false;
			let delta_x = this.startpos.x - this.pos.x;
			let delta_y = this.startpos.y - this.pos.y;
			if(delta_x !== 0 && delta_y !== 0){
				let length = Math.sqrt(delta_x**2+delta_y**2);
				let angle = Math.atan2(delta_x,delta_y);
				let speed = clamp(length,0,30);
				let vel_x = Math.sin(angle) * speed;
				let vel_y = Math.cos(angle) * speed;
				let vel = {x: vel_x, y: vel_y}
				let ball = new Ball(this.ball_startpos, vel);
				this.balls.push(ball);
				this.lives--;
			}
		}
	}
	updateScore(ball){
		let multiplier = ball.multiplier;
		let score = ball.bounces*multiplier;
		let pos = {x:ball.pos.x, y: ball.pos.y};
		let text;
		for(let i=0; i<score; i++){
			this.score++
			if(this.score%5 === 0){
				if(this.lives >= 15){
					this.score +=5;
					console.log("+5 score")
					let text = new FloatingText("Max Lives Bonus!", 25, {x: width/2-75, y: height/5});
					this.texts.push(text);
				}
				else{
					this.lives++
				}
			}
		}
		if( score > 0){
			text = new FloatingText("+"+score, 30, pos);
			
		}
		else{
			text = new FloatingText("No score!",20, pos);
		}
		this.texts.push(text);

		console.log("adding ", score, " points");
		ball.bounces = 0;
		this.baskets.pop();
		this.baskets.push(new Basket(this));
	}
	animate(){
		ctx.clearRect(0,0,this.width,this.height);
		ctx.save();
		ctx.translate(this.width/2-25, 50);
		ctx.font = "bold 50px Roboto";
		ctx.fillText(this.score,0,0);
		ctx.restore();

		if(this.drawing && this.lives > 0){
			this.draw_sling();
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
			for(let b=0; b<this.bonuses.length; b++){
				let bonus = this.bonuses[b];
				let distance = get_distance(ball.pos, bonus.pos);
				if(distance <= bonus.radius){
					bonus.active = false;
					if(bonus.type === 'mult'){
						ball.multiplier *= bonus.value;
						let text = new FloatingText("x2",20,bonus.pos);
						this.texts.push(text);
					}
					else if(bonus.type === 'grav'){
						ball.gravity = 0;
						ball.friction = {x:1, y: 1}
						ball.elasticity = 1;
						let text = new FloatingText("Floating!", 15, bonus.pos, undefined, {r:50,g:200,b:50});
						this.texts.push(text);
						setTimeout(() =>{
							ball.gravity = 1
							ball.friction = {x : 0.997, y: 0.995};
							ball.elasticity = 0.96;
						}, 1500);
					}
					this.bonuses.pop();
					this.bonuses.push(new Bonus(this));
				}
			}
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
		for(let i=0; i<this.bonuses.length; i++){
			let bonus = this.bonuses[i];
			bonus.draw();
		}
		this.draw_lives();
		this.balls = this.balls.filter(ball => ball.active);
		this.texts = this.texts.filter(text => text.active);
		this.bonuses = this.bonuses.filter(bonus => bonus.active);
	}
}

class FloatingText{
	constructor(text, size, pos, vel={x:(Math.random()-0.5)*5,y:(Math.random()-0.5)*5}, colour = {r:255, g:200, b: 50}){
		this.text = text;
		this.pos = {x: pos.x, y: pos.y};
		this.vel = {x: vel.x, y: vel.y};
		this.size = size;
		this.pos.x += 1.5*this.vel.x;
		this.pos.y += 1.5*this.vel.y;
		this.active = true;
		this.opacity = 1;
		this.colour = colour;
	}
	draw(){
		ctx.save();
		ctx.fillStyle = `rgba(${this.colour.r},${this.colour.g},${this.colour.b},`+this.opacity+")";
		ctx.font = "bold "+this.size+"px Roboto";
		
		ctx.fillText(this.text,this.pos.x-10,this.pos.y+15);
		ctx.restore();	
		this.opacity -= 0.01;
		this.pos.x += (Math.random()-0.5)*0.05+this.vel.x*0.02;
		this.pos.y += (Math.random()-0.5)*0.05+this.vel.y*0.02;
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

class Bonus{
	constructor(gameBoard, type=null, pos=null){
		this.active = true;
		this.radius = 18;
		this.board = gameBoard;
		// 50/50 chance of becoming each type of bonus
		if(type){
			this.type = type;
		}
		else{
			this.type = Math.random() > 0.5 ? 'mult' : 'grav';
		}
		
		this.colour = this.type === 'mult' ? 'rgb(200,200,0)' : 'rgb(50,200,50)';
		if(pos){
			this.pos = pos;
		}
		else{
			this.pos = {x: Math.random()*(width-150)+75-30, y: Math.random()*(height-150)+75-5};
		}
		for(let i=0; i<this.board.baskets.length; i++){
			let basket = this.board.baskets[i];
			let distance = get_distance(basket.pos, this.pos);
			let tries = 0;
			while(distance < 75 && tries < 1000){
					tries++;
					this.pos = {x: Math.random()*(width-150)+75-30, y: Math.random()*(height-150)+75-5};
					distance = get_distance(basket.pos, this.pos);
			}
		}
		this.rotation = Math.random()*Math.PI*2;
		this.value = 2;
	}
	draw(){
		ctx.save();
		ctx.fillStyle=this.colour;
		ctx.translate(this.pos.x,this.pos.y);
		ctx.beginPath();
		ctx.rotate(this.rotation);
		for(let i=0; i<=5; i++){
			ctx.lineTo(0,this.radius);
			ctx.rotate(Math.PI/180*60);
		}
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}
}

class Basket{
	constructor(gameBoard){
		this.active = true;
		this.size = 55;
		this.board = gameBoard;
		//75 pixel offset from walls, -30 is half the width of the basket, -5 is half the height of basket
		this.pos = {x: Math.random()*(width-150)+75-30, y: Math.random()*(height-150)+75-5};
		for(let i=0; i<this.board.bonuses.length; i++){
			let bonus = this.board.bonuses[i];
			let distance = get_distance(bonus.pos, this.pos);
			let tries = 0;
			while(distance < 75 && tries < 1000){
					tries++;
					this.pos = {x: Math.random()*(width-150)+75-30, y: Math.random()*(height-150)+75-5};
					distance = get_distance(bonus.pos, this.pos);
			}
		}
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
		this.friction = {x: 0.997, y: 0.995};
		this.red = 0;
		this.pos = pos;
		this.prevpos = pos;
		this.vel = vel;
		this.bounces = 0;
		this.multiplier = 1;
		this.trail = [];
		this.stability = 0;
		this.stabilityThreshold = 50;
	}
	update(){
		this.prevpos = {x: this.pos.x, y: this.pos.y} //deep copy position;
		this.vel.y += this.gravity
		this.pos.x += this.vel.x;
		this.pos.y += this.vel.y;
		this.handleCollision();
		this.vel.x *= this.friction.x; // Less friction in the x direction feels better
		this.vel.y *= this.friction.y;
		if(Math.abs(this.vel.y) < 0.6){
			this.stability++;
		}
		if(this.stability > this.stabilityThreshold){
			this.active = false;
		}
		this.draw();
	}
	bounce(){
		this.vel.x *= this.elasticity;
		this.vel.y *= this.elasticity;
		if(Math.abs(this.vel.y) > 5){
			this.bounces++;
			let bounceText = new FloatingText('+1', 14, this.pos, this.vel);
			board.texts.push(bounceText);
		}
		if(this.red < 100){
			this.red +=5;	
		}
		
	}
	handleCollision(){
		//Make the ball move directly next to the wall
		//Before it bounces, so it doesn't bounce in midair
		if(this.pos.x + this.radius > width){
			this.pos.x  = width-this.radius;
			this.vel.x  = -this.vel.x;
			this.bounce();
		}
		else if(this.pos.x - this.radius < 0){
			this.pos.x = this.radius;
			this.vel.x = -this.vel.x;
			this.bounce();
		}
		else if(this.pos.y + this.radius > height){
			this.pos.y = height-this.radius;
			this.vel.y = -this.vel.y;
			this.bounce();
		}
		else if(this.pos.y - this.radius < 0){
			this.pos.y = this.radius;
			this.vel.y = -this.vel.y;
			this.bounce();
		}
	}
	draw(){
		ctx.save();
		ctx.beginPath();
		ctx.fillStyle = "rgba("+this.red+",0,0)";
		ctx.arc(this.pos.x,this.pos.y,this.radius,0,Math.PI*2);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}
}


let board = new gameBoard(width,height);


canvas.addEventListener('pointerdown', (e) => board.mouse_down(e));
canvas.addEventListener('pointermove', (e) => board.set_pos(e));
canvas.addEventListener('pointerup', (e) => board.shoot(e));
