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
    
    var data = { mouseX: canvas.offsetLeft+canvas.width/2, mouseY: canvas.offsetTop+canvas.height/2, center: Math.PI/2, theta: Math.PI/2, phi: 0, Fx: 0, Fy: 0, Fz: 1, triggerW: 0, triggerS: 0, triggerA: 0, triggerD: 0 };

    // Hookup key input
    document.addEventListener("keydown", function (event) {
       switch(event.keyCode) {
       case 87:
            data.triggerW=1;
            break;
       case 83:
            data.triggerS=1;
            break;
       case 65:
            data.triggerA=1;
            break;
       case 68:
            data.triggerD=1;
            break;
       }            
    }, false);
    
    // Hookup key input
    document.addEventListener("keyup", function (event) {
       switch(event.keyCode) {
       case 87:
            data.triggerW=0;
            break;
       case 83:
            data.triggerS=0;
            break;
       case 65:
            data.triggerA=0;
            break;
       case 68:
            data.triggerD=0;
            break;
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

