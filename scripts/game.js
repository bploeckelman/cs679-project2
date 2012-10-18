var MAX_LIGHTS = 20;

function Game(renderer, canvas) {
    // ------------------------------------------------------------------------
    // Public properties ------------------------------------------------------
    // ------------------------------------------------------------------------
    this.projector = new THREE.Projector();
    this.renderer = renderer;
    this.canvas = canvas;
    this.isRunning = true;
    this.numFrames = 0;
    this.clock = new THREE.Clock();
    this.scene = null;
    this.camera = null;
    this.viewRay = null;
    this.objects = [];
    this.lights = [];
    this.bullets = [];
    this.bulletDelay = 0;
    this.level = null;
    this.player = null;
    this.zombie = [];
    this.oldplayer = new THREE.Vector3();
    this.searchDelay = 1;
    this.element = {
        sz: 0,
        sx: 0,
        p: 0
    };
    function element(sz, sx, p) {
        this.sz = sz;
        this.sx = sx;
        this.p = p;
    }

    // ------------------------------------------------------------------------
    // Private constants ------------------------------------------------------
    // ------------------------------------------------------------------------
    var FOV = 67,
        ASPECT = canvas.width / canvas.height,
        NEAR = 1,
        FAR = 500;

    var eyeup;//eyeup=this.camera.position.y-this.player.position.y
    var debug = 0;//set it to be zero in real game. -40 means camera is 40 pixels behind a box

    // ------------------------------------------------------------------------
    // Game Methods -----------------------------------------------------------
    // ------------------------------------------------------------------------
    (function init(game) {
        console.log("Game initializing...");

        // Setup scene
        game.scene = new THREE.Scene();
        game.scene.add(new THREE.AmbientLight(0x101010));

        // Load the test level
        game.level = new Level(10, game);

        // Setup player
        game.player = new THREE.Mesh(
            new THREE.CubeGeometry(10, 22, 5),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        );
        game.player.position.set(
            game.level.startPos.x, 16, game.level.startPos.y);
        game.scene.add(game.player);

        var zombieGeom = new THREE.CubeGeometry(8, 20, 4);
        var texture = new THREE.ImageUtils.loadTexture("images/crate.gif");
        var zombieMat = new THREE.MeshLambertMaterial({ map: texture });

        for (var z = 0; z < game.level.zombiePos.length; z++) {
            Azombie = {
                mesh: new THREE.Mesh(zombieGeom, zombieMat),
                vel: 0.8,
                queue: [],
                at: 0
            };
            Azombie.mesh.position = new THREE.Vector3(game.level.zombiePos[z].x, 10, game.level.zombiePos[z].y),
            game.zombie.push(Azombie);
            game.scene.add(Azombie.mesh);
        };

        // Setup camera
        game.camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR);
        game.camera.position.add(
            game.player.position,
            new THREE.Vector3(0, eyeup, debug));
        game.camera.lookAt(new THREE.Vector3(50, 0, 50));
        game.scene.add(game.camera);

        // Setup a light that will move with the player
        game.lights[0] = new THREE.PointLight(0xffccaa, 1.0, 100);
        game.lights[0].position.set(
            game.player.position.x,
            game.player.position.y + 32,
            game.player.position.z);
        game.scene.add(game.lights[0]);

        //console.log("# Objects: " + game.objects.length);
        console.log("Game initialized.");
    })(this);


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
        rayVec = new THREE.Vector3(0, 0, 1);
        this.projector.unprojectVector(rayVec, this.camera);
        input.viewRay = new THREE.Ray(
            this.player.position,                             // origin
            rayVec.subSelf(this.player.position).normalize(), // direction
            0, 64                                             // near, far
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

        if (this.searchDelay >= 1) {
            this.searchDelay = 0;            
            var visit = new Array(NUM_CELLS.y);
            for (var i = 0; i < NUM_CELLS.y; i++) {
                visit[i] = new Array(NUM_CELLS.x);
            }
            for (var z = 0; z < this.zombie.length; z++) {
                this.zombie[z].queue = [];
                for (var i = 0; i < NUM_CELLS.y; i++) {
                    for (var j = 0; j < NUM_CELLS.x; j++) {
                        visit[i][j] = 0;
                    }
                }

                var oz = Math.floor(Math.floor(this.zombie[z].mesh.position.z) / CELL_SIZE + 0.5);
                var ox = Math.floor(Math.floor(this.zombie[z].mesh.position.x) / CELL_SIZE + 0.5);
                var sz = Math.floor(Math.floor(this.player.position.z) / CELL_SIZE + 0.5);
                var sx = Math.floor(Math.floor(this.player.position.x) / CELL_SIZE + 0.5);
                this.zombie[z].queue.push(new element(sz, sx, 0));
                var pointing = 0;
                var found = 0;
                this.zombie[z].at = -1;
                while (1) {
                    if (this.level.grid[sz][sx].type == CELL_TYPES.door && this.level.state[sz][sx] == 0) {
                        break;
                    }
                    for (var i = -1; i <= 1; i++) {
                        for (var j = -1 + Math.abs(i) ; j <= 1 - Math.abs(i) ; j++) {
                            if (this.level.grid[sz + i][sx + j].type != CELL_TYPES.wall && 
                                visit[sz + i][sx + j] == 0 &&
                                (this.level.grid[sz + i][sx + j].type != CELL_TYPES.door || this.level.state[sz + i][sx + j] == 1)
                                ) {
                                this.zombie[z].queue.push(new element(sz + i, sx + j, pointing));
                                visit[sz + i][sx + j] = 1;
                                if (sz + i == oz && sx + j == ox) {
                                    this.zombie[z].at = this.zombie[z].queue.length - 1;
                                    found = 1;
                                    break;
                                }
                            }
                        }
                        if (found == 1) {
                            break;
                        }
                    }
                    if (found == 1) {
                        break;
                    }
                    pointing++;
                    if (pointing == this.zombie[z].queue.length) {
                        break;
                    }
                    sz = this.zombie[z].queue[pointing].sz;
                    sx = this.zombie[z].queue[pointing].sx;
                }

                if (found == 1) {
                    var start = this.zombie[z].at;
                    while (this.level.grid[this.zombie[z].queue[start].sz][this.zombie[z].queue[start].sx].type == CELL_TYPES.door) {
                        if (start == 0) {
                            break;
                        }
                        start = this.zombie[z].queue[start].p;
                    }
                    if (start != 0) {
                        var link = this.zombie[z].queue[start].p;
                        while (1) {
                            while (this.level.grid[this.zombie[z].queue[link].sz][this.zombie[z].queue[link].sx].type != CELL_TYPES.door) {
                                this.zombie[z].queue[start].p = link;
                                if (link == 0) {
                                    break;
                                }
                                link = this.zombie[z].queue[link].p;
                            }

                            start = this.zombie[z].queue[link].p;
                            if (start == 0) {
                                break;
                            }
                            while (this.level.grid[this.zombie[z].queue[start].sz][this.zombie[z].queue[start].sx].type == CELL_TYPES.door) {
                                if (start == 0) {
                                    break;
                                }
                                start = this.zombie[z].queue[start].p;
                            }
                            link = this.zombie[z].queue[start].p;
                        }
                    }
                }
            }
        }
        else {
            this.searchDelay += this.clock.getDelta();
        }

        for (var z = 0; z < this.zombie.length; z++) {
            if (this.zombie[z].at == -1) {
                continue;
            }
            if (this.zombie[z].queue[this.zombie[z].at].p == 0) {
                moveToz = this.player.position.z;
                moveTox = this.player.position.x;
            }
            else {
                var moveToz = this.zombie[z].queue[this.zombie[z].queue[this.zombie[z].at].p].sz * CELL_SIZE;
                var moveTox = this.zombie[z].queue[this.zombie[z].queue[this.zombie[z].at].p].sx * CELL_SIZE;
            }
            var dz = moveToz - this.zombie[z].mesh.position.z;
            var dx = moveTox - this.zombie[z].mesh.position.x;
            if (dx * dx + dz * dz > 1e-6) {
                var direction = Math.atan2(dx, dz);
                var needMove = 1;
                if (Math.abs(this.zombie[z].mesh.rotation.y - direction) > 1e-6) {
                    if (Math.abs(this.zombie[z].mesh.rotation.y - direction) > Math.PI) {
                        if (this.zombie[z].mesh.rotation.y > direction) {
                            if (this.zombie[z].mesh.rotation.y > direction + 2 * Math.PI - 0.2) {
                                this.zombie[z].mesh.rotation.y = direction;
                            }
                            else {
                                needMove = 0;
                                this.zombie[z].mesh.rotation.y += 0.2;
                                if (this.zombie[z].mesh.rotation.y > Math.PI) {
                                    this.zombie[z].mesh.rotation.y -= 2 * Math.PI;
                                }
                            }
                        }
                        else {
                            if (this.zombie[z].mesh.rotation.y < direction - 2 * Math.PI + 0.2) {
                                this.zombie[z].mesh.rotation.y = direction;
                            }
                            else {
                                needMove = 0;
                                this.zombie[z].mesh.rotation.y -= 0.2;
                                if (this.zombie[z].mesh.rotation.y <= -Math.PI) {
                                    this.zombie[z].mesh.rotation.y += 2 * Math.PI;
                                }
                            }
                        }
                    }
                    else {
                        if (this.zombie[z].mesh.rotation.y > direction) {
                            if (this.zombie[z].mesh.rotation.y < direction + 0.2) {
                                this.zombie[z].mesh.rotation.y = direction;
                            }
                            else {
                                needMove = 0;
                                this.zombie[z].mesh.rotation.y -= 0.2;
                            }
                        }
                        else {
                            if (this.zombie[z].mesh.rotation.y > direction - 0.2) {
                                this.zombie[z].mesh.rotation.y = direction;
                            }
                            else {
                                needMove = 0;
                                this.zombie[z].mesh.rotation.y += 0.2;
                            }
                        }
                    }
                }
                if (needMove == 1) {
                    var dis = Math.sqrt(dx * dx + dz * dz);
                    var hopeTo = new THREE.Vector3();
                    var stop = 0;
                    if (dis < this.zombie[z].vel) {
                        hopeTo.add(this.zombie[z].mesh.position, new THREE.Vector3(dx, 0, dz));
                        var hx = hopeTo.x - this.player.position.x;
                        var hz = hopeTo.z - this.player.position.z;
                        if (hx * hx + hz * hz < 100) {
                            stop = 1;
                        }
                        for (var p = 0; p < this.zombie.length; p++) {
                            if (p == z) {
                                continue;
                            }
                            var hx = hopeTo.x - this.zombie[p].mesh.position.x;
                            var hz = hopeTo.z - this.zombie[p].mesh.position.z;
                            if (hx * hx + hz * hz < 100) {
                                stop = 1;
                                break;
                            }
                        }

                        if (stop == 0) {
                            this.zombie[z].mesh.position.x = hopeTo.x;
                            this.zombie[z].mesh.position.z = hopeTo.z;
                            this.zombie[z].at = this.zombie[z].queue[this.zombie[z].at].p;
                        }
                    }
                    else {
                        hopeTo.add(this.zombie[z].mesh.position, new THREE.Vector3(
                            this.zombie[z].vel * dx / Math.sqrt(dx * dx + dz * dz),
                            0,
                            this.zombie[z].vel * dz / Math.sqrt(dx * dx + dz * dz)));
                        var hx = hopeTo.x - this.player.position.x;
                        var hz = hopeTo.z - this.player.position.z;
                        if (hx * hx + hz * hz < 100) {
                            stop = 1;
                        }
                        for (var p = 0; p < this.zombie.length; p++) {
                            if (p == z) {
                                continue;
                            }
                            var hx = hopeTo.x - this.zombie[p].mesh.position.x;
                            var hz = hopeTo.z - this.zombie[p].mesh.position.z;
                            if (hx * hx + hz * hz < 100) {
                                stop = 1;
                                break;
                            }
                        }
                        if (stop == 0) {
                            this.zombie[z].mesh.position.x = hopeTo.x;
                            this.zombie[z].mesh.position.z = hopeTo.z;
                        }                        
                    }
                    if ((moveToz - this.zombie[z].mesh.position.z) * (moveToz - this.zombie[z].mesh.position.z) + (moveTox - this.zombie[z].mesh.position.x) * (moveTox - this.zombie[z].mesh.position.x) < 1e-6) {
                        this.zombie[z].at = this.zombie[z].queue[this.zombie[z].at].p;
                    }
                }
            }
        }

        // Update all the bullets, move backwards through array 
        // to avoid problems when removing bullets
        for (var i = this.bullets.length - 1; i >= 0; --i) {
            // Remove bullets that are too old
            // TODO: also remove if bullet has collided with something
            if (--this.bullets[i].lifetime <= 0) {
                this.scene.remove(this.bullets[i].mesh);
                this.bullets.splice(i, 1);
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
        if (this.player.position.y < 16) {
            this.player.position.y = 16;
        }

        TWEEN.update();
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
function handleCollisions(game, input) {
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
                        for (i = 0.1; i <= game.player.position.x - game.oldplayer.x; i += 0.1) {
                            ray = new THREE.Ray(new THREE.Vector3(game.oldplayer.x + i, game.oldplayer.y, game.oldplayer.z), directionVector.clone().normalize());
                            collisionResults = ray.intersectObjects(game.objects);
                            if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                break;
                            }
                        }
                        i -= 0.1;
                    }
                    if (game.player.position.x - game.oldplayer.x < 0) {
                        for (i = -0.1; i >= game.player.position.x - game.oldplayer.x; i -= 0.1) {
                            ray = new THREE.Ray(new THREE.Vector3(game.oldplayer.x + i, game.oldplayer.y, game.oldplayer.z), directionVector.clone().normalize());
                            collisionResults = ray.intersectObjects(game.objects);
                            if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                break;
                            }
                        }
                        i += 0.1;
                    }

                    if (game.player.position.y - game.oldplayer.y > 0) {
                        for (j = 0.1; j <= game.player.position.y - game.oldplayer.y; j += 0.1) {
                            ray = new THREE.Ray(new THREE.Vector3(game.oldplayer.x + i, game.oldplayer.y + j, game.oldplayer.z), directionVector.clone().normalize());
                            collisionResults = ray.intersectObjects(game.objects);
                            if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                break;
                            }
                        }
                        j -= 0.1;
                    }
                    if (game.player.position.y - game.oldplayer.y < 0) {
                        for (j = -0.1; j >= game.player.position.y - game.oldplayer.y; j -= 0.1) {
                            ray = new THREE.Ray(new THREE.Vector3(game.oldplayer.x + i, game.oldplayer.y + j, game.oldplayer.z), directionVector.clone().normalize());
                            collisionResults = ray.intersectObjects(game.objects);
                            if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                break;
                            }
                        }
                        j += 0.1;
                    }

                    if (game.player.position.z - game.oldplayer.z > 0) {
                        for (k = 0.1; k <= game.player.position.z - game.oldplayer.z; k += 0.1) {
                            ray = new THREE.Ray(new THREE.Vector3(game.oldplayer.x + i, game.oldplayer.y + j, game.oldplayer.z + k), directionVector.clone().normalize());
                            collisionResults = ray.intersectObjects(game.objects);
                            if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                break;
                            }
                        }
                        k -= 0.1;
                    }
                    if (game.player.position.z - game.oldplayer.z < 0) {
                        for (k = -0.1; k >= game.player.position.z - game.oldplayer.z; k -= 0.1) {
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

