
function Game(renderer, canvas) {
    // ------------------------------------------------------------------------
    // Public properties ------------------------------------------------------
    // ------------------------------------------------------------------------
    this.renderer   = renderer;
    this.canvas     = canvas;
    this.isRunning  = true;
    this.numFrames  = 0;
    this.clock      = new THREE.Clock();
    this.scene      = null;
    this.camera     = null;
    this.objects    = [];
    this.lights     = [];
    this.level      = null;
    this.player     = [];
    this.playerDist = [];
    this.oldplayer  = new THREE.Vector3();
    this.oldplayerDist = [];

    // ------------------------------------------------------------------------
    // Private constants ------------------------------------------------------
    // ------------------------------------------------------------------------
    var FOV    = 67,
        ASPECT = canvas.width / canvas.height,
        NEAR   = 1,
        FAR    = 1000;

    var eyeup;//eyeup=this.camera.position.y-this.player.position.y
    var debug=0;//set it to be zero in real game. -40 means camera is 40 pixels behind a box

    // ------------------------------------------------------------------------
    // Game Methods -----------------------------------------------------------
    // ------------------------------------------------------------------------
    (function init (game) {
        console.log("Game initializing...");

        // Setup scene
        game.scene = new THREE.Scene();

        // Setup player
        game.player = new THREE.Mesh(
            new THREE.CubeGeometry(10, 22, 5),
            new THREE.MeshBasicMaterial({ color: "#00ff00" })
        );
        game.player.position.set(320, 200, 320);
        game.scene.add(game.player);

        // Setup camera
        game.camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR);
        game.camera.position.add(
            game.player.position,
            new THREE.Vector3(0, eyeup, debug));
        game.camera.lookAt(new THREE.Vector3(50,0,50));
        game.scene.add(game.camera);

        // Setup a light that will move with the player
        game.lights[0] = new THREE.PointLight(0xdddddd);
        game.lights[0].position.set(
            game.player.position.x,
            game.player.position.y + 32,
            game.player.position.z);
        game.scene.add(game.lights[0]);

        // Load the test level
        game.level = new Level(10, game.scene, game.objects);

        console.log("Game initialized.");
    }) (this);


    // Update everything in the scene
    // ------------------------------------------------------------------------
    this.update = function (input) {
        var triggerAD = input.trigger.A - input.trigger.D,
            triggerWS = input.trigger.W - input.trigger.S,
            triggerQE = input.trigger.Q - input.trigger.E,
            look = new THREE.Vector3(),
            velocity = 8,
            xzNorm;

        // Reorient camera
        if (!document.pointerLockEnabled) {
            if ((input.mouseX - canvas.offsetLeft) / canvas.width < 0.2) {
                input.center -= 0.1 * (0.2 - (input.mouseX - canvas.offsetLeft) / canvas.width);
            }
            if ((input.mouseX - canvas.offsetLeft) / canvas.width > 0.8) {
                input.center += 0.1 * ((input.mouseX - canvas.offsetLeft) / canvas.width - 0.8);
            }
        }
        input.f.z = Math.sin(input.theta) * Math.sin(input.phi + input.center)
        input.f.x = Math.sin(input.theta) * Math.cos(input.phi + input.center);
        input.f.y = Math.cos(input.theta);

        // TODO: move some of this into a player class
        if (input.hold == 1) {
            if (input.trigger.Jump == 1) {
                input.v = velocity;
                input.trigger.Jump = 0;
                input.hold = 0;
                this.player.position.y += input.v;
                input.v -= 0.5;
            }
        } else {
            this.player.position.y += input.v;
            input.v -= 0.5;
        }

        // Update player position
        xzNorm = Math.sqrt(input.f.x * input.f.x + input.f.z * input.f.z);
        this.player.position.add(
            this.player.position,
            new THREE.Vector3(
                triggerWS * input.f.x + triggerAD * input.f.z / xzNorm,
                triggerQE * input.f.y * 10, //previouly, triggerWS * input.f.y,
                triggerWS * input.f.z - triggerAD * input.f.x / xzNorm
            )
        );

        // Update camera position/lookat 
        this.camera.position = this.player.position;
        look.add(this.camera.position, input.f);
        this.camera.lookAt(look);

        // Update the player's light
        this.lights[0].position.set(
            this.player.position.x,
            this.player.position.y + 32,
            this.player.position.z);

        //collision detection code
        handleCollisions(this, input);
    };


    // Draw the scene as seen through the current camera
    // ------------------------------------------------------------------------
    this.render = function () {
        this.renderer.render(this.scene, this.camera);
        ++this.numFrames;        
    };

} // end Game object


