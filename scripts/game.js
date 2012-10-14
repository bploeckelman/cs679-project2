var MAX_LIGHTS = 20;

function Game(renderer, canvas) {
    // ------------------------------------------------------------------------
    // Public properties ------------------------------------------------------
    // ------------------------------------------------------------------------
    this.projector  = new THREE.Projector();
    this.renderer   = renderer;
    this.canvas     = canvas;
    this.isRunning  = true;
    this.numFrames  = 0;
    this.clock      = new THREE.Clock();
    this.scene      = null;
    this.camera     = null;
    this.viewRay    = null;
    this.objects    = [];
    this.lights     = [];
    this.bullets    = [];
    this.bulletDelay = 0;
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
        game.scene.add(new THREE.AmbientLight(0x101010));

        // Setup player
        game.player = new THREE.Mesh(
            new THREE.CubeGeometry(10, 22, 5),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 })
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
        game.lights[0] = new THREE.PointLight(0xffccaa, 1.0, 100);
        game.lights[0].position.set(
            game.player.position.x,
            game.player.position.y + 32,
            game.player.position.z);
        game.scene.add(game.lights[0]);

        // Load the test level
        game.level = new Level(10, game);

        //console.log("# Objects: " + game.objects.length);
        console.log("Game initialized.");
    }) (this);


    // Update everything in the scene
    // TODO: try to move most of this stuff out of here so the update function 
    //       becomes cleaner and specialized updates are handled elsewhere
    // for example:
    // updateCamera() updatePlayer() updateBullets() updateLights() handleCollisions()
    // ------------------------------------------------------------------------
    this.update = function (input) {
        var triggerAD = input.trigger.A - input.trigger.D,
            triggerWS = input.trigger.W - input.trigger.S,
            triggerQE = input.trigger.Q - input.trigger.E,
            look = new THREE.Vector3(),
            velocity = 8,
            xzNorm,
            rayVec,
            refireTime = 0.2,
            bullet,
            bulletVel = 4,
            bulletGeom = new THREE.SphereGeometry(0.2, 10, 10),
            bulletMat = new THREE.MeshLambertMaterial({ 
                color: 0xffffff,
                specular: 0xffffff,
                shininess: 100
            });

        // Update the level
        this.level.update();

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

        // Handle jumping
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

        // Update the view ray (center of canvas into screen)
        // NOTE: the near/far range is set short for doors
        //   another way to handle this would be to check the .distance
        //   property of the intersects[0].object when using ray for 
        //   object intersection testing.
        rayVec = new THREE.Vector3(0,0,1);
        this.projector.unprojectVector(rayVec, this.camera);
        input.viewRay = new THREE.Ray(
            this.player.position,                             // origin
            rayVec.subSelf(this.player.position).normalize(), // direction
            0, 40                                             // near, far
        );

        // Handle bullets
        // TODO: move this stuff out into a function
        // TODO: add collision code for bullets
        // TODO: limit amount of ammunition!

        // This allows the player to fire as fast as they can click
        if (input.click === 0) { 
            this.bulletDelay = refireTime; 
        }

        if (input.click === 1) {
            // Toggle doors if there are any directly in line of sight 
            var intersects = input.viewRay.intersectObjects(this.objects),
                selected = null;
            if (intersects.length > 0) {
                selected = intersects[0].object; 
                if (selected.name === "door") {
                    this.level.toggleDoor(selected.doorIndex);
                }
            }

            // Slow down firing rate if player is holding the mouse button down
            this.bulletDelay += this.clock.getDelta();
            if (this.bulletDelay > refireTime) {
                this.bulletDelay = 0;

                // Create a new bullet object
                bullet = {
                    mesh: new THREE.Mesh(bulletGeom, bulletMat),
                    vel: new THREE.Vector3(
                        input.viewRay.direction.x * bulletVel,
                        input.viewRay.direction.y * bulletVel,
                        input.viewRay.direction.z * bulletVel 
                    ),
                    // Adding viewRay.direction moves the bullet 
                    // out in front of the camera a bit so it isn't clipped
                    pos: new THREE.Vector3(
                        input.viewRay.origin.x + input.viewRay.direction.x,
                        input.viewRay.origin.y,
                        input.viewRay.origin.z + input.viewRay.direction.z
                    ),
                    lifetime: 1000
                };

                // Add the new bullet to the scene and bullets array
                this.bullets.push(bullet);
                this.scene.add(bullet.mesh);
            }
        }

        // Update all the bullets, move backwards through array 
        // to avoid problems when removing bullets
        for(var i = this.bullets.length - 1; i >= 0; --i) {
            // Remove bullets that are too old
            // TODO: also remove if bullet has collided with something
            if (--this.bullets[i].lifetime <= 0) {
                this.scene.remove(this.bullets[i].mesh);
                this.bullets.splice(i,1);
            } else { // Update the bullet's position based on its velocity
                this.bullets[i].pos.addSelf(this.bullets[i].vel);
                this.bullets[i].mesh.position = this.bullets[i].pos;
            }
        }

        // Update the player's light
        this.lights[0].position.set(
            this.player.position.x,
            this.player.position.y + 32,
            this.player.position.z);

        //collision detection code
        handleCollisions(this, input);

        // HACK: make the player a little bit taller
        if (this.player.position.y < 20) {
            this.player.position.y = 20;
        }
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
                        for (i = 0.1; i <= game.player.position.x - game.oldplayer.x; i+=0.1) {
                            ray = new THREE.Ray(new THREE.Vector3(game.oldplayer.x + i, game.oldplayer.y, game.oldplayer.z), directionVector.clone().normalize());
                            collisionResults = ray.intersectObjects(game.objects);
                            if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                break;
                            }
                        }
                        i -= 0.1;
                    }
                    if (game.player.position.x - game.oldplayer.x < 0) {
                        for (i = -0.1; i >= game.player.position.x - game.oldplayer.x; i-=0.1) {
                            ray = new THREE.Ray(new THREE.Vector3(game.oldplayer.x + i, game.oldplayer.y, game.oldplayer.z), directionVector.clone().normalize());
                            collisionResults = ray.intersectObjects(game.objects);
                            if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                break;
                            }
                        }
                        i += 0.1;
                    }

                    if (game.player.position.y - game.oldplayer.y > 0) {
                        for (j = 0.1; j <= game.player.position.y - game.oldplayer.y; j+=0.1) {
                            ray = new THREE.Ray(new THREE.Vector3(game.oldplayer.x + i, game.oldplayer.y + j, game.oldplayer.z), directionVector.clone().normalize());
                            collisionResults = ray.intersectObjects(game.objects);
                            if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                break;
                            }
                        }
                        j -= 0.1;
                    }
                    if (game.player.position.y - game.oldplayer.y < 0) {
                        for (j = -0.1; j >= game.player.position.y - game.oldplayer.y; j-=0.1) {
                            ray = new THREE.Ray(new THREE.Vector3(game.oldplayer.x + i, game.oldplayer.y + j, game.oldplayer.z), directionVector.clone().normalize());
                            collisionResults = ray.intersectObjects(game.objects);
                            if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                break;
                            }
                        }
                        j += 0.1;
                    }

                    if (game.player.position.z - game.oldplayer.z > 0) {
                        for (k = 0.1; k <= game.player.position.z - game.oldplayer.z; k+=0.1) {
                            ray = new THREE.Ray(new THREE.Vector3(game.oldplayer.x + i, game.oldplayer.y + j, game.oldplayer.z + k), directionVector.clone().normalize());
                            collisionResults = ray.intersectObjects(game.objects);
                            if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                break;
                            }
                        }
                        k -= 0.1;
                    }
                    if (game.player.position.z - game.oldplayer.z < 0) {
                        for (k = -0.1; k >= game.player.position.z - game.oldplayer.z; k-=0.1) {
                            ray = new THREE.Ray(new THREE.Vector3(game.oldplayer.x + i, game.oldplayer.y + j, game.oldplayer.z + k), directionVector.clone().normalize());
                            collisionResults = ray.intersectObjects(game.objects);
                            if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                break;
                            }
                        }
                        k += 0.1;
                    }

                    game.player.position.add(game.oldplayer, new THREE.Vector3(i, j, k));
                    game.camera.position.add(game.player.position, new THREE.Vector3(0, game.eyeup, game.debug));
                }

                ray = new THREE.Ray(new THREE.Vector3().add(game.player.position, new THREE.Vector3(0, -0.1, 0)), directionVector.clone().normalize());
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

