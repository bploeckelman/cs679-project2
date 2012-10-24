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
    this.clock2 = new THREE.Clock();
    this.clock3 = new THREE.Clock();
    this.clock4 = new THREE.Clock();
    this.clock5 = new THREE.Clock();
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
    this.monster = [];
    this.oldplayer = new THREE.Vector3();
    this.searchDelay = 0;
    this.firstOver = 0;
    this.needToClose = 0;
    this.timer = 0;
    this.interval = -1;
    this.TNTtime = 0;
    this.EXPLOSION_TIME = 0;
    this.HURT_AMOUNT = 0;
    this.monsterNumber = 0;
    this.TNTRoom = 0;
    this.Bomb = null;
    this.newMission = 2;
    this.Mission = 0;
    this.maxMission = 8;
    this.preammo = 0;
    this.preTNT = 0;
    this.premoney = 9500;

    this.mainCanvas = document.getElementById("canvas");

    // Create and position the information, then add it to the document
    this.endingInfo    = document.createElement("canvas");
    this.endingInfo.id = "endinginfo";
    this.endingInfo.width  = canvas.width;
    this.endingInfo.height = canvas.height;
    this.endingInfo.style.position = "absolute";
    this.endingInfo.style.bottom   = 0;
    this.endingInfo.style.right    = 0;
    document.getElementById("container").appendChild(this.endingInfo);

    // Save the 2d context for this canvas
    this.Context = this.endingInfo.getContext("2d");

    // Create and position the map canvas, then add it to the document
    this.mapCanvas    = document.createElement("canvas");
    this.mapCanvas.id = "minimap";
    this.mapCanvas.width  = MAP_CELL_SIZE * NUM_CELLS.x;
    this.mapCanvas.height = MAP_CELL_SIZE * NUM_CELLS.y;
    this.mapCanvas.style.position = "absolute";
    this.mapCanvas.style.bottom   = 0;
    this.mapCanvas.style.right    = 0;
    this.mapCanvas.style.top   = "20px";
    this.mapCanvas.style.right = "20px";
    document.getElementById("container").appendChild(this.mapCanvas);

    // Create and position the information, then add it to the document
    playerInfo    = document.createElement("canvas");
    playerInfo.id = "info";
    playerInfo.width  = canvas.width * 0.98;
    playerInfo.height = canvas.height * 0.22;
    playerInfo.style.position = "absolute";
    playerInfo.style.bottom   = 0;
    playerInfo.style.right    = 0;
    document.getElementById("container").appendChild(playerInfo);

    // Create and position the information, then add it to the document
    missionInfo    = document.createElement("canvas");
    missionInfo.id = "mission";
    missionInfo.width  = canvas.width  * 1;
    missionInfo.height = canvas.height * 2.7;
    missionInfo.style.position = "absolute";
    missionInfo.style.bottom   = 0;
    missionInfo.style.right    = 0;
    document.getElementById("container").appendChild(missionInfo);

    // Create and position the 'pain' canvas: flash red on screen on player injury
    this.painCanvas    = document.createElement("canvas");
    this.painCanvas.id = "pain";
    this.painCanvas.width  = canvas.width;
    this.painCanvas.height = canvas.height;
    this.painCanvas.style.position = "absolute";
    this.painCanvas.style.bottom   = 0;
    this.painCanvas.style.right    = 0;
    this.painCanvas.alpha = 0.0;
    document.getElementById("container").appendChild(this.painCanvas);

    this.Element = {
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
        NEAR = .01,
        FAR = 1000;

    // ------------------------------------------------------------------------
    // Game Methods -----------------------------------------------------------
    // ------------------------------------------------------------------------
    this.init = function () {
        console.log("Game initializing...");
        if (this.newMission === 2) {
            this.Mission += 1;
        }
        this.newMission = 0;
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
        this.monster = [];
        this.monsterNumber = this.Mission * 3;
        this.searchDelay = 1;
        this.firstOver = 0;
        this.needToClose = -1;
        this.timer = 81 - this.Mission;
        this.EXPLOSION_TIME = 10.5 - 0.5 * this.Mission;
        this.HURT_AMOUNT = 4 + this.Mission,
        this.clock4.getDelta();
        this.TNTtime = -1;
        this.TNTRoom = -1;
        this.Bomb = null;

        // Setup scene
        this.scene = new THREE.Scene();
        this.scene.add(new THREE.AmbientLight(0x4f4f4f));
        this.scene.fog = new THREE.Fog(0xa0a0a0, 1, 1000);

        // Load the test level
        this.level = new Level(10, this);

        // Setup player
        this.player = new THREE.Mesh(
            new THREE.CubeGeometry(9, 17, 3.5),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        );
        this.player.position.set(
            this.level.startPos.x, 16, this.level.startPos.y);
        this.player.canBeHurt = true;
        this.player.health = 100;
        this.player.armor = 0;
        this.player.ammo = this.preammo;
        this.player.gun = 0;
        this.player.TNT = this.preTNT;
        this.player.money = this.premoney + 500;
        this.player.inventory = [];
        this.scene.add(this.player);

        this.bombGeom = new THREE.CubeGeometry(5, 5, 5);
        var texture = new THREE.ImageUtils.loadTexture("images/crate.gif");
        this.bombMat = new THREE.MeshLambertMaterial({ map: texture });

        var zombieGeom = new THREE.CubeGeometry(9, 17, 3.5);
        texture = new THREE.ImageUtils.loadTexture("images/transparent.png");
        zombieMat = new THREE.MeshLambertMaterial({ map: texture });
        zombieMat.transparent = true;

        texture = new THREE.ImageUtils.loadTexture("images/crate.gif");//this is the bounding box of lizard, replace it with transparent image later

        var lizardGeom = new THREE.CubeGeometry(9, 6, 15);
        lizardMat = new THREE.MeshLambertMaterial({ map: texture });
        lizardMat.transparent = true;

        texture = new THREE.ImageUtils.loadTexture("images/disturb.jpg");//this is the bounding box of ghost, replace it with transparent image later

        var ghostGeom = new THREE.CubeGeometry(9, 13, 4);
        ghostMat = new THREE.MeshLambertMaterial({ map: texture });
        ghostMat.transparent = true;


        var loader = new THREE.JSONLoader(true);
        var tempCounter1 = 0;
        var tempCounter2 = 0;
        var tempCounter3 = 0;

        for (var z = 0; z < this.level.monsterPos.length; z++) {
            Amonster = {
                x: this.level.monsterPos[z].x,
                z: this.level.monsterPos[z].y,
                type: randInt(1, 4),
                mesh1: null,
                vel: 0.1 * this.Mission,
                health: 10 * this.Mission,
                queue: [],
                at: 0
            };
            switch (Amonster.type) {
                case 1:
                    Amonster.mesh1 = new THREE.Mesh(zombieGeom, zombieMat);
                    Amonster.mesh1.position = new THREE.Vector3(this.level.monsterPos[z].x, 8.5, this.level.monsterPos[z].y);
                    Amonster.y = 8,5;
                    break;
                case 2:
                    Amonster.mesh1 = new THREE.Mesh(lizardGeom, lizardMat);
                    Amonster.y = 3;
                    Amonster.mesh1.position = new THREE.Vector3(this.level.monsterPos[z].x, 3, this.level.monsterPos[z].y);
                    break;
                case 3:
                    Amonster.mesh1 = new THREE.Mesh(ghostGeom, ghostMat);
                    Amonster.y = 20;
                    Amonster.mesh1.position = new THREE.Vector3(this.level.monsterPos[z].x, 20, this.level.monsterPos[z].y);
                    break;
            }
            Amonster.mesh1.name = "monster";
            this.monster.push(Amonster);
            this.zomobjects.push(Amonster.mesh1);
            this.scene.add(Amonster.mesh1);
            Amonster.mesh1.index = z;

            var Zoms = this.monster;
            var LScene = this.scene;

            loader.load("models/zombie.js", function (geometry) {
                if (Zoms[tempCounter1].type === 1) {                    
                    Zoms[tempCounter1].mesh2 = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial);
                    Zoms[tempCounter1].mesh2.position.set(Zoms[tempCounter1].x, Zoms[tempCounter1].y, Zoms[tempCounter1].z);
                    Zoms[tempCounter1].mesh2.scale.set(12.5, 10, 12.5);
                    Zoms[tempCounter1].mesh2.name = "monster";
                    LScene.add(Zoms[tempCounter1].mesh2);
                }
                tempCounter1++;
            });

            loader.load("models/basicGun.js", function (geometry) {
                if (Zoms[tempCounter2].type === 2) {                  
                    Zoms[tempCounter2].mesh2 = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial);
                    Zoms[tempCounter2].mesh2.position.set(Zoms[tempCounter2].x, Zoms[tempCounter2].y, Zoms[tempCounter2].z);
                    Zoms[tempCounter2].mesh2.scale.set(2, 2, 2);
                    Zoms[tempCounter2].mesh2.name = "monster";
                    LScene.add(Zoms[tempCounter2].mesh2);
                }
                tempCounter2++;
            });

            loader.load("models/advancedGun.js", function (geometry) {
                if (Zoms[tempCounter3].type === 3) {
                    Zoms[tempCounter3].mesh2 = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial);
                    Zoms[tempCounter3].mesh2.position.set(Zoms[tempCounter3].x, Zoms[tempCounter3].y, Zoms[tempCounter3].z);
                    Zoms[tempCounter3].mesh2.scale.set(2, 2, 2);
                    Zoms[tempCounter3].mesh2.name = "monster";
                    LScene.add(Zoms[tempCounter3].mesh2);
                }
                tempCounter3++;
            });
        };
		
		//setup gun
		var myPlayer = this.player;
		var myScene = this.scene;
		//var gunLoader = new THREE.JSONLoader(true);
		loader.load("models/basicGun.js", function(geometry){
			var gunMesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial);
			gunMesh.position.set(myPlayer.position.x+1, myPlayer.position.y-1, myPlayer.position.z-1);
			gunMesh.scale.set(.3, .3, .3);
			gunMesh.rotation.y = (Math.PI/36);
			myScene.add(gunMesh);
		});
		

        // Setup camera
        this.camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR);
        this.camera.position.set(this.player.position.x, this.player.position.y, this.player.position.z);
        this.scene.add(this.camera);

        // Setup a light that will move with the player
        this.lights[0] = new THREE.PointLight(0xffccaa, 1.0, 100);
        this.lights[0].position.set(
            this.player.position.x,
            this.player.position.y + 32,
            this.player.position.z);
        this.scene.add(this.lights[0]);

        //console.log("# Objects: " + game.objects.length);
        console.log("Game initialized.");
    };

    // Draw the ending screen text
    // ------------------------------------------------------------------------
    this.ending = function () {
        // Clear the map
        this.Context.save();
        this.Context.setTransform(1, 0, 0, 1, 0, 0);
        this.Context.clearRect(0, 0, this.endingInfo.width, this.endingInfo.height);
        this.Context.restore();

        this.Context.font = '60px Arial';
        this.Context.textBaseline = 'middle';
        this.Context.textAlign = 'center';
        if (this.monster.length === 0) {
            if (this.Mission === this.maxMission) {
                this.Context.fillStyle = "#ff00ff";
                this.Context.fillText("Congratulations! monsters are all eliminated!", this.endingInfo.width / 2, this.endingInfo.height / 2);
            }
            else {
                this.Context.fillStyle = "#00ff00";
                this.Context.fillText("All monsters are killed in this level!", this.endingInfo.width / 2, this.endingInfo.height / 2);
                this.newMission = 2;
            }
        }
        else {
            this.Context.fillStyle = "#ff0000";
            this.Context.fillText("You lose, please try again!", this.endingInfo.width / 2, this.endingInfo.height / 2);
            this.newMission = 1;
        }
    };

    this.clear = function () {
        this.Context.save();
        this.Context.setTransform(1, 0, 0, 1, 0, 0);
        this.Context.clearRect(0, 0, this.endingInfo.width, this.endingInfo.height);
        this.Context.restore();
    }


    // Update everything in the scene
    // ------------------------------------------------------------------------
    var intervalTime = 3;
    this.update = function (input) {
        if (this.newMission > 0) {
            if (this.player === null) {
                this.init();
                console.log("Mission: " + this.Mission);
            }
            else {
                if (this.interval === -1) {
                    this.interval = intervalTime;
                    this.clock5.getDelta();
                }
                else {
                    if (this.interval > 0) {
                        this.interval -= this.clock5.getDelta();
                    }
                    else {
                        this.interval = -1;
                        this.preammo = this.player.ammo;
                        this.preTNT = this.player.TNT;
                        this.premoney = this.player.money;
                        this.init();
                        console.log("Mission: " + this.Mission);
                        this.clear();
                    }
                }
            }
        }
        this.timer -= this.clock4.getDelta();
        if (this.timer < 0) {
            this.timer = 0;
        }
        if (this.monster.length === 0 || this.player.health === 0 || this.timer === 0) {
            this.ending();
            if (this.Mission === this.maxMission) {
                if (this.firstOver === 0) {
                    this.firstOver = 1;
                }
                else {
                    return;
                }
            }
        }
        updateForce(this, input);
        this.level.update();


        updateMovement(this, input);
        updateBullets(this, input);
        updatemonsters(this);
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

var TNT_AMOUNT  = 1,
    TNT_COST    = 5000,
    AMMO_AMOUNT = 10,
    AMMO_COST   = 1000,
    ARMOR_COST  = 8000,
    GUN_COST    = 10000;

function updateForce(game, input) {
    if (input.trigger.TNT === 1) {
        if (game.player.money >= TNT_COST && game.TNTtime === -1) {
            game.player.TNT += TNT_AMOUNT;
            game.player.money -= TNT_COST;
        }
        input.trigger.TNT = 0;
    }
    if (input.trigger.Gun === 1) {
        if (game.player.gun === 0 && game.player.money >= GUN_COST) {
            game.player.gun = 1;
            game.player.money -= GUN_COST;
        }
        input.trigger.Gun = 0;
    }
    if (input.trigger.Armor === 1) {
        if (game.player.armor === 0 && game.player.money >= ARMOR_COST) {
            game.player.armor = 100;
            game.player.money -= ARMOR_COST;
        }
        input.trigger.Armor = 0;
    }
    if (input.trigger.Ammo === 1) {
        if (game.player.money >= AMMO_COST) {
            game.player.ammo += AMMO_AMOUNT;
            game.player.money -= AMMO_COST;
        }
        input.trigger.Ammo = 0;
    }
}



// ----------------------------------------------------------------------------
// Update the player 
// ----------------------------------------------------------------------------
var HURT_DISTANCE = 18,
    HURT_TIMEOUT = 1000,
    monster_DISTANCE = 18,
    PAIN_TIMEOUT = HURT_TIMEOUT;
function updatePlayer(game, input) {
    // Check for monster touching
    for (var i = 0; i < game.monster.length; ++i) {
        var dist = game.player.position.distanceTo(game.monster[i].mesh1.position);
        // Hurt the player if a monster is close enough
        // and the player hasn't taken damage less than HURT_TIMEOUT ms ago
        if (dist < HURT_DISTANCE && game.player.canBeHurt) {
            if (game.player.armor > 0) {
                game.player.armor -= game.HURT_AMOUNT;
                if (game.player.armor < 0) {
                    game.player.health += game.player.armor;
                    game.player.armor = 0;
                }
                game.player.canBeHurt = false;
            }
            else {
                game.player.health -= game.HURT_AMOUNT;
                if (game.player.health < 0)
                    game.player.health = 0;
                game.player.canBeHurt = false;
            }

            // Flash the pain canvas red
            var tween = new TWEEN.Tween({ alpha: 0.8 })
                .to({ alpha: 0.0 }, PAIN_TIMEOUT)
                .easing(TWEEN.Easing.Circular.Out)
                .onUpdate(function () {
                    game.painCanvas.alpha = this.alpha;
                })
                .start();
            console.log("ouch! Armor = " + game.player.armor + ", " + "health = " + game.player.health);

            setTimeout(function () {
                game.player.canBeHurt = true;
            }, HURT_TIMEOUT);

            break;
        }
    }

    // Draw the pain canvas with the current alpha
    var ctx = game.painCanvas.getContext("2d");
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, game.painCanvas.width, game.painCanvas.height);
    ctx.restore();
    ctx.globalAlpha = game.painCanvas.alpha;
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, game.painCanvas.width, game.painCanvas.height);
    //console.log("alpha: " + game.painCanvas.alpha);

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
    if (input.hold === 1) {
        if (input.trigger.Jump === 1) {
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
            triggerQE * input.f.y * 10,
            triggerWS * input.f.z - triggerAD * input.f.x / xzNorm
        )
    );



    // Update camera position/lookat 
    game.camera.position = game.player.position;
    var look = new THREE.Vector3();
    look.add(game.camera.position, input.f);
    game.camera.lookAt(look);

    // Update the view ray (center of canvas into screen)
    // TODO: make another ray for general view picking
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


