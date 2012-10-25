// ----------------------------------------------------------------------------
// Initialize Game
// ----------------------------------------------------------------------------
(function initialize() {
    var canvas = document.getElementById("canvas"),
        canvasWidth = window.innerWidth,
        canvasHeight = window.innerHeight,
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: canvas,
            clearColor: 0x000000,
            clearAlpha: 1,
            maxLights: MAX_LIGHTS // default is 4, adding more results in errors
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
    document.getElementsByTagName("body")[0].style.margin = "0";
    document.getElementsByTagName("body")[0].style.padding = "0";
    document.getElementsByTagName("body")[0].style.overflow = "hidden";

    //document.getElementById("healthbar").style.width = "25%";
    //document.getElementById("healthbar").style.margin = "auto 0px";
    //document.getElementById("healthbar").style.text_align = "center";
    //document.getElementById("healthbar").style.color = "rgb(255,0,0)";

    // Setup sizes and add the renderer to the document 
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    renderer.setSize(canvasWidth, canvasHeight);
    document.getElementById("container").appendChild(renderer.domElement);

    // Setup stats (fps and ms render time graphs)
    stats.setMode(0); // mode 0 = fps, mode 1 = ms render time
    stats.domElement.style.position = "absolute";
    stats.domElement.style.top = canvas.offsetTop + 4 + "px";
    stats.domElement.style.left = canvas.offsetLeft + "px";
    document.getElementById("container").appendChild(stats.domElement);



     // Create Game object
    game = new Game(renderer, canvas);

    // Setup input handlers and populate input data object
    setupInput(inputData, game);

    // Enter main loop
    (function mainLoop() {
        if ((game.stopTime === 1 && game.firstLoad === 0) || game.update(inputData) === 0) {
            game.drawInstruction(inputData);
            requestFrame(mainLoop);
        }
        else {
            stats.begin();
            game.firstLoad = 0;
            requestFrame(mainLoop);
            game.render(inputData);
            stats.end();
        }
    })();

    window.onresize = function (event) {
        game.camera.aspect = window.innerWidth / window.innerHeight;
        game.camera.updateProjectionMatrix();
        var canv = document.getElementById("canvas");
        canv.height = window.innerHeight;
        canv.width = window.innerWidth;
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
})();



// ----------------------------------------------------------------------------
// Setup input handlers and populate input data object
// ----------------------------------------------------------------------------
function setupInput(data, game) {
    // Setup input data structure
    data.viewRay = null;
    data.click = 0;
    data.mouseX = canvas.offsetLeft + canvas.width / 2;
    data.mouseY = canvas.offsetTop + canvas.height / 2;
    data.center = -Math.PI / 2;
    data.theta = Math.PI / 2;
    data.phi = 0;
    data.f = new THREE.Vector3();
    data.v = 0;
    data.hold = 0;
    data.trigger = { W: 0, S: 0, A: 0, D: 0, Q: 0, E: 0, F: 0, Jump: 0, TNT: 0, Gun: 0, Armor: 0, Ammo: 0, R: 0, Help:  1};

    // Hookup key input
    document.addEventListener("keydown", function (event) {
        if (event.keyCode != 116) {
            event.preventDefault();
        }
        switch (event.keyCode) {
            case 87: data.trigger.W = 1; break;
            case 83: data.trigger.S = 1; break;
            case 65: data.trigger.A = 1; break;
            case 68: data.trigger.D = 1; break;
            case 81: data.trigger.Q = 1; break;
            case 69: data.trigger.E = 1; break;
            case 70: data.trigger.F = 1; break;
            case 32: data.trigger.Jump = 1; break;
            case 84: data.trigger.TNT = 1; break;
            case 71: data.trigger.Gun = 1; break;
            case 72: data.trigger.Armor = 1; break;
            case 66: data.trigger.Ammo = 1; break;
            case 82: data.trigger.R = 1; break;
            case 112:
                data.trigger.Help = 1 - data.trigger.Help;
                game.stopTime = 1 - game.stopTime;
                if (game.stopTime === 0) {
                    game.clock.getDelta();
                    game.clock2.getDelta();
                    game.clock3.getDelta();
                    game.clock4.getDelta();
                    game.clock5.getDelta();
                }
                break;
        }
    }, false);

    // Hookup key input
    document.addEventListener("keyup", function (event) {
	event.preventDefault();
        switch (event.keyCode) {
            case 87: data.trigger.W = 0; break;
            case 83: data.trigger.S = 0; break;
            case 65: data.trigger.A = 0; break;
            case 68: data.trigger.D = 0; break;
            case 81: data.trigger.Q = 0; break;
            case 69: data.trigger.E = 0; break;
        }
    }, false);

    document.addEventListener("mousedown", function (event) {
	event.preventDefault();
        if (!canvas.pointerLockEnabled) {
            canvas.requestPointerLock();
        }
        data.click = 1;
    }, false);
    document.addEventListener("mouseup", function (event) {
	event.preventDefault();
        data.click = 0;
    }, false);

    //when pointerLock can be enabled
    function moveLookLocked(xDelta, yDelta) {
        data.phi += xDelta * 0.0025;
        while (data.phi < 0)
            data.phi += Math.PI * 2;
        while (data.phi >= Math.PI * 2)
            data.phi -= Math.PI * 2;

        data.theta += yDelta * 0.0025;
        if (data.theta < 1e-6) {
            data.theta = 1e-6;
        }
        if (data.theta > Math.PI - 1e-6) {
            data.theta = Math.PI - 1e-6;
        }
    }

    //when pointerLock cannot be enabled
    function moveLook(px, py) {
        data.mouseX = px;
        data.mouseY = py;
        data.theta = (data.mouseY - canvas.offsetTop) / (canvas.height / 2) * Math.PI / 2;
        if (data.theta < 1e-6) {
            data.theta = 1e-6;
        }
        if (data.theta > Math.PI - 1e-6) {
            data.theta = Math.PI - 1e-6;
        }

        data.phi = ((data.mouseX - canvas.offsetLeft) / (canvas.width / 2) - 1) * Math.PI / 2;
        if (data.phi < 0) {
            data.phi += 2 * Math.PI;
        }
        if (data.theta > 2 * Math.PI) {
            data.phi -= 2 * Math.PI;
        }
    }
    document.addEventListener("mousemove", function (event) {
        event.preventDefault();
        if (document.pointerLockEnabled) {
            moveLookLocked(event.movementX, event.movementY);
        } else {
            moveLook(event.pageX, event.pageY);
        }
    }, false);
}

