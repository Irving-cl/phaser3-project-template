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
    scale: {
        mode: Phaser.Scale.FIT,
        //autoCenter: Phaser.Scale.CENTER_BOTH,
        autoCenter: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
        width: 800,
        height: 600
    },
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
var disBtn;

var dragLeft = false;
var dragRight = false;
var dragUp = false;

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
    //this.add.image(400, 300, 'sky');
    this.add.image(0, 0, 'sky').setOrigin(0);

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
    disBtn = this.add.group();
    disBtn.bg = disBtn.create(100, 538, 'btn_1');
    disBtn.bg.radius = disBtn.bg.width / 2;
    disBtn.bg.centerPoint = {
        x: disBtn.bg.x,// + this.disBtn.bg.radius,
        y: disBtn.bg.y// + this.disBtn.bg.radius
    };

    disBtn.btn = disBtn.create(disBtn.bg.centerPoint.x, disBtn.bg.centerPoint.y, 'btn_2').setInteractive();
    disBtn.btn.radius = disBtn.btn.width / 2;
    this.input.setDraggable(disBtn.btn);
    this.input.on('dragstart', function(pointer, gameObject) {

    });
    this.input.on('drag', function(pointer, gameObject, dragX, dragY) {
        var dtX = dragX - disBtn.bg.x;
        var dtY = dragY - disBtn.bg.y;
        var dist = Math.sqrt(dtX * dtX + dtY * dtY);
        if (dist <= disBtn.bg.radius - disBtn.btn.radius)
        {
            gameObject.x = dragX;
            gameObject.y = dragY;
        }

        // change player's velocity
        if (Math.abs(dtX) >= Math.abs(dtY))
        {
            if (dtX > 0)
            {
                dragRight = true;
            }
            else
            {
                dragLeft = true;
            }
        }
        else
        {
            if (dtY < 0)
            {
                dragUp = true;
            }
        }
    });
    this.input.on('dragend', function(pointer, gameObject) {
        gameObject.x = disBtn.bg.x;
        gameObject.y = disBtn.bg.y;
        dragLeft = dragRight = dragUp = false;
    });
}

function update ()
{
    if (gameOver)
    {
        return;
    }

    if (dragLeft)
    {
        player.setVelocityX(-160);

        player.anims.play('left', true);
    }
    else if (dragRight)
    {
        player.setVelocityX(160);

        player.anims.play('right', true);
    }
    else
    {
        player.setVelocityX(0);

        player.anims.play('turn');
    }

    //if (cursors.up.isDown && player.body.touching.down)
    //{
        //player.setVelocityY(-330);
    //}
    if (dragUp && player.body.touching.down)
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
