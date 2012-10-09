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
        data = { mouseX: 0, mouseY: 0 },
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

    // Hookup mouse input
    document.addEventListener("mousemove", function (event) {
        data.mouseX = (event.clientX - window.innerWidth  / 2);
        data.mouseY = (event.clientY - window.innerHeight / 2);
    }, false);

    // Load resources
    // TODO: maybe just do in game init?

    // Create Game object
    var game = new Game(renderer, canvas);

    // Enter main loop
    (function mainLoop() {
        game.update(data);
        requestFrame(mainLoop);
        game.render();
    }) ();
}) ();

