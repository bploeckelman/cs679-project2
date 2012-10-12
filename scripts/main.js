// ----------------------------------------------------------------------------
// Initialize Game
// ----------------------------------------------------------------------------
(function initialize() {
    var canvas = document.getElementById("canvas"),
        canvasWidth  = 800,
        canvasHeight = 600, 
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: canvas,
            clearColor: 0x000000,
            clearAlpha: 1
        }),  
        stats = new Stats(),
        inputData = {},
        game = null;
        requestFrame = window.requestAnimationFrame
                    || window.webkitRequestAnimationFrame
                    || window.mozRequestAnimationFrame
                    || window.oRequestAnimationFrame
                    || window.msRequestAnimationFrame
                    || function (callback) { window.setTimeout(callback, 1000 / 60); };

    // Style html a bit
    document.getElementsByTagName("body")[0].style.background = "rgb(64,64,64)";
    document.getElementById("container").style.width  = canvasWidth  + "px";
    document.getElementById("container").style.height = canvasHeight + "px";
    document.getElementById("container").style.margin = "auto auto";
    document.getElementById("container").style.border = "4px solid rgb(0,0,128)";

    // Setup sizes and add the renderer to the document 
    canvas.width  = canvasWidth;
    canvas.height = canvasHeight;
    renderer.setSize(canvasWidth, canvasHeight);
    document.getElementById("container").appendChild(renderer.domElement);
    
    // Setup stats (fps and ms render time graphs)
    // TODO: update canvas top/left offsets when browser window resizes
    stats.setMode(0); // mode 0 = fps, mode 1 = ms render time
    stats.domElement.style.position = "absolute";
    stats.domElement.style.top  = canvas.offsetTop  + 4 + "px";
    stats.domElement.style.left = canvas.offsetLeft + "px";
    document.getElementById("container").appendChild(stats.domElement);

    // Setup input handlers and populate input data object
    setupInput(inputData);

    // Load resources
    // TODO: maybe just do in game init?

    // Create Game object
    game = new Game(renderer, canvas);

    // Enter main loop
    (function mainLoop() {
        stats.begin();
        game.update(inputData);
        requestFrame(mainLoop);
        game.render();
        stats.end();
    }) ();
}) ();


// ----------------------------------------------------------------------------
// Setup input handlers and populate input data object
// ----------------------------------------------------------------------------
function setupInput (data) {
    // Setup input data structure
    data.mouseX = canvas.offsetLeft+canvas.width/2;
    data.mouseY = canvas.offsetTop+canvas.height/2;
    data.center = Math.PI/2;
    data.theta = Math.PI/2;
    data.phi = 0;
    data.f = new THREE.Vector3(0,0,1);
    data.v = 0;
    data.trigger = { W: 0, S: 0, A: 0, D: 0, Q: 0, E: 0, Jump: 0};

    // Hookup key input
    document.addEventListener("keydown", function (event) {
        switch(event.keyCode) {
            case 87: data.trigger.W=1; break;
            case 83: data.trigger.S=1; break;
            case 65: data.trigger.A=1; break;
            case 68: data.trigger.D=1; break;
            case 81: data.trigger.Q=1; break;
            case 69: data.trigger.E=1; break;
            case 32: data.trigger.Jump=1; break;
        }            
    }, false);
    
    // Hookup key input
    document.addEventListener("keyup", function (event) {
        switch(event.keyCode) {
            case 87: data.trigger.W=0; break;
            case 83: data.trigger.S=0; break;
            case 65: data.trigger.A=0; break;
            case 68: data.trigger.D=0; break;
            case 81: data.trigger.Q=0; break;
            case 69: data.trigger.E=0; break;
        }            
    }, false);
    
     // Hookup mouse input
    document.addEventListener("mousemove", function (event) {
        data.mouseX=event.pageX;
        data.mouseY=event.pageY;
        data.theta=(data.mouseY - canvas.offsetTop)/(canvas.height /2)*Math.PI/2;
        if (data.theta<1e-6){
            data.theta=1e-6;
        }
        if (data.theta>Math.PI-1e-6){
            data.theta=Math.PI-1e-6;
        }

        data.phi=((data.mouseX - canvas.offsetLeft)/(canvas.width /2)-1)*Math.PI/2;
        if (data.phi<0){
            data.phi+=2*Math.PI;
        }
        if (data.theta>2*Math.PI){
            data.phi-=2*Math.PI;
        }
    }, false);
}