function checkmonster(game) {
    var dz = game.level.geometry.doors[game.needToClose].centerz / CELL_SIZE;
    var dx = game.level.geometry.doors[game.needToClose].centerx / CELL_SIZE;

    for (var z = 0; z < game.monster.length; z++) {
        var sz = Math.floor(Math.floor(game.monster[z].mesh1.position.z) / CELL_SIZE + 0.5);
        var sx = Math.floor(Math.floor(game.monster[z].mesh2.position.x) / CELL_SIZE + 0.5);
        if (sz === dz && sx === dx) {
            return false;
        }
    }

    return true;
}

// ----------------------------------------------------------------------------
// Update all the Game's Bullets 
// ----------------------------------------------------------------------------
var BULLET_DAMAGE0 = 5;
var BULLET_DAMAGE1 = 10;
var EXPLOSION_AMOUNT = 50;
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
        game.bulletDelay += game.clock.getDelta();
        if (game.bulletDelay > refireTime) {
            game.bulletDelay = refireTime;
        }
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
            if (intersects1.length > 0 && intersects2.length === 0) {
                selected = null; // intersects1[0].object;                
            }

            if (intersects1.length === 0 && intersects2.length > 0) {
                selected = intersects2[0].object;
            }

            if (intersects1.length > 0 && intersects2.length > 0) {
                if (intersects1[0].distance > intersects2[0].distance) {
                    selected = intersects2[0].object;
                }
                else {
                    selected = null; // intersects1[0].object;
                }
            }

            if (selected !== null) {
                //                if (selected.name === "door") {
                //                    game.level.toggleDoor(selected.doorIndex);
                //                }
                //                else {
                if (selected.name === "monster") {
                    if (game.player.gun === 0) {
                        game.monster[selected.index].health -= BULLET_DAMAGE0;
                        game.monster[selected.index].health;
                    }
                    else {
                        game.monster[selected.index].health -= BULLET_DAMAGE1;
                    }

                    if (game.monster[selected.index].health <= 0) {
                        game.player.money += 1000;
                        game.scene.remove(game.monster[selected.index].mesh1);
                        game.scene.remove(game.monster[selected.index].mesh2);
                        game.zomobjects.splice(selected.index, 1);
                        game.monster.splice(selected.index, 1);
                        for (var z = selected.index; z < game.monster.length; z++) {
                            game.monster[z].mesh1.index -= 1;
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

    // Handle door toggling
    if (input.trigger.F === 1) {
        var sz = Math.floor(Math.floor(game.player.position.z) / CELL_SIZE + 0.5);
        var sx = Math.floor(Math.floor(game.player.position.x) / CELL_SIZE + 0.5);
        if (game.level.state[sz][sx] !== -1) {
            if (game.level.state[sz][sx] < 0) {
                game.needToClose = -2 - game.level.state[sz][sx];
            }
            else {
                game.level.toggleDoor(game.level.state[sz][sx]);
                input.trigger.F = 0;
            }
        }
        else {
            if (game.needToClose !== -1 && checkmonster(game)) {
                game.level.toggleDoor(game.needToClose);
                game.needToClose = -1;
                input.trigger.F = 0;
            }
        }
    }

    // Handle TNT placement
    if (input.trigger.R === 1) {
        var sz = Math.floor(Math.floor(game.player.position.z) / CELL_SIZE + 0.5);
        var sx = Math.floor(Math.floor(game.player.position.x) / CELL_SIZE + 0.5);
        if (game.TNTtime < 0 && game.player.TNT >= 1 && game.level.grid[sz][sx].isInterior()) {
            game.player.TNT -= 1;
            game.TNTtime = game.EXPLOSION_TIME;
            game.clock3.getDelta();
            game.TNTRoom = game.level.grid[sz][sx].roomIndex;
            game.Bomb = new THREE.Mesh(game.bombGeom, game.bombMat);
            game.Bomb.position.set(game.player.position.x, 2.5, game.player.position.z);
            game.scene.add(game.Bomb);
            game.TNTindex = game.scene.length - 1;
        }
        input.trigger.R = 0;
    }

    // Handle TNT update
    if (game.TNTtime > 0) {
        game.TNTtime -= game.clock3.getDelta();
        if (game.TNTtime < 0) {
            game.TNTtime = 0;
        }
    }
    else {
        if (game.TNTtime !== -1) {
            game.scene.remove(game.Bomb);
            game.Bomb = null;
            game.TNTtime = -1;
            var z = 0;
            var oz = Math.floor(Math.floor(game.player.position.z) / CELL_SIZE + 0.5);
            var ox = Math.floor(Math.floor(game.player.position.x) / CELL_SIZE + 0.5);
            if (game.level.grid[oz][ox].roomIndex === game.TNTRoom && game.level.grid[oz][ox].isInterior()) {
                if (game.player.armor > 0) {
                    game.player.armor -= EXPLOSION_AMOUNT;
                    if (game.player.armor < 0) {
                        game.player.health += game.player.armor;
                        game.player.armor = 0;
                    }
                    game.player.canBeHurt = false;
                }
                else {
                    game.player.health -= EXPLOSION_AMOUNT;
                    if (game.player.health < 0)
                        game.player.health = 0;
                    game.player.canBeHurt = false;
                }
            }
        }


        while (z < game.monster.length) {
            var sz = Math.floor(Math.floor(game.monster[z].mesh1.position.z) / CELL_SIZE + 0.5);
            var sx = Math.floor(Math.floor(game.monster[z].mesh2.position.x) / CELL_SIZE + 0.5);
            if (game.level.grid[sz][sx].roomIndex === game.TNTRoom && game.level.grid[sz][sx].isInterior()) {
                game.scene.remove(game.monster[z].mesh1);
                game.scene.remove(game.monster[z].mesh2);
                game.zomobjects.splice(z, 1);
                game.monster.splice(z, 1);
                for (var t = z; t < game.monster.length; t++) {
                    game.monster[t].mesh1.index -= 1;
                }
            }
            else {
                z++;
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
// Update all the Game's monsters
// ----------------------------------------------------------------------------
function updatemonsters(game) {
    if (game.searchDelay >= 1) {
        game.searchDelay = 0;
        var visit = new Array(NUM_CELLS.y);
        for (var i = 0; i < NUM_CELLS.y; i++) {
            visit[i] = new Array(NUM_CELLS.x);
        }
        for (var z = 0; z < game.monster.length; z++) {
            var oz = Math.floor(Math.floor(game.monster[z].mesh1.position.z) / CELL_SIZE + 0.5);
            var ox = Math.floor(Math.floor(game.monster[z].mesh1.position.x) / CELL_SIZE + 0.5);
            var sz = Math.floor(Math.floor(game.player.position.z) / CELL_SIZE + 0.5);
            var sx = Math.floor(Math.floor(game.player.position.x) / CELL_SIZE + 0.5);

            if (game.level.grid[sz][sx].type === CELL_TYPES.door && game.level.state[sz][sx] >= 0) {
                continue;
            }

            game.monster[z].queue = [];
            for (var i = 0; i < NUM_CELLS.y; i++) {
                for (var j = 0; j < NUM_CELLS.x; j++) {
                    visit[i][j] = 0;
                }
            }


            game.monster[z].queue.push(new game.Element(sz, sx, 0));
            var pointing = 0;
            var found = 0;
            game.monster[z].at = -1;
            while (1) {
                for (var i = -1; i <= 1; i++) {
                    for (var j = -1 + Math.abs(i) ; j <= 1 - Math.abs(i) ; j++) {
                        if (sz + i === oz && sx + j === ox) {
                            game.monster[z].queue.push(new game.Element(sz + i, sx + j, pointing));
                            game.monster[z].at = game.monster[z].queue.length - 1;
                            found = 1;
                            break;
                        }
                        else {
                            if (game.level.grid[sz + i][sx + j].type !== CELL_TYPES.wall &&
                                visit[sz + i][sx + j] === 0 &&
                                (game.level.grid[sz + i][sx + j].type !== CELL_TYPES.door || game.level.state[sz + i][sx + j] <= -2)
                                ) {
                                visit[sz + i][sx + j] = 1;
                                game.monster[z].queue.push(new game.Element(sz + i, sx + j, pointing));
                            }
                        }
                    }
                    if (found === 1) {
                        break;
                    }
                }
                if (found === 1) {
                    break;
                }
                pointing++;
                if (pointing === game.monster[z].queue.length) {
                    break;
                }
                sz = game.monster[z].queue[pointing].sz;
                sx = game.monster[z].queue[pointing].sx;
            }

            if (found === 1) {
                var start = game.monster[z].at;
                while (game.level.grid[game.monster[z].queue[start].sz][game.monster[z].queue[start].sx].type === CELL_TYPES.door) {
                    if (start === 0) {
                        break;
                    }
                    start = game.monster[z].queue[start].p;
                }
                if (start !== 0) {
                    var link = game.monster[z].queue[start].p;
                    while (1) {
                        while (game.level.grid[game.monster[z].queue[link].sz][game.monster[z].queue[link].sx].type !== CELL_TYPES.door) {
                            game.monster[z].queue[start].p = link;
                            if (link === 0) {
                                break;
                            }
                            link = game.monster[z].queue[link].p;
                        }

                        start = game.monster[z].queue[link].p;
                        if (start === 0) {
                            break;
                        }
                        while (game.level.grid[game.monster[z].queue[start].sz][game.monster[z].queue[start].sx].type === CELL_TYPES.door) {
                            if (start === 0) {
                                break;
                            }
                            start = game.monster[z].queue[start].p;
                        }
                        link = game.monster[z].queue[start].p;
                    }
                }
            }
        }
    }
    else {
        game.searchDelay += game.clock2.getDelta();
    }

    for (var z = 0; z < game.monster.length; z++) {
        if (game.monster[z].at === -1) {
            continue;
        }
        if (game.monster[z].queue[game.monster[z].at].p === 0) {
            moveToz = game.player.position.z;
            moveTox = game.player.position.x;
        }
        else {
            var moveToz = game.monster[z].queue[game.monster[z].queue[game.monster[z].at].p].sz * CELL_SIZE;
            var moveTox = game.monster[z].queue[game.monster[z].queue[game.monster[z].at].p].sx * CELL_SIZE;
        }
        var dz = moveToz - game.monster[z].mesh1.position.z;
        var dx = moveTox - game.monster[z].mesh1.position.x;
        if (dx * dx + dz * dz > 1e-6) {
            var direction = Math.atan2(dx, dz);
            var needMove = 1;
            if (Math.abs(game.monster[z].mesh1.rotation.y - direction) > 1e-6) {
                if (Math.abs(game.monster[z].mesh1.rotation.y - direction) > Math.PI) {
                    if (game.monster[z].mesh1.rotation.y > direction) {
                        if (game.monster[z].mesh1.rotation.y > direction + 2 * Math.PI - 0.2) {
                            game.monster[z].mesh1.rotation.y = direction;
                            game.monster[z].mesh2.rotation.y = direction;
                        }
                        else {
                            needMove = 0;
                            game.monster[z].mesh1.rotation.y += 0.2;
                            if (game.monster[z].mesh1.rotation.y > Math.PI) {
                                game.monster[z].mesh1.rotation.y -= 2 * Math.PI;
                                game.monster[z].mesh2.rotation.y -= 2 * Math.PI;
                            }
                        }
                    }
                    else {
                        if (game.monster[z].mesh1.rotation.y < direction - 2 * Math.PI + 0.2) {
                            game.monster[z].mesh1.rotation.y = direction;
                            game.monster[z].mesh2.rotation.y = direction;
                        }
                        else {
                            needMove = 0;
                            game.monster[z].mesh1.rotation.y -= 0.2;
                            if (game.monster[z].mesh1.rotation.y <= -Math.PI) {
                                game.monster[z].mesh1.rotation.y += 2 * Math.PI;
                                game.monster[z].mesh2.rotation.y += 2 * Math.PI;
                            }
                        }
                    }
                }
                else {
                    if (game.monster[z].mesh1.rotation.y > direction) {
                        if (game.monster[z].mesh1.rotation.y < direction + 0.2) {
                            game.monster[z].mesh1.rotation.y = direction;
                            game.monster[z].mesh2.rotation.y = direction;
                        }
                        else {
                            needMove = 0;
                            game.monster[z].mesh1.rotation.y -= 0.2;
                            game.monster[z].mesh2.rotation.y -= 0.2;
                        }
                    }
                    else {
                        if (game.monster[z].mesh1.rotation.y > direction - 0.2) {
                            game.monster[z].mesh1.rotation.y = direction;
                            game.monster[z].mesh2.rotation.y = direction;
                        }
                        else {
                            needMove = 0;
                            game.monster[z].mesh1.rotation.y += 0.2;
                            game.monster[z].mesh2.rotation.y += 0.2;
                        }
                    }
                }
            }
            if (needMove === 1) {
                var dis = Math.sqrt(dx * dx + dz * dz);
                var hopeTo = new THREE.Vector3();
                var stop = 0;
                if (dis < game.monster[z].vel) {
                    hopeTo.add(game.monster[z].mesh1.position, new THREE.Vector3(dx, 0, dz));
                    var hx = hopeTo.x - game.player.position.x;
                    var hz = hopeTo.z - game.player.position.z;
                    if (hx * hx + hz * hz < HURT_DISTANCE * HURT_DISTANCE / 4) {
                        stop = 1;
                    }
                    for (var p = 0; p < game.monster.length; p++) {
                        if (p === z) {
                            continue;
                        }
                        var hx = hopeTo.x - game.monster[p].mesh1.position.x;
                        var hz = hopeTo.z - game.monster[p].mesh1.position.z;
                        if (hx * hx + hz * hz < monster_DISTANCE * monster_DISTANCE) {
                            stop = 1;
                            break;
                        }
                    }

                    if (stop === 0) {
                        game.monster[z].mesh1.position.x = hopeTo.x;
                        game.monster[z].mesh1.position.z = hopeTo.z;
                        game.monster[z].mesh2.position.x = hopeTo.x;
                        game.monster[z].mesh2.position.z = hopeTo.z;
                        game.monster[z].at = game.monster[z].queue[game.monster[z].at].p;
                    }
                }
                else {
                    hopeTo.add(game.monster[z].mesh1.position, new THREE.Vector3(
                        game.monster[z].vel * dx / Math.sqrt(dx * dx + dz * dz),
                        0,
                        game.monster[z].vel * dz / Math.sqrt(dx * dx + dz * dz)));
                    var hx = hopeTo.x - game.player.position.x;
                    var hz = hopeTo.z - game.player.position.z;
                    if (hx * hx + hz * hz < HURT_DISTANCE * HURT_DISTANCE / 4) {
                        stop = 1;
                    }
                    for (var p = 0; p < game.monster.length; p++) {
                        if (p === z) {
                            continue;
                        }
                        var hx = hopeTo.x - game.monster[p].mesh1.position.x;
                        var hz = hopeTo.z - game.monster[p].mesh1.position.z;
                        if (hx * hx + hz * hz < monster_DISTANCE * monster_DISTANCE) {
                            stop = 1;
                            break;
                        }
                    }
                    if (stop === 0) {
                        game.monster[z].mesh1.position.x = hopeTo.x;
                        game.monster[z].mesh1.position.z = hopeTo.z;
                        game.monster[z].mesh2.position.x = hopeTo.x;
                        game.monster[z].mesh2.position.z = hopeTo.z;
                    }
                }
                if ((moveToz - game.monster[z].mesh1.position.z) * (moveToz - game.monster[z].mesh1.position.z) + (moveTox - game.monster[z].mesh1.position.x) * (moveTox - game.monster[z].mesh1.position.x) < 1e-6) {
                    game.monster[z].at = game.monster[z].queue[game.monster[z].at].p;
                }
            }
        }
    }
} // end function updatemonsters()


// ----------------------------------------------------------------------------
// Handle collision detection
// ----------------------------------------------------------------------------
function handleCollisions(game, input) {
    if (input.trigger.A || input.trigger.D || input.trigger.W || input.trigger.S || input.hold === 0) {
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

