let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let height = canvas.height;
let width = canvas.width;

const bounce_url = 'sounds/bounce2.wav';
const gameover_url = 'sounds/gameover.mp3';
const gravity_url = 'sounds/gravity.mp3';
const powerup_url = 'sounds/powerup.mp3';
const win_url = 'sounds/win.mp3';


const gameover_sfx = new Audio(gameover_url);
const gravity_sfx = new Audio(gravity_url);
const powerup_sfx = new Audio(powerup_url);
const win_sfx = new Audio(win_url);



// Step 1: Configuration
const MAX_CONCURRENT_SFX = 5; // Allow up to 5 overlapping sounds

const soundPool = [];
let currentIndex = 0;

// Step 2: Fill the Pool
for (let i = 0; i < MAX_CONCURRENT_SFX; i++) {
    // Each element in the array is a separate, independent player object
    soundPool.push(new Audio(bounce_url)); 
}

// Step 3: The Playback Function
function playBounce(velocity) {
    // 1. Get the next audio object in the pool (e.g., Audio_1, then Audio_2, etc.)
    const audioPlayer = soundPool[currentIndex];
    let volume = clamp(Math.round(velocity/5)/10, 0, 0.75);
    audioPlayer.volume = volume;
    // 2. Reset and Play the object
    audioPlayer.currentTime = 0;
    audioPlayer.play()
        .catch(e => console.error("Playback error:", e));

    // 3. Move the index to the next player, wrapping around using modulo (%)
    currentIndex = (currentIndex + 1) % MAX_CONCURRENT_SFX; 
}


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

Add a losing screen w/ a reset button
Touch events
Hover colour on button


*/


class gameBoard{
	constructor(width, height){
		this.width = width;
		this.height = height;
		this.score = 0;
		this.target = 50;
		this.startpos = {x:0, y:0};
		this.pos = {x:0, y:0};
		this.ballpos = {x:0, y:0};
		this.lives = 5;
		this.ball_size = 8;
		this.sling_width = 30;
		this.max_speed = 28;
		this.balls = [];
		this.baskets = [];
		this.texts = [];
		this.bonuses = [];
		this.drawing = false;
		this.move = false;
		this.in_menu = true;
		this.game_end = false;
		this.interval = null;
		this.gravTimeout = null;
		this.draw_menu();
	}

	start_game(){
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0,0,width,height);
		this.in_menu = false;

