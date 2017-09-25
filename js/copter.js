/**
 * This file creates the JS Canvas Copter game
 *
 * Based on the original flash copter game:
 * http://www.seethru.co.uk/zine/south_coast/helicopter_game.htm
 *
 * @author petegoodman.com
 */

var jsCopter = {

    // object : default options, can be overwritten by init call
    options : {
        canvas : {
            width : 800,
            height : 500,
            refreshRate : 15
        },
        copter : {
            width : 62,
            height : 47,
            topSpeed : 5,                   // max speed
            acceleration : 0.25,            // how much to increase the speed by each time the game refreshes and the button is held down
            img : "images/helicopter.png"          // optional copter image path, relative to the html page
        },
        physics : {
            terminalVelocity : 5,           // max speed
            gravity : 0.5,
            friction : 0.8
        },
        walls : {
            separation : 19,                // fudge
            width : 20,
            step : 5,                       // potential height difference for each new wall
            startHeight : 60,
            maxHeight : 60,
            heightIncreaseInterval : 5,     // how often to increase the height of each wall (from start to max)
            heightIncreaseStep : 0          // how much to increase the height of each wall by
        },
        obstacles : {
            separation : 750,               // frequency of obstacles
            width : 30,
            height : 10
        },
        colours : {
            bg : "#000000",
            fill : "#ff9900",
            light : "#ffffff"
        }
    },

    // object : the game elements
    gameData : {
        copter : {
            x : 30,
            y : 0,
            speed : 0,
            rotation : 0
        },
        walls : {
            counter : 0,
            currentHeight : 0,
            currentStep : 0,
            heightIncreaseInterval : 0,    // fudge
            current : []
        },
        obstacles : {
            counter : 0,
            current : []
        },
        questionCounter : 0
    },

    // image
    copterImg: new Image(),

    // object : scores - ints and html objects
    scores : {
        current : 0,
        top : 0,
        elements : {
            current : null,
            top : null
        },
        halfStep : 0    // fudge
    },

    // object: the html canvas area
    canvas : null,

    // object : the html parent element containing the canvas
    container : null,

    // object : the interval between pie fills
    canvasInterval : null,

    // object : the canvas draw context
    drawContext : null,

    // bool : is the mouse button currently being held down?
    mouseDown : false,

    // bool : is the game currently running?
    gameRunning : false,

    // object : to contain the end text. when you die or win.
    endText : null,

    /**
     * start the JS Copter process
     *
     * @param canvasId string the id of the canvas element that will be created
      * @param parentId string the id of the html element to attach the canvas to
     * @param options object a set of optional options, to set defaults
     *
     * @return void
     */
    init: function(canvasId, parentId, options){

        // search for parent element - if not found, stop now
        this.container = document.getElementById(parentId);

        if (!this.container) return false;

        this.container.style.position = "relative";
        //this.container.style.margin = "2em";
        this.setCanvasSize();

        // set the options
        for (var optionType in options) {
            for (var subOption in options[optionType]) {
                this.options[optionType][subOption] = options[optionType][subOption];
            }
        };

        // Load image
        this.copterImg.src = this.options.copter.img;

        // Create a canvas element
        this.canvas = this.createCanvas(canvasId);

        // Set up the scoring
        this.initScoring();

        // create draw context
        this.drawContext = this.canvas.getContext("2d");

        // Create initial BG content for the canvas
        this.createBG();

        // set the intial copter game data
        this.resetGameData();

        // create copter element
        this.createCopter();

        // create initial floor & ceiling
        this.createInitialWalls();

        // set a mouse and touch listener to start the game
        this.initMouseListener();
        this.initTouchListener();

    },

    setCanvasSize: function() {
        if (window.innerWidth > 600) {
            this.options.canvas.width = Math.min(window.innerWidth - 200, 1000);
        } else if (window.innerWidth > 400) {
            this.options.canvas.width = window.innerWidth - 100;
        } else if (window.innerWidth > 300) {
            this.options.canvas.width = window.innerWidth - 50;
        } else {
            this.options.canvas.width = window.innerWidth - 25;
        }
        this.options.canvas.height = Math.min(window.innerHeight - 20, 600);
        this.container.style.width = this.options.canvas.width+"px";
        this.container.style.height = this.options.canvas.height+"px";
    },

    /*
     * create a canvas element of specific size
     *
     * @param id string the id of the canvas element that will be created
     *
     * @return canvas object the created canvas
      */
    createCanvas: function(canvasId) {

        // create the canvas
        var canvas = document.createElement("canvas");
        canvas.id = canvasId;
        canvas.width = this.options.canvas.width;
        canvas.height = this.options.canvas.height;
        canvas.setAttribute('class', 'nopopup');

        this.container.appendChild(canvas);

        return canvas;
    },


    /*
     * create initial border and fill of canvas element
     *
     */
    createBG: function() {

        // get the global draw context
        var draw = this.drawContext;

        // draw the outer rounded rectangle
        draw.clearRect(0,0,this.options.canvas.width, this.options.canvas.height);
        draw.beginPath();
        this.roundedRect(draw, 0, 0, this.options.canvas.width, this.options.canvas.height, 10);

        var img = new Image();
        img.src = 'images/rock.jpg';
        var pattern = draw.createPattern(img, 'repeat');
        draw.fillStyle = pattern;
        draw.fillRect(0,0, this.options.canvas.width, this.options.canvas.height);

    },


    /*
     * Reset game data
     */
    resetGameData: function() {

        // reset question counter
        this.gameData.questionCounter = 0;

        // reset current score
        this.scores.current = this.scores.elements.current.innerHTML = 0;

        // reset 'y' position of copter
        this.gameData.copter.y = Math.round(this.options.canvas.height/2);

        // reset the starting height of the walls
        this.gameData.walls.currentHeight = this.options.walls.startHeight;

        // reset the steps between wall heights
        this.gameData.walls.currentStep = this.options.walls.step;

        // set first obstacle to start straight away
        this.gameData.obstacles.counter = this.options.obstacles.separation - this.options.obstacles.width;

        // remove all obstacles
        this.gameData.obstacles.current.length = 0;

        // remove all walls
        this.gameData.walls.current.length = 0;

        // reset end text
        if (!!this.endText) {
            this.endText.style.display = "none";
        }

        // create initial floor and ceiling
        this.createInitialWalls();
    },


    /*
     * create initial copter element
     * @param draw object the canvas draw context
     */
    createCopter: function() {

        // get the global draw context
        var draw = this.drawContext;

        // condition : calculate copter position based on whether the mouse is currently held down
        if(this.mouseDown === true) {
            this.gameData.copter.speed -= this.options.copter.acceleration;
            if (this.gameData.copter.speed < -this.options.copter.topSpeed) this.gameData.copter.speed = -this.options.copter.topSpeed;
            this.gameData.copter.rotation = this.gameData.copter.rotation - 0.01;
            if (this.gameData.copter.rotation < -0.25) this.gameData.copter.rotation = -0.25;

        // mouse button not held down
        } else {
            this.gameData.copter.speed = (this.gameData.copter.speed + this.options.physics.gravity) * this.options.physics.friction;
            if(this.gameData.copter.speed > this.options.physics.terminalVelocity) this.gameData.copter.speed = this.options.physics.terminalVelocity;
            this.gameData.copter.rotation = this.gameData.copter.rotation + 0.02;
            if (this.gameData.copter.rotation > 0) this.gameData.copter.rotation = 0;
        }

        // set new Y position
        this.gameData.copter.y = this.gameData.copter.y + this.gameData.copter.speed;

        // create and position copter element
        draw.save();
        draw.translate(this.gameData.copter.x, this.gameData.copter.y);
        //draw.rotate(this.gameData.copter.rotation);

        // condition : if an image is specified, use it
        if (this.options.copter.img) {
            draw.drawImage(this.copterImg, 0, 0);
        // no image set, use a block
        } else {
            draw.beginPath();
            this.roundedRect(draw, 0, 0, this.options.copter.width, this.options.copter.height, 10);
            draw.fillStyle = this.options.colours.light;
            draw.fill();
        }

        draw.restore();
    },


    /*
     * Create a rounded rectangle
     * From: https://developer.mozilla.org/samples/canvas-tutorial/2_7_canvas_combined.html
     *
     */
    roundedRect: function(draw, x, y, width, height, radius) {
        draw.beginPath();
        draw.moveTo(x,y+radius);
        draw.lineTo(x,y+height-radius);
        draw.quadraticCurveTo(x,y+height,x+radius,y+height);
        draw.lineTo(x+width-radius,y+height);
        draw.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
        draw.lineTo(x+width,y+radius);
        draw.quadraticCurveTo(x+width,y,x+width-radius,y);
        draw.lineTo(x+radius,y);
        draw.quadraticCurveTo(x,y,x,y+radius);
        //draw.stroke();
    },


    /**
     * Initialise the scoring
     *
     */
    initScoring: function() {

        // create score html elements and add them to the page
        this.scores.elements.current = this.createScore('current');
        this.scores.elements.top = this.createScore('top');

        // retrieve the current top score from cookie, if cookie script is present
        if (!!cookie && !!cookie.get) {
            var topScore = cookie.get('topScore');
        }

        // condition : if a current top score exists, set it
        if (topScore) {
            this.scores.top = this.scores.elements.top.innerHTML = topScore;
        }
    },


    /**
     * create score html elements
     *
     */
    createScore: function(scoreType) {

        // create score element
        var scoreContainer = document.createElement("p");
        scoreContainer.id = scoreType+"scorecontainer";
        var scoreContainerText = document.createTextNode(this.ucFirst(scoreType) + " score: ");
        scoreContainer.appendChild(scoreContainerText);

        // create score container, ready to return
        var score = document.createElement("strong");
        score.id = scoreType+"score";

        // set the current score to 0
        var scoreText = document.createTextNode("0");
        score.appendChild(scoreText);
        scoreContainer.appendChild(score);

        // add the scores to the page
        this.container.appendChild(scoreContainer);

        return score;
    },


    /**
     * Initialise the mouse listener, to detect when the mouse button is being pressed
     */
    initMouseListener: function(){

        // save 'this' state
        var that = this;

        // detect mouse press
        document.onmousedown = function(event) {

            // condition : if mouse press is over the canvas element
            if (event.target.id == that.canvas.id) {

                // tells the game
                that.mouseDown = true;

                // condition : if the game is not currently running, start it
                if (that.gameRunning === false) {
                    that.startGame();
                }
            }
        }

        // detect mouse release
        document.onmouseup = function(event) {
            that.mouseDown = false;
        }
    },

    /**
     * Initialise the touch listener, to detect when the canvas is touched
     */
    initTouchListener: function(){

        // save 'this' state
        var that = this;

        // detect touch press
        document.ontouchstart = function(event) {

            // condition : if mouse press is over the canvas element
            if (event.target.id == that.canvas.id) {

                // tells the game
                that.mouseDown = true;

                // condition : if the game is not currently running, start it
                if (that.gameRunning === false) {
                    that.startGame();
                }
            }
        }

        // detect touch release
        document.ontouchend = function(event) {
            that.mouseDown = false;
        }
    },


    /*
     * Start the game
     */
    startGame: function() {

        // reset game data
        this.resetGameData();

        // set running variable
        this.gameRunning = true;

        // set interval to start the game
        this.canvasInterval = setInterval('jsCopter.draw()', this.options.canvas.refreshRate);
    },


    /*
     * Draw the canvas element; function called repeatedly by interval
     *
     */
    draw: function() {

        // check for impact
        var impact = this.checkForImpact();

        // condition : check for an impact
        if (impact === 0) {

            // update graphics
            this.createBG();
            this.createCopter();
            this.createWalls();
            this.createObstacles();

            // update score
            this.updateScore();

        // condition : an impact has occurred, end the game
        } else {
            this.endGame(impact);
        }
    },


    /*
     * Check the current position of the copter, to see if it has hit something
     */
    checkForImpact: function() {

        // condition : OBSTACLES - only want to check for impacts on the latest, if it's in range
        if (this.gameData.obstacles.current.length >=1) {

            // loop through the obstacles
            for (var x = this.gameData.obstacles.current.length-1; x >= 0; x--){

                // only check the current obstacle if it overlaps horizontally with the copter
                if(
                    this.gameData.obstacles.current[x].x == this.gameData.copter.x) {
                    // condition : check if the copter is in the good answer zone (to get points!)
                    var impactQuestion = secretVariable.questions[this.gameData.obstacles.current[x].question]

                    if (((md5(impactQuestion.label2) == impactQuestion.correct) && this.gameData.copter.y > (this.gameData.obstacles.current[x].y + this.options.obstacles.height)) ||
                        ((md5(impactQuestion.label1) == impactQuestion.correct) && (this.gameData.copter.y + this.options.copter.height) < this.gameData.obstacles.current[x].y)) {
                        this.scores.current++;
                    }
                }
            }
        }


        // loop through walls that we need to do detection
        for (var i = 0; i < this.gameData.walls.current.length; i++){

            if (this.gameData.walls.current[i].x < this.options.walls.width + this.options.copter.width) {

                // condition : check for impacts on the walls that are in range
                if (
                    (
                        this.gameData.walls.current[0].width == (this.options.canvas.width + this.options.walls.width) || // first wall
                        this.gameData.walls.current[i].x >=0 // all other walls
                    ) && (
                        this.gameData.copter.y < this.gameData.walls.current[i].height || //top
                        this.gameData.copter.y > (this.options.canvas.height - this.options.copter.height - (this.gameData.walls.current[i].y-this.gameData.walls.current[i].height)) // bottom
                    )
                ) {
                    return 1;
                }
            }
        }

        // condition : final impact check - if somehow the copter has gone off screen, above or below
        if (this.gameData.copter.y < 0 || this.gameData.copter.y > (this.options.canvas.height - this.options.copter.height)) {
            return 1;
        }

        // no impact detected
        return 0;
    },


    /*
     * create the initial floor and ceiling
     */
    createInitialWalls: function() {

        // get the global draw context
        var draw = this.drawContext;

        // generate values for the new wall
        var newwall = {
            x: 0,
            y: this.gameData.walls.currentHeight,
            width : this.options.canvas.width + this.options.walls.width,
            height : (this.gameData.walls.currentHeight/2)
        }

        // add wall to the array
        this.gameData.walls.current.push(newwall);

        // draw ceiling
        draw.save();
        draw.beginPath();
        draw.fillStyle = this.options.colours.fill;
        draw.fillRect(newwall.x, 0, newwall.width, newwall.height);
        draw.fill();
        draw.restore();

        // draw floor
        draw.beginPath();
        draw.fillStyle = this.options.colours.fill;
        draw.fillRect(newwall.x, this.options.canvas.height-newwall.height, newwall.width, newwall.height);
        draw.fill();
    },


    /*
     * create the floor and ceiling
     */
    createWalls: function() {

        // get the global draw context
        var draw = this.drawContext;

        // condition : if the separation (between walls) has been reached, create a new wall
        if (this.gameData.walls.counter++ >= Math.floor(this.options.walls.separation/this.options.copter.topSpeed)) {

            // get previous wall height
            var previousHeight = this.gameData.walls.current[this.gameData.walls.current.length-1].height;

            // random decision, whether to increase, decrease or keep the same height
            var plusMinus = Math.round(Math.random(3));

            // set variable that will contain new height
            var newHeight;

            // condition : calculate the new height
            if (plusMinus == 0) {
                newHeight = previousHeight + 1;
            } else if (plusMinus == 1) {
                newHeight = previousHeight - 1;
            } else {
                newHeight = previousHeight;
            }

            // condition : stop the height going too...high
            if (newHeight > this.gameData.walls.currentHeight) {
                newHeight = this.gameData.walls.currentHeight;
            }

            // condition : stop the height going too...low
            if (newHeight < 0) {
                newHeight = 0;
            }

            // generate values for the new wall
            var newwall = {
                x: this.options.canvas.width,
                y: this.gameData.walls.currentHeight,
                width: this.options.walls.width,
                height: newHeight
            }

            // add wall to the array
            this.gameData.walls.current.push(newwall);

            // reset wall separation counter
            this.gameData.walls.counter = 0;
        }

        // draw every wall in the array
        for (var i=0; i < this.gameData.walls.current.length; i++) {

            // draw ceiling
            draw.save();
            draw.beginPath();
            draw.fillStyle = this.options.colours.fill;
            draw.fillRect(this.gameData.walls.current[i].x-=this.options.copter.topSpeed, 0, this.gameData.walls.current[i].width, this.gameData.walls.current[i].height);
            draw.fill();
            draw.restore();

            // draw floor
            draw.beginPath();
            draw.fillStyle = this.options.colours.fill;
            draw.fillRect(this.gameData.walls.current[i].x, this.options.canvas.height-(this.gameData.walls.current[i].y-this.gameData.walls.current[i].height), this.gameData.walls.current[i].width, this.gameData.walls.current[i].y-this.gameData.walls.current[i].height);
            draw.fill();

            // condition : if the last wall in the array has disappeared off screen, remove it
            if (this.gameData.walls.current[i].x <= - (2*this.gameData.walls.current[i].width)) {
                this.gameData.walls.current.splice(i, 1);
            }
        }
    },



    /*
     * Update the obstacles
     */
    createObstacles: function() {

        // get the global draw context
        var draw = this.drawContext;

        // condition : if the separation (between obstacles) has been reached, create a new obstacle
        if (this.gameData.obstacles.counter++ >= Math.floor(this.options.obstacles.separation/this.options.copter.topSpeed)) {

            // winning situation
            if (this.gameData.questionCounter == secretVariable.questions.length) {
                this.endGame(2);
            } else {
                // condition : increase the current height of the walls every x number of times
                if (
                        this.gameData.walls.currentHeight <= this.options.walls.maxHeight &&
                        this.options.walls.heightIncreaseInterval > 0 &&
                        (this.gameData.walls.heightIncreaseInterval++ == this.options.walls.heightIncreaseInterval)
                ) {

                    // increase the potential height of each wall
                    this.gameData.walls.currentHeight += this.options.walls.heightIncreaseStep;

                    // increase slightly the potential height difference between each wall
                    this.gameData.walls.currentStep++;

                    // reset counter
                    this.gameData.walls.heightIncreaseInterval = 0;
                }

                // generate values for the new obstacle
                var newObstacle = {
                    //  making sure copter and obstacle can collide on a given topSpeed decrement
                    x: this.options.canvas.width - (this.options.canvas.width % this.options.copter.topSpeed),
                    y: Math.floor(Math.random() * this.options.canvas.height/3 + this.options.canvas.height/3),
                    question : this.gameData.questionCounter++
                }

                // add obstacle to the array
                this.gameData.obstacles.current.push(newObstacle);

                // reset obstacle separation counter
                this.gameData.obstacles.counter = 0;
            }
        }

        // draw every obstacle in the array
        for (var i=0; i < this.gameData.obstacles.current.length; i++) {

            draw.beginPath();
            draw.fillStyle = this.options.colours.fill;
            this.roundedRect(draw, this.gameData.obstacles.current[i].x-=this.options.copter.topSpeed, this.gameData.obstacles.current[i].y, this.options.obstacles.width, this.options.obstacles.height, 10);
            draw.fill();

            // condition : if the last obstacle in the array has disappeared off screen, remove it
            if (this.gameData.obstacles.current[i].x <= 0) {
                this.gameData.obstacles.current.splice(i, 1);
            }

            draw.font = "30px Arial";
            draw.fillText(secretVariable.questions[this.gameData.obstacles.current[i].question].label1,this.gameData.obstacles.current[i].x, this.gameData.obstacles.current[i].y+30-this.options.canvas.height/6);
            draw.fillText(secretVariable.questions[this.gameData.obstacles.current[i].question].label2,this.gameData.obstacles.current[i].x, this.gameData.obstacles.current[i].y+this.options.obstacles.height+this.options.canvas.height/6);

        }
    },


    /*
     * Update the score - every second time, to stop it increasing so quickly
     */
    updateScore: function() {
        this.scores.halfStep = (this.scores.halfStep == 0) ? 1 : 0;
        if (this.scores.halfStep == 1) {
            this.scores.elements.current.innerHTML = this.scores.current;
        }
    },


    /*
     * Function to call when the game has come to an end
     */
    endGame: function(impact) {

        // condition : if the current score is higher than the top score, set it
        if (this.scores.current > this.scores.top) {

            // set the top score
            this.scores.top = this.scores.current;
            this.scores.elements.top.innerHTML = this.scores.current;

            // set cookie containing the top score
            if (cookie && cookie.set) {
                cookie.set('topScore', this.scores.current, 1000, '/');
            }
        }

        this.endText = document.createElement("p");
        this.endText.id = "endtext";
        var message = "I drove the AIcopter and got a score of " + this.scores.top + "/" + (secretVariable.questions.length-1) + "! ";
        this.endText.appendChild(document.createTextNode(message));

        var tweetThis = document.createElement("a");
        tweetThis.setAttribute("href", "https://twitter.com/intent/tweet?text=" + message + " #machinelearning #ai");
        tweetThis.setAttribute("class", "twitter-share-button");
        tweetThis.setAttribute("id", "tweetButton");
        tweetThis.setAttribute("data-size", "large");

        this.endText.appendChild(tweetThis);
        this.container.appendChild(this.endText);

          // dynamically bind this tweet bnutton
        twttr.widgets.load(
            document.getElementById("tweetButton")
        );

        this.endText.style.display = "block";

        // stop the interval
        clearInterval(this.canvasInterval);

        // set running variable
        this.gameRunning = false;
    },


    /**
     * function to Capitalise the First text Character of A string
     * @param {string} title the url of the new link
     * @returns {string} the new Text String
     */
    ucFirst: function(textString) {
        //return textString.substr(0,1).toUpperCase() + textString.substr(1,textString.length);
        return textString;
    },

}