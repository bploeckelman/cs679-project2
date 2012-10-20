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
    this.zomobjects = [];
    this.lights = [];
    this.bullets = [];
    this.bulletDelay = 0;
    this.level = null;
    this.player = null;
    this.zombie = [];
    this.oldplayer = new THREE.Vector3();
    this.searchDelay = 1;
    this.firstOver = 0;
    this.needToClose = -1;
    this.timer = 60;
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
            new THREE.CubeGeometry(9, 17, 3.5),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        );
        game.player.position.set(
            game.level.startPos.x, 16, game.level.startPos.y);
        game.player.canBeHurt = true;
        game.player.health = 100;
        game.player.armor = 100;
        game.player.ammo = 50;
        game.player.money = 10000;
        game.player.inventory = [];
        game.scene.add(game.player);

        var zombieGeom = new THREE.CubeGeometry(9, 17, 3.5);
        var texture = new THREE.ImageUtils.loadTexture("images/transparent.png");
        zombieMat = new THREE.MeshLambertMaterial({ map: texture });
        zombieMat.transparent = true;

        var loader = new THREE.JSONLoader(true);
        var tempCounter = 0;

        for (var z = 0; z < game.level.zombiePos.length; z++) {
            Azombie = {
                x: game.level.zombiePos[z].x,
                y: 0,
                z: game.level.zombiePos[z].y,
                mesh1: new THREE.Mesh(zombieGeom, zombieMat),
                vel: 0.1,
                health: 10,
                queue: [],
                at: 0
            };
            Azombie.mesh1.position = new THREE.Vector3(game.level.zombiePos[z].x, 10, game.level.zombiePos[z].y);
            Azombie.mesh1.name = "zombie";
            game.zombie.push(Azombie);
            game.zomobjects.push(Azombie.mesh1);
            game.scene.add(Azombie.mesh1);
            Azombie.mesh1.index = z;


            loader.load("models/zombie.js", function (geometry) {
                game.zombie[tempCounter].mesh2 = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial);
                game.zombie[tempCounter].mesh2.position.set(game.zombie[tempCounter].x, game.zombie[tempCounter].y, game.zombie[tempCounter].z);
                game.zombie[tempCounter].mesh2.scale.set(12.5, 10, 12.5);
                game.zombie[tempCounter].mesh2.name = "zombie";
                game.scene.add(game.zombie[tempCounter].mesh2);
                tempCounter++;
            });
        };

        // Setup camera
        game.camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR);
        game.camera.position.set(game.player.position.x, game.player.position.y, game.player.position.z);
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

    this.ending = function () {
        var mainCanvas = document.getElementById("canvas");
        // Create and position the information, then add it to the document
        endingInfo = document.createElement("canvas");
        endingInfo.id = "endinginfo";
        endingInfo.style.position = "absolute";
        endingInfo.width = canvas.width;
        endingInfo.height = canvas.height;
        // TODO: have to handle window resizing
        endingInfo.style.bottom = 0;
        endingInfo.style.right = 0;
        document.getElementById("container").appendChild(endingInfo);

        // Save the 2d context for this canvas
        Context = endingInfo.getContext("2d");

        // Clear the map
        Context.save();
        Context.setTransform(1, 0, 0, 1, 0, 0);
        Context.clearRect(0, 0, endingInfo.width, endingInfo.height);
        Context.restore();
        
        Context.font = '60px Arial';
        Context.textBaseline = 'middle';
        Context.textAlign = 'center';
        if (this.zombie.length == 0) {
            Context.fillStyle = "#00ff00";
            Context.fillText("All zombies are killed!", endingInfo.width / 2, endingInfo.height / 2);
        }
        else {
            Context.fillStyle = "#ff0000";
            Context.fillText("You lose the game!", endingInfo.width / 2, endingInfo.height / 2);
        }
    };


    // Update everything in the scene
    // ------------------------------------------------------------------------
    this.update = function (input) {
        this.timer -= this.clock.getDelta();
        if (this.timer < 0) {
            this.timer = 0;
        }
        if (this.zombie.length == 0 || this.player.health == 0 || this.timer == 0) {
            if (this.firstOver == 0) {
                this.firstOver = 1;
            }
            else {
                if (this.firstOver == 1) {
                    this.ending();
                    this.firstOver = 2;
                }
                return;
            }
        }
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
var HURT_DISTANCE = 18,
    HURT_TIMEOUT = 1000,
    HURT_AMOUNT = 5,
    ZOMBIE_DISTANCE = 18;
function updatePlayer(game, input) {
    // Check for zombie touching
    for (var i = 0; i < game.zombie.length; ++i) {
        var dist = game.player.position.distanceTo(game.zombie[i].mesh1.position);
        // Hurt the player if a zombie is close enough
        // and the player hasn't taken damage less than HURT_TIMEOUT ms ago
        if (dist < HURT_DISTANCE && game.player.canBeHurt) {
            if (game.player.armor > 0) {
                game.player.armor -= HURT_AMOUNT;
                // TODO: handle player death when health <= 0
                if (game.player.armor < 0) {
                    game.player.health += game.player.armor;
                    game.player.armor = 0;
                }
                game.player.canBeHurt = false;
            }
            else {
                game.player.health -= HURT_AMOUNT;
                // TODO: handle player death when health <= 0
                if (game.player.health < 0)
                    game.player.health = 0;
                game.player.canBeHurt = false;
            }
            console.log("ouch! Armor = " + game.player.armor + ", " + "health = " + game.player.health);

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
function updateMovement(game, input) {
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
function updateBullets(game, input) {
    var refireTime = 0.2,
        bullet,
        bulletVel = 10,
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

    if (input.click === 1 && game.player.ammo >= 1) {
        if (game.bulletDelay < refireTime) {
            game.bulletDelay += game.clock.getDelta();
        }
        else {
            // Toggle doors if there are any directly in line of sight 
            var intersects1 = input.viewRay.intersectObjects(game.objects),
                intersects2 = input.viewRay.intersectObjects(game.zomobjects),
                selected = null;
            if (intersects1.length > 0 && intersects2.length == 0) {
                selected = null;// intersects1[0].object;                
            }

            if (intersects1.length == 0 && intersects2.length > 0) {
                selected = intersects2[0].object;
            }

            if (intersects1.length > 0 && intersects2.length > 0) {
                if (intersects1[0].distance > intersects2[0].distance) {
                    selected = intersects2[0].object;
                }
                else {
                    selected = null;// intersects1[0].object;
                }
            }
               
            if (selected != null) {
//                if (selected.name === "door") {
//                    game.level.toggleDoor(selected.doorIndex);
//                }
//                else {
                if (selected.name === "zombie") {
                    game.zombie[selected.index].health -= 5;
                    if (game.zombie[selected.index].health <= 0) {
                        game.player.money += 1000;
                        game.scene.remove(game.zombie[selected.index].mesh1);
                        game.scene.remove(game.zombie[selected.index].mesh2);
                        game.zomobjects.splice(selected.index, 1);
                        game.zombie.splice(selected.index, 1);
                        for (var z = selected.index; z < game.zombie.length; z++) {
                            game.zombie[z].mesh1.index -= 1;
                        }
                    }
                }
                //}
            }

            // Slow down firing rate if player is holding the mouse button down
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

            --game.player.ammo;            
        }
    }

    function checkZombie() {
        var dz = game.level.geometry.doors[game.needToClose].centerz / CELL_SIZE;
        var dx = game.level.geometry.doors[game.needToClose].centerx / CELL_SIZE;

        for (var z = 0; z < game.zombie.length; z++) {
            var sz = Math.floor(Math.floor(game.zombie[z].mesh1.position.z) / CELL_SIZE + 0.5);
            var sx = Math.floor(Math.floor(game.zombie[z].mesh2.position.x) / CELL_SIZE + 0.5);
            if (sz == dz && sx == dx) {
                return false;
            }
        }
            
        return true;
    }


    if (input.trigger.F === 1) {
        var sz = Math.floor(Math.floor(game.player.position.z) / CELL_SIZE + 0.5);
        var sx = Math.floor(Math.floor(game.player.position.x) / CELL_SIZE + 0.5);
        if (game.level.state[sz][sx] != -1) {
            if (game.level.state[sz][sx] < 0) {
                game.needToClose = -2 - game.level.state[sz][sx];
            }
            else {
                game.level.toggleDoor(game.level.state[sz][sx]);
                input.trigger.F = 0;
            }
        }
        else {
            if (game.needToClose != -1 && checkZombie()) {
                game.level.toggleDoor(game.needToClose);
                game.needToClose = -1;
                input.trigger.F = 0;
            }
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
            var oz = Math.floor(Math.floor(game.zombie[z].mesh1.position.z) / CELL_SIZE + 0.5);
            var ox = Math.floor(Math.floor(game.zombie[z].mesh1.position.x) / CELL_SIZE + 0.5);
            var sz = Math.floor(Math.floor(game.player.position.z) / CELL_SIZE + 0.5);
            var sx = Math.floor(Math.floor(game.player.position.x) / CELL_SIZE + 0.5);

            if (game.level.grid[sz][sx].type == CELL_TYPES.door && game.level.state[sz][sx] >= 0) {
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
                                (game.level.grid[sz + i][sx + j].type != CELL_TYPES.door || game.level.state[sz + i][sx + j] <=-2)
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
        var dz = moveToz - game.zombie[z].mesh1.position.z;
        var dx = moveTox - game.zombie[z].mesh1.position.x;
        if (dx * dx + dz * dz > 1e-6) {
            var direction = Math.atan2(dx, dz);
            var needMove = 1;
            if (Math.abs(game.zombie[z].mesh1.rotation.y - direction) > 1e-6) {
                if (Math.abs(game.zombie[z].mesh1.rotation.y - direction) > Math.PI) {
                    if (game.zombie[z].mesh1.rotation.y > direction) {
                        if (game.zombie[z].mesh1.rotation.y > direction + 2 * Math.PI - 0.2) {
                            game.zombie[z].mesh1.rotation.y = direction;
                            game.zombie[z].mesh2.rotation.y = direction;
                        }
                        else {
                            needMove = 0;
                            game.zombie[z].mesh1.rotation.y += 0.2;
                            if (game.zombie[z].mesh1.rotation.y > Math.PI) {
                                game.zombie[z].mesh1.rotation.y -= 2 * Math.PI;
                                game.zombie[z].mesh2.rotation.y -= 2 * Math.PI;
                            }
                        }
                    }
                    else {
                        if (game.zombie[z].mesh1.rotation.y < direction - 2 * Math.PI + 0.2) {
                            game.zombie[z].mesh1.rotation.y = direction;
                            game.zombie[z].mesh2.rotation.y = direction;
                        }
                        else {
                            needMove = 0;
                            game.zombie[z].mesh1.rotation.y -= 0.2;
                            if (game.zombie[z].mesh1.rotation.y <= -Math.PI) {
                                game.zombie[z].mesh1.rotation.y += 2 * Math.PI;
                                game.zombie[z].mesh2.rotation.y += 2 * Math.PI;
                            }
                        }
                    }
                }
                else {
                    if (game.zombie[z].mesh1.rotation.y > direction) {
                        if (game.zombie[z].mesh1.rotation.y < direction + 0.2) {
                            game.zombie[z].mesh1.rotation.y = direction;
                            game.zombie[z].mesh2.rotation.y = direction;
                        }
                        else {
                            needMove = 0;
                            game.zombie[z].mesh1.rotation.y -= 0.2;
                            game.zombie[z].mesh2.rotation.y -= 0.2;                        }
                    }
                    else {
                        if (game.zombie[z].mesh1.rotation.y > direction - 0.2) {
                            game.zombie[z].mesh1.rotation.y = direction;
                            game.zombie[z].mesh2.rotation.y = direction;                        }
                        else {
                            needMove = 0;
                            game.zombie[z].mesh1.rotation.y += 0.2;
                            game.zombie[z].mesh2.rotation.y += 0.2;
                        }
                    }
                }
            }
            if (needMove == 1) {
                var dis = Math.sqrt(dx * dx + dz * dz);
                var hopeTo = new THREE.Vector3();
                var stop = 0;
                if (dis < game.zombie[z].vel) {
                    hopeTo.add(game.zombie[z].mesh1.position, new THREE.Vector3(dx, 0, dz));
                    var hx = hopeTo.x - game.player.position.x;
                    var hz = hopeTo.z - game.player.position.z;
                    if (hx * hx + hz * hz < HURT_DISTANCE  * HURT_DISTANCE / 4) {
                        stop = 1;
                    }
                    for (var p = 0; p < game.zombie.length; p++) {
                        if (p == z) {
                            continue;
                        }
                        var hx = hopeTo.x - game.zombie[p].mesh1.position.x;
                        var hz = hopeTo.z - game.zombie[p].mesh1.position.z;
                        if (hx * hx + hz * hz < ZOMBIE_DISTANCE * ZOMBIE_DISTANCE) {
                            stop = 1;
                            break;
                        }
                    }

                    if (stop == 0) {
                        game.zombie[z].mesh1.position.x = hopeTo.x;
                        game.zombie[z].mesh1.position.z = hopeTo.z;
                        game.zombie[z].mesh2.position.x = hopeTo.x;
                        game.zombie[z].mesh2.position.z = hopeTo.z;
                        game.zombie[z].at = game.zombie[z].queue[game.zombie[z].at].p;
                    }
                }
                else {
                    hopeTo.add(game.zombie[z].mesh1.position, new THREE.Vector3(
                        game.zombie[z].vel * dx / Math.sqrt(dx * dx + dz * dz),
                        0,
                        game.zombie[z].vel * dz / Math.sqrt(dx * dx + dz * dz)));
                    var hx = hopeTo.x - game.player.position.x;
                    var hz = hopeTo.z - game.player.position.z;
                    if (hx * hx + hz * hz < HURT_DISTANCE * HURT_DISTANCE / 4) {
                        stop = 1;
                    }
                    for (var p = 0; p < game.zombie.length; p++) {
                        if (p == z) {
                            continue;
                        }
                        var hx = hopeTo.x - game.zombie[p].mesh1.position.x;
                        var hz = hopeTo.z - game.zombie[p].mesh1.position.z;
                        if (hx * hx + hz * hz < ZOMBIE_DISTANCE * ZOMBIE_DISTANCE) {
                            stop = 1;
                            break;
                        }
                    }
                    if (stop == 0) {
                        game.zombie[z].mesh1.position.x = hopeTo.x;
                        game.zombie[z].mesh1.position.z = hopeTo.z;
                        game.zombie[z].mesh2.position.x = hopeTo.x;
                        game.zombie[z].mesh2.position.z = hopeTo.z;
                    }
                }
                if ((moveToz - game.zombie[z].mesh1.position.z) * (moveToz - game.zombie[z].mesh1.position.z) + (moveTox - game.zombie[z].mesh1.position.x) * (moveTox - game.zombie[z].mesh1.position.x) < 1e-6) {
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
                    game.camera.position.set(game.player.position.x, game.player.position.y, game.player.position.z);
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

