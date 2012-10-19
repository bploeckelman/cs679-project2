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
    this.Element = function (sz, sx, p) {
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
        game.player.canBeHurt = true;
        game.player.health = 100;
        game.player.ammo = 50;
        game.player.inventory = [];
        game.scene.add(game.player);

        var zombieGeom = new THREE.CubeGeometry(8, 20, 4);
        var texture = new THREE.ImageUtils.loadTexture("images/crate.gif");
        var zombieMat = new THREE.MeshLambertMaterial({ map: texture });

        for (var z = 0; z < game.level.zombiePos.length; z++) {
            Azombie = {
                mesh: new THREE.Mesh(zombieGeom, zombieMat),
                vel: 0.5,
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
    // ------------------------------------------------------------------------
    this.update = function (input) {
        this.level.update();

        updateMovement(this, input);
        updateBullets(this, input);
        updateZombies(this);
        handleCollisions(this, input);
        updatePlayer(this, input);        

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
// Update the player 
// ----------------------------------------------------------------------------
var HURT_DISTANCE = 16,
    HURT_TIMEOUT = 1000,
    HURT_AMOUNT = 5,
    ZOMBIE_DISTANCE = 10;
function updatePlayer (game, input) {
    // Check for zombie touching
    for(var i = 0; i < game.zombie.length; ++i) {
        var dist = game.player.position.distanceTo(game.zombie[i].mesh.position);
        // Hurt the player if a zombie is close enough
        // and the player hasn't taken damage less than HURT_TIMEOUT ms ago
        if (dist < HURT_DISTANCE && game.player.canBeHurt) {
            game.player.health -= HURT_AMOUNT;
            // TODO: handle player death when health <= 0
            if (game.player.health < 0)
                game.player.health = 0;
            game.player.canBeHurt = false;
            console.log("ouch! health = " + game.player.health);


            setTimeout(function () {
                game.player.canBeHurt = true;
            }, HURT_TIMEOUT);
                    
            break;
        }
    }
    
    // HACK: make the player a little bit taller
    if (game.player.position.y < 16) {
        game.player.position.y = 16;
    }

    // Update the player's light
    game.lights[0].position.set(
        game.player.position.x,
        game.player.position.y + 32,
        game.player.position.z);
}


// ----------------------------------------------------------------------------
// Update based on player movement: camera, player position/jumping, view ray
// ----------------------------------------------------------------------------
function updateMovement (game, input) {
    var triggerAD = input.trigger.A - input.trigger.D,
        triggerWS = input.trigger.W - input.trigger.S,
        triggerQE = input.trigger.Q - input.trigger.E,
        jumpVelocity = 4;

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
            input.v = jumpVelocity;
            input.trigger.Jump = 0;
            input.hold = 0;
            game.player.position.y += input.v;
            input.v -= 0.4;
        }
    } else {
        game.player.position.y += input.v;
        input.v -= 0.3;
    }

    // Update player position
    var xzNorm = Math.sqrt(input.f.x * input.f.x + input.f.z * input.f.z);
    game.player.position.add(
        game.player.position,
        new THREE.Vector3(
            triggerWS * input.f.x + triggerAD * input.f.z / xzNorm,
            triggerQE * input.f.y * 10, //previouly, triggerWS * input.f.y,
            triggerWS * input.f.z - triggerAD * input.f.x / xzNorm
        )
    );

    // Update camera position/lookat 
    game.camera.position = game.player.position;
    var look = new THREE.Vector3();
    look.add(game.camera.position, input.f);
    game.camera.lookAt(look);

    // Update the view ray (center of canvas into screen)
    // NOTE: the near/far range is set short for doors
    //   another way to handle game would be to check the .distance
    //   property of the intersects[0].object when using ray for 
    //   object intersection testing.
    var rayVec = new THREE.Vector3(0, 0, 1);
    game.projector.unprojectVector(rayVec, game.camera);
    input.viewRay = new THREE.Ray(
        game.player.position,                             // origin
        rayVec.subSelf(game.player.position).normalize(), // direction
        0, 64                                             // near, far
    );
}


// ----------------------------------------------------------------------------
// Update all the Game's Bullets 
// TODO: add collision code for bullets
// TODO: limit amount of ammunition!
// ----------------------------------------------------------------------------
function updateBullets (game, input) {
    var refireTime = 0.2,
        bullet,
        bulletVel = 4,
        bulletGeom = new THREE.SphereGeometry(0.2, 10, 10),
        bulletMat = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            specular: 0xffffff,
            shininess: 100
        });

    // This allows the player to fire as fast as they can click
    if (input.click === 0) {
        game.bulletDelay = refireTime;
    }

    if (input.click === 1) {
        // Toggle doors if there are any directly in line of sight 
        var intersects = input.viewRay.intersectObjects(game.objects),
            selected = null;
        if (intersects.length > 0) {
            selected = intersects[0].object;
            if (selected.name === "door") {
                game.level.toggleDoor(selected.doorIndex);
            }
        }

        // Slow down firing rate if player is holding the mouse button down
        game.bulletDelay += game.clock.getDelta();
        if (game.bulletDelay > refireTime) {
            game.bulletDelay = 0;

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
            game.bullets.push(bullet);
            game.scene.add(bullet.mesh);
        }
    }

    // Update all the bullets, move backwards through array 
    // to avoid problems when removing bullets
    for (var i = game.bullets.length - 1; i >= 0; --i) {
        // Remove bullets that are too old
        // TODO: also remove if bullet has collided with something
        if (--game.bullets[i].lifetime <= 0) {
            game.scene.remove(game.bullets[i].mesh);
            game.bullets.splice(i, 1);
        } else { // Update the bullet's position based on its velocity
            game.bullets[i].pos.addSelf(game.bullets[i].vel);
            game.bullets[i].mesh.position = game.bullets[i].pos;
        }
    }
}