		this.lives = 5;
		this.score = 0;
		this.target = 50;
		this.balls = [];
		this.baskets = [];
		this.bonuses = [];
		this.texts = [];
		this.game_end = false;
		this.setup();
	}

	draw_menu(){
		// Draw dark gradient background
		let gradient = ctx.createLinearGradient(0, 0, 0, height);
		gradient.addColorStop(0, '#0a0a1a');
		gradient.addColorStop(1, '#1a1a3a');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);

		ctx.save();
		ctx.translate(width/2, height/2+25);

		// Draw start button with neon glow
		ctx.save();
		ctx.shadowColor = '#00ffff';
		ctx.shadowBlur = 20;
		ctx.fillStyle = '#1a1a3a';
		ctx.strokeStyle = '#00ffff';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.roundRect(-60, -105, 120, 55, 8);
		ctx.fill();
		ctx.stroke();
		ctx.restore();

		// Title with horizontal shift effect and neon glow
		ctx.save();
		ctx.textAlign = 'center';
		ctx.font = "900 42px 'Press Start 2P', monospace";

		// Left shifted copy (lower opacity)
		ctx.shadowBlur = 0;
		ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
		ctx.fillText("REBOUND", -8, -150);

		// Right shifted copy (lower opacity)
		ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
		ctx.fillText("REBOUND", 8, -150);

		// Main title
		ctx.shadowColor = '#ff00ff';
		ctx.shadowBlur = 30;
		ctx.fillStyle = '#ff00ff';
		ctx.fillText("REBOUND", 0, -150);
		ctx.restore();

		// Start button text
		ctx.save();
		ctx.textAlign = 'center';
		ctx.shadowColor = '#00ffff';
		ctx.shadowBlur = 10;
		ctx.fillStyle = '#00ffff';
		ctx.font = "700 28px 'Orbitron', sans-serif";
		ctx.fillText("START", 0, -68);
		ctx.restore();

		// Bonus icons positioned between button and instructions
		let mult_bonus = new Bonus(this, 'mult', {x: width/2 - 130, y: height/2 + 5} );
		let grav_bonus = new Bonus(this, 'grav', {x: width/2 + 130, y: height/2 + 5} );

		// Bonus descriptions (centered under icons)
		ctx.save();
		ctx.textAlign = 'center';
		ctx.font = "400 11px 'Orbitron', sans-serif";
		ctx.fillStyle = '#ffff00';
		ctx.fillText("2x Multiplier", -130, 25);
		ctx.fillStyle = '#00ff88';
		ctx.fillText("Zero Gravity", 130, 25);
		ctx.restore();

		// How to Play header (centered)
		ctx.save();
		ctx.textAlign = 'center';
		ctx.shadowColor = '#00ff88';
		ctx.shadowBlur = 10;
		ctx.fillStyle = '#00ff88';
		ctx.font = "700 16px 'Orbitron', sans-serif";
		ctx.fillText("HOW TO PLAY", 0, 55);
		ctx.restore();

		// Instructions text (centered)
		ctx.save();
		ctx.textAlign = 'center';
		ctx.fillStyle = '#8888aa';
		ctx.font = "400 12px 'Orbitron', sans-serif";
		ctx.fillText("Click and drag to launch a ball", 0, 80);
		ctx.fillText("Bounce off walls to increase value", 0, 98);
		ctx.fillText("Hit hexagons for special effects", 0, 116);
		ctx.fillText("Pass through hoops to score", 0, 134);
		ctx.restore();

		ctx.restore();

		// Draw the bonus hexagons (using absolute coordinates)
		mult_bonus.draw();
		grav_bonus.draw();
	}
	mouse_down(e){
		if(!this.in_menu){
			this.drawing = true;
			this.startpos = {x: e.x, y: e.y};
		}
		else{
			if(e.x > 240 && e.x < 360 && e.y > 120 && e.y < 175  ){
				//If you click within the start button area
				this.start_game();
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
			let delta_x = this.startpos.x - this.pos.x;
			let delta_y = this.startpos.y - this.pos.y;
			let angle = Math.atan2(delta_y, delta_x);
			let distance = Math.sqrt(delta_x**2+delta_y**2);
			let distance_clamped = clamp(distance,0,50);
			let ratio = distance > 0 ? distance_clamped / distance : 0;
			let spread = this.sling_width;

			let delta_x_clamped = delta_x*ratio*0.9;
			let delta_y_clamped = delta_y*ratio*0.9;

			this.ball_startpos = {
				x: this.startpos.x - delta_x_clamped,
				y: this.startpos.y - delta_y_clamped
			};

			// Draw ball preview with glow
			ctx.save();
			ctx.shadowColor = '#ff4488';
			ctx.shadowBlur = 15;
			ctx.fillStyle = '#ff4488';
			ctx.beginPath();
			ctx.arc(this.ball_startpos.x,this.ball_startpos.y,this.ball_size,0,Math.PI*2);
			ctx.fill();
			ctx.restore();

			// Draw slingshot lines with neon effect
			ctx.strokeStyle = '#00ffff';
			ctx.shadowColor = '#00ffff';
			ctx.shadowBlur = 10;
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.translate(this.startpos.x, this.startpos.y);
			ctx.rotate(angle);

			ctx.moveTo(0, -spread);
			ctx.lineTo(-distance_clamped,0);
			ctx.moveTo(0, spread);
			ctx.lineTo(-distance_clamped,0);
			ctx.stroke();

			ctx.restore();
		}
	}
	draw_lives(){
		ctx.save();
		ctx.translate(25, 25);
		let y = 0;
		let x = -25;
		for(let i=0; i<this.lives; i++){
			if(i%5===0 && i > 0 ){
				y += 28;
				x -= (28*5);
			}
			x += 28;
			ctx.save();
			ctx.shadowColor = '#ff4488';
			ctx.shadowBlur = 8;
			ctx.fillStyle = '#ff4488';
			ctx.beginPath();
			ctx.arc(x, y, 10, 0, Math.PI*2);
			ctx.fill();
			ctx.closePath();
			// Inner highlight
			ctx.fillStyle = '#ffaacc';
			ctx.beginPath();
			ctx.arc(x-2, y-2, 4, 0, Math.PI*2);
			ctx.fill();
			ctx.restore();
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
				let speed = clamp(length,0,this.max_speed);
				let vel_x = Math.sin(angle) * speed;
				let vel_y = Math.cos(angle) * speed;
				let vel = {x: vel_x, y: vel_y}
				let ball = new Ball(this.ball_startpos, vel, this.ball_size);
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
					let text = new FloatingText("MAX LIVES!", 25, {x: width/2-60, y: height/5}, {x:0,y:-2}, {r:255, g:0, b:255});
					this.texts.push(text);
				}
				else{
					this.lives++
				}
			}
		}
		if( score > 0){
			text = new FloatingText("+"+score, 30, pos, undefined, {r:0, g:255, b:255});
		}
		else{
			text = new FloatingText("MISS!", 20, pos, undefined, {r:255, g:100, b:100});
		}
		this.texts.push(text);
		if(this.score >= this.target){
			win_sfx.currentTime = 0;
            win_sfx.play().catch(e => console.error("Win playback error:", e));
			this.game_end = true;
			this.baskets = [];
			this.bonuses= [];
			clearInterval(this.interval);
			this.interval = setInterval(this.animate.bind(this), 1000/30);
			//Epic slo-mo when you win a round!!
			let life_interval = null;
			setTimeout(()=>{
				clearInterval(this.interval);
				clearInterval(life_interval)
				this.baskets = [];
				this.balls = [];
				this.texts = [];
				this.target = this.score - this.score%10 + 100;
				this.animate();
				this.setup();
				this.game_end = false;
				this.lives = 4;
				if(this.ball_size > 4){
					this.ball_size*=0.9;
				}
				if(life_interval){
					clearInterval(life_interval);	
				}
				
			}, this.lives*500+1000);
			let text_options = [
				"EPIC!",
				"NICE!",
				"GREAT!",
				"COOL!",
				"SLICK!",
				"WOW!!"
			]
			let text = text_options[Math.floor(Math.random()*text_options.length)];
			//Pick a random choice for round clear
			let win_text = new FloatingText(text, 45, {x: width/2-60, y: height/2}, {x:0, y:-1}, {r:0, g:255, b:255});
			this.texts.push(win_text);
			if(this.lives!= 0){
				life_interval = setInterval(()=>{
					if(this.lives > 0){
						this.lives--;
						this.score += 5;
					}
				},500)
			}
			

			ball.gravity = 0;
			
		}
		ball.bounces = 0;
		this.baskets.pop();
		if(!this.game_end){
			this.baskets.push(new Basket(this));
		}
		
	}
	animate(){
		// Draw dark gradient background
		let gradient = ctx.createLinearGradient(0, 0, 0, height);
		gradient.addColorStop(0, '#0a0a1a');
		gradient.addColorStop(1, '#1a1a3a');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);

		if(this.lives === 0 && this.balls.length === 0 && !this.in_menu && !this.game_end){
			gameover_sfx.currentTime = 0;
			gameover_sfx.volume = 0.5;
            gameover_sfx.play().catch(e => console.error("Game Over playback error:", e));
			this.in_menu = true;
			clearInterval(this.interval);
			ctx.save();
			ctx.textAlign = 'center';
			ctx.shadowColor = '#ff0044';
			ctx.shadowBlur = 20;
			ctx.fillStyle = '#ff0044';
			ctx.font = "700 32px 'Orbitron', sans-serif";
			ctx.fillText("GAME OVER", this.width/2, this.height/2);
			ctx.restore();
			setTimeout((()=>{
				this.draw_menu();
			}).bind(this) ,1500);
			return;
		}

		// Draw score with neon effect
		ctx.save();
		ctx.translate(this.width/2, 45);
		ctx.shadowColor = '#00ffff';
		ctx.shadowBlur = 15;
		ctx.fillStyle = '#00ffff';
		ctx.font = "700 40px 'Orbitron', sans-serif";
		ctx.textAlign = 'center';
		ctx.fillText(this.score, 0, 0);

		// Draw target
		ctx.shadowColor = '#ff00ff';
		ctx.shadowBlur = 10;
		ctx.fillStyle = '#ff88ff';
		ctx.font = "400 18px 'Orbitron', sans-serif";
		ctx.textAlign = 'right';
		ctx.fillText("TARGET: " + this.target, 270, -5);
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
				let red = 255;
				if(this.gravTimeout && ball.grav_power){
					red = 0;
				}
				let trail = new Trail(ball.pos, ball.radius, red);
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

						powerup_sfx.currentTime = 0;
						gravity_sfx.volume = 0.8;
                    	powerup_sfx.play().catch(e => console.error("Powerup playback error:", e));
						ball.multiplier *= bonus.value;
						let text = new FloatingText("x2", 24, bonus.pos, undefined, {r:255, g:255, b:0});
						this.texts.push(text);
					}
					else if(bonus.type === 'grav'){

						gravity_sfx.currentTime = 0;
						gravity_sfx.volume = 0.5;
                        gravity_sfx.play().catch(e => console.error("Gravity playback error:", e));
						if(this.gravTimeout){
							clearTimeout(this.gravTimeout);
						}
						ball.gravity = 0;
						ball.grav_power = true;
						ball.friction = {x:1, y: 1}
						ball.vel.x *= 1.04;
						ball.vel.y *= 1.04;
						ball.elasticity = 1;
						let text = new FloatingText("ZERO-G!", 24, bonus.pos, undefined, {r:0, g:255, b:136});
						this.texts.push(text);

						this.gravTimeout = setTimeout(() =>{
							ball.gravity = 1;
							ball.grav_power = false;
							ball.friction = {x : 0.997, y: 0.995};
							ball.elasticity = 0.96;
							this.gravTimeout = null;
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
	constructor(text, size, pos, vel={x:(Math.random()-0.5)*5,y:(Math.random()-0.5)*5}, colour = {r:0, g:255, b: 255}){
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
		let colorStr = `rgba(${this.colour.r},${this.colour.g},${this.colour.b},${this.opacity})`;
		ctx.shadowColor = colorStr;
		ctx.shadowBlur = 15;
		ctx.fillStyle = colorStr;
		ctx.font = "700 "+this.size+"px 'Orbitron', sans-serif";
		ctx.fillText(this.text, this.pos.x-10, this.pos.y+15);
		ctx.restore();
		this.opacity -= 0.015;
		this.pos.x += (Math.random()-0.5)*0.05+this.vel.x*0.02;
		this.pos.y += (Math.random()-0.5)*0.05+this.vel.y*0.02;
		if(this.opacity <= 0){
			this.active = false;
		}
	}
}
class Trail{
	constructor(pos, radius, red=255){
		this.pos = {x: pos.x, y: pos.y};
		this.active = true;
		this.opacity = 0.8;
		this.radius = radius;
		this.isGravity = red === 0; // Green trail for gravity powerup
	}
	draw(){
		ctx.save();
		let color;
		if(this.isGravity){
			color = `rgba(0, 255, 136, ${this.opacity})`;
			ctx.shadowColor = '#00ff88';
		} else {
			color = `rgba(255, 68, 136, ${this.opacity})`;
			ctx.shadowColor = '#ff4488';
		}
		ctx.shadowBlur = 10;
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI*2);
		ctx.closePath();
		ctx.fill();
		this.opacity -= 0.025;
		this.radius *= 0.92;

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
		if(type){
			this.type = type;
		}
		else{
			this.type = Math.random() > 0.666 ? 'mult' : 'grav';
		}

		// Neon colors for bonuses
		this.colour = this.type === 'mult' ? '#ffff00' : '#00ff88';
		this.glowColor = this.type === 'mult' ? '#ffff00' : '#00ff88';
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
		this.rotationSpeed = 0.02;
		this.value = 2;
		this.pulsePhase = Math.random() * Math.PI * 2;
	}
	draw(){
		ctx.save();
		ctx.translate(this.pos.x, this.pos.y);

		// Pulsing glow effect
		this.pulsePhase += 0.08;
		let pulse = 0.5 + Math.sin(this.pulsePhase) * 0.3;
		ctx.shadowColor = this.glowColor;
		ctx.shadowBlur = 15 + pulse * 10;

		ctx.fillStyle = this.colour;
		ctx.beginPath();
		ctx.rotate(this.rotation);
		this.rotation += this.rotationSpeed;
		for(let i=0; i<=5; i++){
			ctx.lineTo(0, this.radius);
			ctx.rotate(Math.PI/180*60);
		}
		ctx.closePath();
		ctx.fill();

		// Inner glow
		ctx.fillStyle = 'rgba(255,255,255,0.3)';
		ctx.beginPath();
		for(let i=0; i<=5; i++){
			ctx.lineTo(0, this.radius * 0.5);
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
		this.pulsePhase = Math.random() * Math.PI * 2;
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
		this.coords = {x1: this.pos.x, y1: this.pos.y, x2: this.pos.x+this.size, y2: this.pos.y+5};
	}
	draw(){
		ctx.save();

		// Pulsing glow effect
		this.pulsePhase += 0.06;
		let pulse = 0.5 + Math.sin(this.pulsePhase) * 0.3;

		ctx.shadowColor = '#ff00ff';
		ctx.shadowBlur = 12 + pulse * 8;

		// Create gradient for hoop
		let gradient = ctx.createLinearGradient(this.pos.x, this.pos.y, this.pos.x + this.size, this.pos.y);
		gradient.addColorStop(0, '#ff00ff');
		gradient.addColorStop(0.5, '#ff88ff');
		gradient.addColorStop(1, '#ff00ff');

		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.roundRect(this.pos.x, this.pos.y, this.size, 6, 3);
		ctx.fill();

		ctx.restore();
	}
}

class Ball{
	constructor(pos, vel, radius=5){
		this.active = true;
		this.colliding = false;
		this.radius = radius;
		this.gravity = 1;
		this.elasticity = 0.96;
		this.friction = {x: 0.997, y: 0.995};
		this.grav_power = false;
		this.hue = 330; // Start at pink/magenta
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
		this.prevpos = {x: this.pos.x, y: this.pos.y}; //deep copy position
		this.vel.y += this.gravity;
		this.pos.x += this.vel.x;
		this.pos.y += this.vel.y;
		this.handleCollision();
		this.vel.x *= this.friction.x; // Less friction in the x direction feels better
		this.vel.y *= this.friction.y;
		if(Math.abs(this.vel.y) < 0.6 && this.pos.y > height-50){
			this.stability++;
		}
		if(this.stability > this.stabilityThreshold){
			this.active = false;
		}
		this.draw();
	}
	bounce(){
		let volume = Math.sqrt(this.vel.x**2+this.vel.y**2);
		playBounce(volume);
		this.vel.x *= this.elasticity;
		this.vel.y *= this.elasticity;
		if(Math.abs(this.vel.y) > 5){
			this.bounces++;
			let bounceText = new FloatingText('+1', 14, this.pos, this.vel, {r:0, g:255, b:255});
			board.texts.push(bounceText);
		}
		// Shift hue towards cyan as bounces increase
		if(this.hue > 180){
			this.hue -= 10;
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

		// Neon glow ball
		let color = this.grav_power ? '#00ff88' : `hsl(${this.hue}, 100%, 60%)`;
		let glowColor = this.grav_power ? '#00ff88' : `hsl(${this.hue}, 100%, 50%)`;

		ctx.shadowColor = glowColor;
		ctx.shadowBlur = 15;
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI*2);
		ctx.closePath();
		ctx.fill();

		// Inner highlight
		ctx.fillStyle = 'rgba(255,255,255,0.4)';
		ctx.beginPath();
		ctx.arc(this.pos.x - this.radius*0.3, this.pos.y - this.radius*0.3, this.radius*0.4, 0, Math.PI*2);
		ctx.fill();

		ctx.restore();
	}
}


let board = new gameBoard(width,height);

// Helper to get canvas-relative coordinates
function getCanvasPos(e) {
	let rect = canvas.getBoundingClientRect();
	return {
		x: e.clientX - rect.left,
		y: e.clientY - rect.top
	};
}

canvas.addEventListener('pointerdown', (e) => board.mouse_down(getCanvasPos(e)));
document.addEventListener('pointermove', (e) => board.set_pos(getCanvasPos(e)));
document.addEventListener('pointerup', (e) => board.shoot(getCanvasPos(e)));
//Allows you to shoot even if you drag off the canvas