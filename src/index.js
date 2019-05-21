import Phaser from "phaser";

import skyImg from './assets/sky.png'
import groundImg from './assets/platform.png'
import starImg from './assets/star.png'
import bombImg from './assets/bomb.png'
import dudeImg from './assets/dude.png'
import btn1Img from './assets/btn_1.png'
import btn2Img from './assets/btn_2.png'

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var player;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;

var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('sky', skyImg);
    this.load.image('ground', groundImg);
    this.load.image('star', starImg);
    this.load.image('bomb', bombImg);
    this.load.spritesheet('dude', dudeImg, { frameWidth: 32, frameHeight: 48 });
    this.load.image('btn_1', btn1Img)
    this.load.image('btn_2', btn2Img)
}

function create ()
{
    //  A simple background for our game
    this.add.image(400, 300, 'sky');

    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = this.physics.add.staticGroup();

    //  Here we create the ground.
    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();

    //  Now let's create some ledges
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // The player and its settings
    player = this.physics.add.sprite(100, 450, 'dude');

    //  Player physics properties. Give the little guy a slight bounce.
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    stars.children.iterate(function (child) {

        //  Give each star a slightly different bounce
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));

    });

    bombs = this.physics.add.group();

    //  The score
    scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

    //  Collide the player and the stars with the platforms
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    this.physics.add.overlap(player, stars, collectStar, null, this);

    this.physics.add.collider(player, bombs, hitBomb, null, this);

    // Create move button
    this.disBtn = this.add.group();
    this.disBtn.bg = this.disBtn.create(100, 538, 'btn_1');
    this.disBtn.bg.radius = this.disBtn.bg.width / 2;
    this.disBtn.bg.centerPoint = {
        x: this.disBtn.bg.x,// + this.disBtn.bg.radius,
        y: this.disBtn.bg.y// + this.disBtn.bg.radius
    };

    this.disBtn.btn = this.disBtn.create(this.disBtn.bg.centerPoint.x, this.disBtn.bg.centerPoint.y, 'btn_2');
    //this.disBtn.btn.anchor.set(0.5);
    this.disBtn.btn.inputEnabled = true;

    //开启摇杆按钮点击事件
    this.disBtn.btn.inputEnabled = true;
    //开启摇杆按钮拖动功能
    this.disBtn.btn.input.enableDrag();
    //开始拖动回调，本demo中用不到这个回调
    //this.disBtn.btn.events.onDragStart.add(this.dragStart,this);
    //拖动中的回调
    this.disBtn.btn.events.onDragUpdate.add(this.dragUpdate, this);
    //结束拖动回调
    this.disBtn.btn.events.onDragStop.add(this.dragStop, this);
}

function dragUpdate(e){
		/**
		* 获取触摸点与摇杆中心点的弧度
		* this.angleToXY(触摸点.x, 触摸点.y, 摇杆中心点.x, 摇杆中心点.y)
		*/
		var radian = this.angleToXY(this.game.input.x, this.game.input.y - this.disBtn.cameraOffset.y, this.disBtn.bg.centerPoint.x, this.disBtn.bg.centerPoint.y);
		/**
		* 设置摇杆最大移动范围
		* this.disToXY(摇杆中心点.x, 摇杆中心点.y, 摇杆.x, 摇杆.y)
		*/
		var dis = this.disToXY(this.disBtn.bg.centerPoint.x, this.disBtn.bg.centerPoint.y, this.disBtn.btn.x, this.disBtn.btn.y)
		if(dis > this.disBtn.bg.radius){
			//console.log("超出范围了！");
			/**
			* 设置摇杆新的坐标
			* 公式：
			* X = 中心点.x + 半径 * Math.cos(弧度)
			* Y = 中心点.y + 半径 * Math.sin(弧度)
			*/
			this.disBtn.btn.x = this.disBtn.bg.centerPoint.x + this.disBtn.bg.radius * Math.cos(radian);
			this.disBtn.btn.y = this.disBtn.bg.centerPoint.y + this.disBtn.bg.radius * Math.sin(radian);
		};
		//按照摇杆与中心点的角度，设置人物移动方向
		//this.play.body.velocity.copyFrom(this.game.physics.arcade.velocityFromAngle(radian * 180 / Math.PI, 200));
}

function dragStop(e) {
	//重置摇杆按钮坐标为摇杆中心点
	e.x = this.disBtn.bg.centerPoint.x;
	e.y = this.disBtn.bg.centerPoint.y;
	//停止主角运动
	player.setVelocityX(0);
	player.setVelocityY(0);
	//停止主角动画
    player.anims.play('turn');
}

function update ()
{
    if (gameOver)
    {
        return;
    }

    if (cursors.left.isDown)
    {
        player.setVelocityX(-160);

        player.anims.play('left', true);
    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(160);

        player.anims.play('right', true);
    }
    else
    {
        player.setVelocityX(0);

        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down)
    {
        player.setVelocityY(-330);
    }
}

function collectStar (player, star)
{
    star.disableBody(true, true);

    //  Add and update the score
    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0)
    {
        //  A new batch of stars to collect
        stars.children.iterate(function (child) {

            child.enableBody(true, child.x, 0, true, true);

        });

        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;

    }
}

function hitBomb (player, bomb)
{
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play('turn');

    gameOver = true;
}