// ----------------------------------------------------------------------------
// Handle collision detection
// ----------------------------------------------------------------------------
function handleCollisions (game, input) {
    if (input.trigger.A || input.trigger.D || input.trigger.W || input.trigger.S || input.hold == 0) {
        input.hold = 0;
        for (var vertexIndex = 0; vertexIndex < game.player.geometry.vertices.length; vertexIndex++) {
            var directionVector = game.player.geometry.vertices[vertexIndex].clone();
            var ray = new THREE.Ray(game.player.position, directionVector.clone().normalize());
            var collisionResults = ray.intersectObjects(game.objects);
            if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < 1e-6) {
                if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                    var i = 0;
                    var j = 0;
                    var k = 0;
                    if (game.player.position.x - game.oldplayer.x > 0) {
                        for (i = 1; i <= game.player.position.x - game.oldplayer.x; i++) {
                            ray = new THREE.Ray(new THREE.Vector3(game.oldplayer.x + i, game.oldplayer.y, game.oldplayer.z), directionVector.clone().normalize());
                            collisionResults = ray.intersectObjects(game.objects);
                            if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                break;
                            }
                        }
                        i -= 1;
                    }
                    if (game.player.position.x - game.oldplayer.x < 0) {
                        for (i = -1; i >= game.player.position.x - game.oldplayer.x; i--) {
                            ray = new THREE.Ray(new THREE.Vector3(game.oldplayer.x + i, game.oldplayer.y, game.oldplayer.z), directionVector.clone().normalize());
                            collisionResults = ray.intersectObjects(game.objects);
                            if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                break;
                            }
                        }
                        i += 1;
                    }

                    if (game.player.position.y - game.oldplayer.y > 0) {
                        for (j = 1; j <= game.player.position.y - game.oldplayer.y; j++) {
                            ray = new THREE.Ray(new THREE.Vector3(game.oldplayer.x + i, game.oldplayer.y + j, game.oldplayer.z), directionVector.clone().normalize());
                            collisionResults = ray.intersectObjects(game.objects);
                            if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                break;
                            }
                        }
                        j -= 1;
                    }
                    if (game.player.position.y - game.oldplayer.y < 0) {
                        for (j = -1; j >= game.player.position.y - game.oldplayer.y; j--) {
                            ray = new THREE.Ray(new THREE.Vector3(game.oldplayer.x + i, game.oldplayer.y + j, game.oldplayer.z), directionVector.clone().normalize());
                            collisionResults = ray.intersectObjects(game.objects);
                            if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                break;
                            }
                        }
                        j += 1;
                    }

                    if (game.player.position.z - game.oldplayer.z > 0) {
                        for (k = 1; k <= game.player.position.z - game.oldplayer.z; k++) {
                            ray = new THREE.Ray(new THREE.Vector3(game.oldplayer.x + i, game.oldplayer.y + j, game.oldplayer.z + k), directionVector.clone().normalize());
                            collisionResults = ray.intersectObjects(game.objects);
                            if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                break;
                            }
                        }
                        k -= 1;
                    }
                    if (game.player.position.z - game.oldplayer.z < 0) {
                        for (k = -1; k >= game.player.position.z - game.oldplayer.z; k--) {
                            ray = new THREE.Ray(new THREE.Vector3(game.oldplayer.x + i, game.oldplayer.y + j, game.oldplayer.z + k), directionVector.clone().normalize());
                            collisionResults = ray.intersectObjects(game.objects);
                            if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                break;
                            }
                        }
                        k += 1;
                    }

                    game.player.position.add(game.oldplayer, new THREE.Vector3(i, j, k));
                    game.camera.position.add(game.player.position, new THREE.Vector3(0, game.eyeup, game.debug));
                }

                ray = new THREE.Ray(new THREE.Vector3().add(game.player.position, new THREE.Vector3(0, -1, 0)), directionVector.clone().normalize());
                collisionResults = ray.intersectObjects(game.objects);
                if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                    input.hold = 1;
                    input.v = 0;
                }
                else {
                    input.hold = 0;
                }
            }
        }

        game.oldplayer.copy(game.player.position);
    }
} // end function handleCollisions()