// ----------------------------------------------------------------------------
// Update all the Game's Zombies
// ----------------------------------------------------------------------------
function updateZombies(game) {
    if (game.searchDelay >= 1) {
        game.searchDelay = 0;
        var visit = new Array(NUM_CELLS.y);
        for (var i = 0; i < NUM_CELLS.y; i++) {
            visit[i] = new Array(NUM_CELLS.x);
        }
        for (var z = 0; z < game.zombie.length; z++) {
            var oz = Math.floor(Math.floor(game.zombie[z].mesh.position.z) / CELL_SIZE + 0.5);
            var ox = Math.floor(Math.floor(game.zombie[z].mesh.position.x) / CELL_SIZE + 0.5);
            var sz = Math.floor(Math.floor(game.player.position.z) / CELL_SIZE + 0.5);
            var sx = Math.floor(Math.floor(game.player.position.x) / CELL_SIZE + 0.5);

            if (game.level.grid[sz][sx].type == CELL_TYPES.door && game.level.state[sz][sx] == 0) {
                continue;
            }

            game.zombie[z].queue = [];
            for (var i = 0; i < NUM_CELLS.y; i++) {
                for (var j = 0; j < NUM_CELLS.x; j++) {
                    visit[i][j] = 0;
                }
            }


            game.zombie[z].queue.push(new game.Element(sz, sx, 0));
            var pointing = 0;
            var found = 0;
            game.zombie[z].at = -1;
            while (1) {
                for (var i = -1; i <= 1; i++) {
                    for (var j = -1 + Math.abs(i) ; j <= 1 - Math.abs(i) ; j++) {
                        if (sz + i == oz && sx + j == ox) {
                            game.zombie[z].queue.push(new game.Element(sz + i, sx + j, pointing));
                            game.zombie[z].at = game.zombie[z].queue.length - 1;
                            found = 1;
                            break;
                        }
                        else {
                            if (game.level.grid[sz + i][sx + j].type != CELL_TYPES.wall &&
                                visit[sz + i][sx + j] == 0 &&
                                (game.level.grid[sz + i][sx + j].type != CELL_TYPES.door || game.level.state[sz + i][sx + j] == 1)
                                ) {
                                visit[sz + i][sx + j] = 1;
                                game.zombie[z].queue.push(new game.Element(sz + i, sx + j, pointing));
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
                if (pointing == game.zombie[z].queue.length) {
                    break;
                }
                sz = game.zombie[z].queue[pointing].sz;
                sx = game.zombie[z].queue[pointing].sx;
            }

            if (found == 1) {
                var start = game.zombie[z].at;
                while (game.level.grid[game.zombie[z].queue[start].sz][game.zombie[z].queue[start].sx].type == CELL_TYPES.door) {
                    if (start == 0) {
                        break;
                    }
                    start = game.zombie[z].queue[start].p;
                }
                if (start != 0) {
                    var link = game.zombie[z].queue[start].p;
                    while (1) {
                        while (game.level.grid[game.zombie[z].queue[link].sz][game.zombie[z].queue[link].sx].type != CELL_TYPES.door) {
                            game.zombie[z].queue[start].p = link;
                            if (link == 0) {
                                break;
                            }
                            link = game.zombie[z].queue[link].p;
                        }

                        start = game.zombie[z].queue[link].p;
                        if (start == 0) {
                            break;
                        }
                        while (game.level.grid[game.zombie[z].queue[start].sz][game.zombie[z].queue[start].sx].type == CELL_TYPES.door) {
                            if (start == 0) {
                                break;
                            }
                            start = game.zombie[z].queue[start].p;
                        }
                        link = game.zombie[z].queue[start].p;
                    }
                }
            }
        }
    }
    else {
        game.searchDelay += game.clock.getDelta();
    }

    for (var z = 0; z < game.zombie.length; z++) {
        if (game.zombie[z].at == -1) {
            continue;
        }
        if (game.zombie[z].queue[game.zombie[z].at].p == 0) {
            moveToz = game.player.position.z;
            moveTox = game.player.position.x;
        }
        else {
            var moveToz = game.zombie[z].queue[game.zombie[z].queue[game.zombie[z].at].p].sz * CELL_SIZE;
            var moveTox = game.zombie[z].queue[game.zombie[z].queue[game.zombie[z].at].p].sx * CELL_SIZE;
        }
        var dz = moveToz - game.zombie[z].mesh.position.z;
        var dx = moveTox - game.zombie[z].mesh.position.x;
        if (dx * dx + dz * dz > 1e-6) {
            var direction = Math.atan2(dx, dz);
            var needMove = 1;
            if (Math.abs(game.zombie[z].mesh.rotation.y - direction) > 1e-6) {
                if (Math.abs(game.zombie[z].mesh.rotation.y - direction) > Math.PI) {
                    if (game.zombie[z].mesh.rotation.y > direction) {
                        if (game.zombie[z].mesh.rotation.y > direction + 2 * Math.PI - 0.2) {
                            game.zombie[z].mesh.rotation.y = direction;
                        }
                        else {
                            needMove = 0;
                            game.zombie[z].mesh.rotation.y += 0.2;
                            if (game.zombie[z].mesh.rotation.y > Math.PI) {
                                game.zombie[z].mesh.rotation.y -= 2 * Math.PI;
                            }
                        }
                    }
                    else {
                        if (game.zombie[z].mesh.rotation.y < direction - 2 * Math.PI + 0.2) {
                            game.zombie[z].mesh.rotation.y = direction;
                        }
                        else {
                            needMove = 0;
                            game.zombie[z].mesh.rotation.y -= 0.2;
                            if (game.zombie[z].mesh.rotation.y <= -Math.PI) {
                                game.zombie[z].mesh.rotation.y += 2 * Math.PI;
                            }
                        }
                    }
                }
                else {
                    if (game.zombie[z].mesh.rotation.y > direction) {
                        if (game.zombie[z].mesh.rotation.y < direction + 0.2) {
                            game.zombie[z].mesh.rotation.y = direction;
                        }
                        else {
                            needMove = 0;
                            game.zombie[z].mesh.rotation.y -= 0.2;
                        }
                    }
                    else {
                        if (game.zombie[z].mesh.rotation.y > direction - 0.2) {
                            game.zombie[z].mesh.rotation.y = direction;
                        }
                        else {
                            needMove = 0;
                            game.zombie[z].mesh.rotation.y += 0.2;
                        }
                    }
                }
            }
            if (needMove == 1) {
                var dis = Math.sqrt(dx * dx + dz * dz);
                var hopeTo = new THREE.Vector3();
                var stop = 0;
                if (dis < game.zombie[z].vel) {
                    hopeTo.add(game.zombie[z].mesh.position, new THREE.Vector3(dx, 0, dz));
                    var hx = hopeTo.x - game.player.position.x;
                    var hz = hopeTo.z - game.player.position.z;
                    if (hx * hx + hz * hz < HURT_DISTANCE) {
                        stop = 1;
                    }
                    for (var p = 0; p < game.zombie.length; p++) {
                        if (p == z) {
                            continue;
                        }
                        var hx = hopeTo.x - game.zombie[p].mesh.position.x;
                        var hz = hopeTo.z - game.zombie[p].mesh.position.z;
                        if (hx * hx + hz * hz < ZOMBIE_DISTANCE) {
                            stop = 1;
                            break;
                        }
                    }

                    if (stop == 0) {
                        game.zombie[z].mesh.position.x = hopeTo.x;
                        game.zombie[z].mesh.position.z = hopeTo.z;
                        game.zombie[z].at = game.zombie[z].queue[game.zombie[z].at].p;
                    }
                }
                else {
                    hopeTo.add(game.zombie[z].mesh.position, new THREE.Vector3(
                        game.zombie[z].vel * dx / Math.sqrt(dx * dx + dz * dz),
                        0,
                        game.zombie[z].vel * dz / Math.sqrt(dx * dx + dz * dz)));
                    var hx = hopeTo.x - game.player.position.x;
                    var hz = hopeTo.z - game.player.position.z;
                    if (hx * hx + hz * hz < HURT_DISTANCE) {
                        stop = 1;
                    }
                    for (var p = 0; p < game.zombie.length; p++) {
                        if (p == z) {
                            continue;
                        }
                        var hx = hopeTo.x - game.zombie[p].mesh.position.x;
                        var hz = hopeTo.z - game.zombie[p].mesh.position.z;
                        if (hx * hx + hz * hz < ZOMBIE_DISTANCE) {
                            stop = 1;
                            break;
                        }
                    }
                    if (stop == 0) {
                        game.zombie[z].mesh.position.x = hopeTo.x;
                        game.zombie[z].mesh.position.z = hopeTo.z;
                    }
                }
                if ((moveToz - game.zombie[z].mesh.position.z) * (moveToz - game.zombie[z].mesh.position.z) + (moveTox - game.zombie[z].mesh.position.x) * (moveTox - game.zombie[z].mesh.position.x) < 1e-6) {
                    game.zombie[z].at = game.zombie[z].queue[game.zombie[z].at].p;
                }
            }
        }
    }
} // end function updateZombies()


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

