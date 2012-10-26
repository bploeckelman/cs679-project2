var MAX_LIGHTS = 20;
var BLOOD_TEXTURE = THREE.ImageUtils.loadTexture("images/splatter.png");
var CROSSHAIR_TEXTURE = new Image();//THREE.ImageUtils.loadTexture("images/crosshair.png");
CROSSHAIR_TEXTURE.src = "images/crosshair.png";
var INSTRUCTION_TEXTURE = new Image();//THREE.ImageUtils.loadTexture("images/instruction.png");
INSTRUCTION_TEXTURE.src = "images/instruction.png";


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
    this.monobjects = [];
    this.lights = [];
    this.bullets = [];
    this.bulletDelay = 0;
    this.level = null;
    this.player = null;
    this.MAX_PLAYER_HEALTH = 100;
    this.MAX_PLAYER_ARMOR = 100;
    this.monster = [];
    this.oldplayer = new THREE.Vector3();
    this.searchDelay = 0;
    this.firstOver = 0;
    this.needToClose = 0;
    this.timer = 0;
    this.interval = -1;
    this.TNTtime = 0;
    this.lastTNT = 0;
    this.EXPLOSION_TIME = 0;
    this.monsterNumber = 0;
    this.TNTRoom = 0;
    this.Bomb = null;
    this.newMission = 2;
    this.Mission = 0;
    this.maxMission = 2;
    this.preammo = 0;
    this.preTNT = 0;
    this.premoney = 7000;
    this.modelLoaded = 0;
    this.stopTime = 1;
    this.firstLoad = 1;
    this.channel = 0;
    this.tempCounter1 = { number: 0 };
    this.tempCounter2 = { number: 0 };
    this.tempCounter3 = { number: 0 };
    this.tempCounter4 = { number: 0 };

    // Particle System related vars
    this.bloodParticlesCount = 100;
    this.particleSystems = [];


    this.mainCanvas = document.getElementById("canvas");

    // Create and position the information, then add it to the document
    this.endingInfo = document.createElement("canvas");
    this.endingInfo.id = "endinginfo";
    this.endingInfo.width = canvas.width;
    this.endingInfo.height = canvas.height;
    this.endingInfo.style.position = "absolute";
    this.endingInfo.style.bottom = 0;
    this.endingInfo.style.right = 0;
    document.getElementById("container").appendChild(this.endingInfo);

    // Save the 2d context for this canvas
    this.Context = this.endingInfo.getContext("2d");

    // Create and position the map canvas, then add it to the document
    this.mapCanvas = document.createElement("canvas");
    this.mapCanvas.id = "minimap";
    this.mapCanvas.width = MAP_CELL_SIZE * NUM_CELLS.x;
    this.mapCanvas.height = MAP_CELL_SIZE * NUM_CELLS.y;
    this.mapCanvas.style.position = "absolute";
    this.mapCanvas.style.bottom = 0;
    this.mapCanvas.style.right = 0;
    this.mapCanvas.style.top = "20px";
    this.mapCanvas.style.right = "20px";
    document.getElementById("container").appendChild(this.mapCanvas);

    // Create and position the information, then add it to the document
    playerInfo = document.createElement("canvas");
    playerInfo.id = "info";
    playerInfo.width = canvas.width;
    playerInfo.height = canvas.height;
    playerInfo.style.position = "absolute";
    playerInfo.style.bottom = 0;
    playerInfo.style.right = 0;
    document.getElementById("container").appendChild(playerInfo);

    // Create and position the information, then add it to the document
    missionInfo = document.createElement("canvas");
    missionInfo.id = "mission";
    missionInfo.width = canvas.width * 1;
    missionInfo.height = canvas.height * 2.7;
    missionInfo.style.position = "absolute";
    missionInfo.style.bottom = 0;
    missionInfo.style.right = 0;
    document.getElementById("container").appendChild(missionInfo);

    // Create and position the 'pain' canvas: flash red on screen on player injury
    this.painCanvas = document.createElement("canvas");
    this.painCanvas.id = "pain";
    this.painCanvas.width = canvas.width;
    this.painCanvas.height = canvas.height;
    this.painCanvas.style.position = "absolute";
    this.painCanvas.style.bottom = 0;
    this.painCanvas.style.right = 0;
    this.painCanvas.alpha = 0.0;
    document.getElementById("container").appendChild(this.painCanvas);

    // Create and position the 'flash' canvas: flash white on screen when TNT explodes
    this.flashCanvas = document.createElement("canvas");
    this.flashCanvas.id = "flash";
    this.flashCanvas.width = canvas.width;
    this.flashCanvas.height = canvas.height;
    this.flashCanvas.style.position = "absolute";
    this.flashCanvas.style.bottom = 0;
    this.flashCanvas.style.right = 0;
    this.flashCanvas.alpha = 0.0;
    document.getElementById("container").appendChild(this.flashCanvas);

    // Create and position the crosshair canvas
    this.crosshairCanvas = document.createElement("canvas");
    this.crosshairCanvas.id = "crosshair";
    this.crosshairCanvas.width = canvas.width;
    this.crosshairCanvas.height = canvas.height
    this.crosshairCanvas.style.position = "absolute";
    this.crosshairCanvas.style.bottom = 0;
    this.crosshairCanvas.style.right = 0;
    this.crosshairCanvas.alpha = 0.2;
    document.getElementById("container").appendChild(this.crosshairCanvas);

    // Create and position the instruction canvas
    this.instructionCanvas = document.createElement("canvas");
    this.instructionCanvas.id = "instruction";
    this.instructionCanvas.width = canvas.width;
    this.instructionCanvas.height = canvas.height
    this.instructionCanvas.style.position = "absolute";
    this.instructionCanvas.style.bottom = 0;
    this.instructionCanvas.style.right = 0;
    this.instructionCanvas.alpha = 1;
    document.getElementById("container").appendChild(this.instructionCanvas);

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

    this.checkLoaded = function () {
        if (this.modelLoaded === 0) {
            if (this.tempCounter1.number === this.monster.length && this.tempCounter2.number === this.monster.length &&
                this.tempCounter3.number === this.monster.length && this.tempCounter4.number === 1) {
                this.modelLoaded = 1;
                this.timer = 80 + 20 * this.Mission;
                this.clock4.getDelta();
                return;
            }
            else {
                this.modelLoaded = 0;
                return;
            }
        }
    }

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
        this.monobjects = [];
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
        this.EXPLOSION_TIME = 3;
        this.TNTtime = -1;
        this.lastTNTtime = -1;
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
        this.player.health = this.MAX_PLAYER_HEALTH;
        this.player.armor = 0;
        this.player.ammo = this.preammo;
        this.player.gun = 0;
        this.player.TNT = this.preTNT;
        this.player.money = this.premoney + 3000;
        this.player.inventory = [];
        this.scene.add(this.player);

        this.bombGeom = new THREE.CubeGeometry(5, 5, 5);
        var texture = new THREE.ImageUtils.loadTexture("images/crate.gif");
        this.bombMat = new THREE.MeshLambertMaterial({ map: texture });

        var zombieGeom = new THREE.CubeGeometry(9, 17, 3.5);
        texture = new THREE.ImageUtils.loadTexture("images/transparent.png");
        zombieMat = new THREE.MeshLambertMaterial({ map: texture });
        zombieMat.transparent = true;

        texture = new THREE.ImageUtils.loadTexture("images/transparent.png");//this is the bounding box of lizard, replace it with transparent image later

        var lizardGeom = new THREE.CubeGeometry(9, 6, 15);
        lizardMat = new THREE.MeshLambertMaterial({ map: texture });
        lizardMat.transparent = true;

        texture = new THREE.ImageUtils.loadTexture("images/transparent.png");//this is the bounding box of ghost, replace it with transparent image later

        var ghostGeom = new THREE.CubeGeometry(9, 13, 4);
        ghostMat = new THREE.MeshLambertMaterial({ map: texture });
        ghostMat.transparent = true;


        var loader = new THREE.JSONLoader(true);

        for (var z = 0; z < this.level.monsterPos.length; z++) {
            Amonster = {
                x: this.level.monsterPos[z].x,
                z: this.level.monsterPos[z].y,
                type: randInt(1, 4),
                mesh1: null,
                queue: [],
                at: 0
            };
            switch (Amonster.type) {
                case 1:
                    Amonster.vel = 0.1 * this.Mission;
                    Amonster.mesh1 = new THREE.Mesh(zombieGeom, zombieMat);
                    Amonster.mesh1.position = new THREE.Vector3(this.level.monsterPos[z].x, 8.5, this.level.monsterPos[z].y);
                    Amonster.health = 16 + 8 * this.Mission;
                    Amonster.HURT_AMOUNT = 8 + 4 * this.Mission;
                    Amonster.y = 0;
                    break;
                case 2:
                    Amonster.vel = 0.4 * this.Mission;
                    Amonster.mesh1 = new THREE.Mesh(lizardGeom, lizardMat);
                    Amonster.health = 4 + 2 * this.Mission;
                    Amonster.mesh1.position = new THREE.Vector3(this.level.monsterPos[z].x, 3, this.level.monsterPos[z].y);
                    Amonster.HURT_AMOUNT = 2 + this.Mission;
                    Amonster.y = 0;
                    break;
                case 3:
                    Amonster.vel = 0.2 * this.Mission;
                    Amonster.mesh1 = new THREE.Mesh(ghostGeom, ghostMat);
                    Amonster.health = 8 + 4 * this.Mission;
                    Amonster.mesh1.position = new THREE.Vector3(this.level.monsterPos[z].x, 20, this.level.monsterPos[z].y);
                    Amonster.HURT_AMOUNT = 4 + 2 * this.Mission;
                    Amonster.y = 0;
                    break;
            }
            Amonster.mesh1.name = "monster";
            this.monster.push(Amonster);
            this.monobjects.push(Amonster.mesh1);
            this.scene.add(Amonster.mesh1);
            Amonster.mesh1.index = z;

            var Mons = this.monster;
            var LScene = this.scene;
            this.tempCounter1.number = 0;
            this.tempCounter2.number = 0;
            this.tempCounter3.number = 0;
            this.tempCounter4.number = 0;
            var tempCount1 = this.tempCounter1;

            loader.load("models/zombie.js", function (geometry) {
                if (Mons[tempCount1.number].type === 1) {
                    Mons[tempCount1.number].mesh2 = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial);
                    Mons[tempCount1.number].mesh2.position.set(Mons[tempCount1.number].x, Mons[tempCount1.number].y, Mons[tempCount1.number].z);
                    Mons[tempCount1.number].mesh2.scale.set(12.5, 10, 12.5);
                    Mons[tempCount1.number].mesh2.name = "monster";
                    LScene.add(Mons[tempCount1.number].mesh2);
                }
                tempCount1.number++;
            });

            var tempCount2 = this.tempCounter2;
            loader.load("models/snake.js", function (geometry) {
                if (Mons[tempCount2.number].type === 2) {
                    Mons[tempCount2.number].mesh2 = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial);
                    Mons[tempCount2.number].mesh2.position.set(Mons[tempCount2.number].x, Mons[tempCount2.number].y, Mons[tempCount2.number].z);
                    Mons[tempCount2.number].mesh2.scale.set(1.3, 1.3, .8);
                    Mons[tempCount2.number].mesh2.name = "monster";
                    LScene.add(Mons[tempCount2.number].mesh2);
                }
                tempCount2.number++;
            });

            var tempCount3 = this.tempCounter3;
            loader.load("models/ghost.js", function (geometry) {
                if (Mons[tempCount3.number].type === 3) {
                    Mons[tempCount3.number].mesh2 = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial);
                    Mons[tempCount3.number].mesh2.position.set(Mons[tempCount3.number].x, Mons[tempCount3.number].y + 18, Mons[tempCount3.number].z);
                    Mons[tempCount3.number].mesh2.scale.set(3, 3, 3);
                    Mons[tempCount3.number].mesh2.name = "monster";
                    LScene.add(Mons[tempCount3.number].mesh2);
                }
                tempCount3.number++;
            });
        };

        // Setup gun
        var game = this;
        var tempCount4 = this.tempCounter4;
        loader.load("models/basicGun.js", function (geometry) {
            // Setup dummy node to orient gun in correct direction
            var dummy = new THREE.Object3D();
            dummy.position.set(
            game.player.position.x,
            game.player.position.y,
            game.player.position.z);

            // Setup gun mesh
            game.player.gunMesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial);
            game.player.gunMesh.position.set(0.6, -0.9, -1.4); // offset from dummy pos
            game.player.gunMesh.scale.set(.15, .15, .15);
            game.player.gunMesh.rotation.y = Math.PI;
            game.player.gunMesh.dummy = dummy;

            // Make the gun mesh a child object of the dummy node
            dummy.add(game.player.gunMesh);
            game.player.gunMesh.dummy = dummy;

            // Make the dummy node a child object of the camera
            game.camera.add(game.player.gunMesh.dummy);
            game.scene.add(game.player.gunMesh.dummy);
            tempCount4.number++;
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
    var intervalTime = 1;
    this.update = function (input) {
        if (this.modelLoaded === 0 && this.newMission === 0) {
            this.checkLoaded();
            return 0;
        }

        if (this.newMission > 0) {
            if (this.player === null) {
                this.modelLoaded = 0;
                this.init();
                console.log("Mission: " + this.Mission);
                if (this.modelLoaded === 0) {
                    return 0;
                }
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
                        this.modelLoaded = 0;
                        this.init();
                        this.clear();
                        console.log("Mission: " + this.Mission);
                        if (this.modelLoaded === 0) {
                            return 0;
                        }
                    }
                }
            }
        }

        if (this.stopTime === 0) {
            this.timer -= this.clock4.getDelta();
        }
        if (this.timer < 0) {
            this.timer = 0;
        }
        if (this.monster.length === 0 || this.player.health === 0 || this.timer === 0) {
            this.ending();
            if (this.firstOver === 0) {
                if (this.player.health === 0 || this.timer === 0) {
                    playSound("sound/dead.mp3", this);
                }
                else {
                    if (this.Mission !== this.maxMission) {
                        playSound("sound/levelup.mp3", this);
                    }
                    else {
                        document.getElementById("background").src = "sound/cheering.mp3";
                    }
                }
                this.firstOver++;
            }
            else {
                return;
            }
        }
        updateForce(this, input);
        this.level.update();


        updateMovement(this, input);
        updateBullets(this, input);
        updatemonsters(this);
        handleCollisions(this, input);
        updatePlayer(this, input);

        // Update particle systems
        for (var i = this.particleSystems.length - 1; i >= 0; --i) {
            var psys = this.particleSystems[i];

            // Remove old systems
            if (psys.complete) {
                this.scene.remove(psys);
                this.particleSystems.splice(i, 1);
            } else {
                // Update the particles
                for (var j = 0; j < psys.geometry.vertices.length; ++j) {
                    var particle = psys.geometry.vertices[j];
                    particle.velocity.y -= 0.05;
                    particle.x += particle.velocity.x;
                    particle.y += particle.velocity.y;
                    particle.z += particle.velocity.z;
                }
                psys.geometry.__dirtyVertices = true;
            }
        }

        TWEEN.update();
    };

    this.drawInstruction = function (input) {
        // Draw the instruction
        var ctx = this.instructionCanvas.getContext("2d");
        if (input.trigger.Help === 1) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, this.instructionCanvas.width, this.instructionCanvas.height);
            ctx.restore();
            ctx.globalAlpha = this.instructionCanvas.alpha;
            ctx.fillStyle = "#fffffff";
            ctx.drawImage(INSTRUCTION_TEXTURE,
                this.instructionCanvas.width / 2 - INSTRUCTION_TEXTURE.width / 2,
                this.instructionCanvas.height / 2 - INSTRUCTION_TEXTURE.height / 2);
        }
        else {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, this.endingInfo.width, this.endingInfo.height);
            ctx.restore();
        }
    }

    // Draw the scene as seen through the current camera
    // ------------------------------------------------------------------------
    this.render = function (input) {
        this.renderer.render(this.scene, this.camera);

        // Draw the crosshair
        var ctx = this.crosshairCanvas.getContext("2d");
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.crosshairCanvas.width, this.crosshairCanvas.height);
        ctx.restore();
        ctx.globalAlpha = this.crosshairCanvas.alpha;
        ctx.fillStyle = "#fffffff";
        ctx.drawImage(CROSSHAIR_TEXTURE,
            this.crosshairCanvas.width / 2 - CROSSHAIR_TEXTURE.width / 2,
            this.crosshairCanvas.height / 2 - CROSSHAIR_TEXTURE.height / 2);

        this.drawInstruction(input);
        ++this.numFrames;
    }
}; // end Game object

var TNT_AMOUNT = 1,
    TNT_COST = 1500,
    AMMO_AMOUNT = 10,
    AMMO_COST = 1000,
    ARMOR_COST = 8000,
    GUN_COST = 10000;

function updateForce(game, input) {
    if (input.trigger.TNT === 1) {
        if (game.player.money >= TNT_COST && game.TNTtime === -1) {
            playSound("sound/bell.mp3", game);
            game.player.TNT += TNT_AMOUNT;
            game.player.money -= TNT_COST;
        }
        input.trigger.TNT = 0;
    }
    if (input.trigger.Gun === 1) {
        if (game.player.gun === 0 && game.player.money >= GUN_COST) {
            playSound("sound/bell.mp3", game);
            game.player.gun = 1;
            game.player.money -= GUN_COST;
            game.scene.remove(game.player.gunMesh.dummy);
            var loader = new THREE.JSONLoader(true);
            loader.load("models/advancedGun.js", function (geometry) {
                var dummy = new THREE.Object3D();
                dummy.position.set(
				game.player.position.x,
				game.player.position.y,
				game.player.position.z);

                // Setup gun mesh
                game.player.gunMesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial);
                game.player.gunMesh.position.set(.85, -0.9, -1.4); // offset from dummy pos
                game.player.gunMesh.scale.set(.25, .25, .25);

                game.player.gunMesh.dummy = dummy;

                // Make the gun mesh a child object of the dummy node
                dummy.add(game.player.gunMesh);
                game.player.gunMesh.dummy = dummy;

                // Make the dummy node a child object of the camera
                game.camera.add(game.player.gunMesh.dummy);
                game.scene.add(game.player.gunMesh.dummy);

            });
        }
        input.trigger.Gun = 0;
    }
    if (input.trigger.Armor === 1) {
        if (game.player.armor === 0 && game.player.money >= ARMOR_COST) {
            playSound("sound/bell.mp3", game);
            game.player.armor = game.MAX_PLAYER_ARMOR;
            game.player.money -= ARMOR_COST;
        }
        input.trigger.Armor = 0;
    }
    if (input.trigger.Ammo === 1) {
        if (game.player.money >= AMMO_COST) {
            playSound("sound/bell.mp3", game);
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
    MONSTER_DISTANCE = 18,
    PAIN_TIMEOUT = HURT_TIMEOUT;
function updatePlayer(game, input) {
    // Check for monster touching
    for (var i = 0; i < game.monster.length; ++i) {
        var dist = game.player.position.distanceTo(game.monster[i].mesh1.position);
        // Hurt the player if a monster is close enough
        // and the player hasn't taken damage less than HURT_TIMEOUT ms ago
        if (dist < HURT_DISTANCE && game.player.canBeHurt) {
            var dead = 0;
            if (game.player.armor > 0) {
                game.player.armor -= game.monster[i].HURT_AMOUNT;
                if (game.player.armor < 0) {
                    game.player.health += game.player.armor;
                    game.player.armor = 0;
                }
                game.player.canBeHurt = false;
            }
            else {
                game.player.health -= game.monster[i].HURT_AMOUNT;
                if (game.player.health < 0) {
                    dead = 1;
                    game.player.health = 0;
                }
                game.player.canBeHurt = false;
            }
            if (dead === 0) {
                playSound("sound/ouch.mp3", game);
                // Flash the pain canvas red
                var tween = new TWEEN.Tween({ alpha: 0.8 })
                    .to({ alpha: 0.0 }, PAIN_TIMEOUT)
                    .easing(TWEEN.Easing.Circular.Out)
                    .onUpdate(function () {
                        game.painCanvas.alpha = this.alpha;
                    })
                    .start();
                console.log("ouch! Armor = " + game.player.armor + ", " + "health = " + game.player.health);
            }

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

    // Orient the gun with the camera view direction
    // (offset from dummy node by game.player.gunMesh.position)
    game.player.gunMesh.dummy.position.set(
        game.camera.position.x,
        game.camera.position.y,
        game.camera.position.z);
    game.player.gunMesh.dummy.rotation.set(
        game.camera.rotation.x,
        game.camera.rotation.y,
        game.camera.rotation.z);
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
        0, 1000                                           // near, far
    );
}


function checkmonster(game) {
    var dz = game.level.geometry.doors[game.needToClose].centerz / CELL_SIZE;
    var dx = game.level.geometry.doors[game.needToClose].centerx / CELL_SIZE;

    for (var z = 0; z < game.monster.length; z++) {
        if (game.monster[z].type !== 1) {
            continue;
        }
        var sz = Math.floor(Math.floor(game.monster[z].mesh1.position.z) / CELL_SIZE + 0.5);
        var sx = Math.floor(Math.floor(game.monster[z].mesh2.position.x) / CELL_SIZE + 0.5);
        if (sz === dz && sx === dx) {
            return false;
        }
    }

    return true;
}

this.playSound = function (soundFile, game) {
    document.getElementById("foreground" + game.channel).src = soundFile;
    game.channel = (game.channel + 1) % 5;
}

// ----------------------------------------------------------------------------
// Update all the Game's Bullets 
// ----------------------------------------------------------------------------
var BULLET_DAMAGE0 = 5;
var BULLET_DAMAGE1 = 10;
var EXPLOSION_AMOUNT = 10;
var FLASH_TIMEOUT = 10000;
function updateBullets(game, input) {
    var refireTime = 0.3,
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
            refireTime = 0;
            if (game.player.gun === 0) {
                playSound("sound/gunshot.mp3", game);
            }
            else {
                playSound("sound/advancedgunshot.mp3", game);
            }

            // Toggle doors if there are any directly in line of sight 
            var intersects1 = input.viewRay.intersectObjects(game.objects),
                intersects2 = input.viewRay.intersectObjects(game.monobjects),
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

                // Damage intersected monster
                if (selected.name === "monster") {
                    var mondead = 0;
                    var monster = game.monster[selected.index];
                    monster.health -= (game.player.gun === 0) ? BULLET_DAMAGE0 : BULLET_DAMAGE1;
                    // Spawn a blood particle system
                    var pgeom = new THREE.Geometry();
                    for (var i = 0; i < game.bloodParticlesCount; ++i) {
                        var particle = new THREE.Vector3(
                                monster.mesh1.position.x,
                                monster.mesh1.position.y,
                                monster.mesh1.position.z
                            );
                        particle.velocity = new THREE.Vector3(
                            Math.random() * 0.5 - 0.25,
                            Math.random() * 0.75,
                            Math.random() * 0.5 - 0.25);
                        pgeom.vertices.push(particle);
                    }

                    var pmat = new THREE.ParticleBasicMaterial({
                        size: 10,
                        sizeAttenuation: true,
                        map: BLOOD_TEXTURE,
                        blending: THREE.NormalBlending,//AdditiveBlending,
                        transparent: true,
                        depthWrite: false,
                        depthTest: false
                    });

                    var psys = new THREE.ParticleSystem(pgeom, pmat);
                    psys.sortParticles = true;
                    psys.complete = false;

                    // Shrink the size of the particles in the system over time
                    var tween = new TWEEN.Tween({ size: psys.material.size })
                        .to({ size: 0.0 }, PAIN_TIMEOUT)
                        .easing(TWEEN.Easing.Circular.Out)
                        .onUpdate(function () {
                            psys.material.size = this.size;
                        })
                        .onComplete(function () {
                            psys.complete = true;
                        })
                        .start();

                    game.particleSystems.push(psys);
                    game.scene.add(psys);

                    if (game.monster[selected.index].health <= 0) {
                        mondead = 1;
                        game.player.money += 2000;
                        game.scene.remove(game.monster[selected.index].mesh1);
                        game.scene.remove(game.monster[selected.index].mesh2);
                        game.monobjects.splice(selected.index, 1);
                        game.monster.splice(selected.index, 1);
                        for (var z = selected.index; z < game.monster.length; z++) {
                            game.monster[z].mesh1.index -= 1;
                        }
                    }
                    if (mondead == 0) {
                        playSound("sound/monsterbleed.mp3", game);
                    }
                    else {
                        playSound("sound/monsterdead.mp3", game);
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
        for (var z = -1; z <= 1; z++) {
            for (var x = -1; x <= 1; x++) {
                if (x === 0 && z === 0) {
                    if (game.level.state[sz][sx] !== -1) {
                        if (game.level.state[sz][sx] < 0) {
                            game.needToClose = -2 - game.level.state[sz][sx];
                        }
                        else {
                            if (game.level.geometry.doors[game.level.state[sz][sx]].canToggle) {
                                game.level.toggleDoor(game.level.state[sz][sx]);
                                playSound("sound/door.mp3", game);
                            }
                            input.trigger.F = 0;
                        }
                    }
                    else {
                        if (game.needToClose !== -1 && checkmonster(game)) {
                            if (game.level.geometry.doors[game.needToClose].canToggle) {
                                game.level.toggleDoor(game.needToClose);
                                game.needToClose = -1;
                                playSound("sound/door.mp3", game);
                                input.trigger.F = 0;
                            }
                        }
                    }
                }
                else {
                    if (game.level.state[sz + z][sx + x] !== -1) {
                        if (game.level.state[sz + z][sx + x] < 0) {
                            if (game.level.geometry.doors[-2 - game.level.state[sz + z][sx + x]].canToggle) {
                                game.level.toggleDoor(-2 - game.level.state[sz + z][sx + x]);
                                playSound("sound/door.mp3", game);
                            }
                            input.trigger.F = 0;
                        }
                        else {
                            if (game.level.geometry.doors[game.level.state[sz + z][sx + x]].canToggle) {
                                game.level.toggleDoor(game.level.state[sz + z][sx + x]);
                                playSound("sound/door.mp3", game);
                            }
                            input.trigger.F = 0;
                        }
                    }
                }
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
            game.lastTNTtime = game.EXPLOSION_TIME;
            playSound("sound/timer.mp3", game);
            game.clock3.getDelta();
            game.TNTRoom = game.level.grid[sz][sx].roomIndex;
            var loader = new THREE.JSONLoader(true);
            loader.load("models/dynamite.js", function (geometry) {
                game.Bomb = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial);
                game.Bomb.rotation.x = Math.PI / 2;
                game.Bomb.scale.set(3, 3, 3);
                game.Bomb.position.set(game.player.position.x, 2.5, game.player.position.z);
                game.scene.add(game.Bomb);
            });
            game.TNTindex = game.scene.length - 1;
        }
        input.trigger.R = 0;
    }

    // Handle TNT update
    if (game.TNTtime > 0) {
        if (Math.floor(game.TNTtime) !== game.lastTNTtime) {
            game.lastTNTtime = Math.floor(game.TNTtime);
            playSound("sound/timer.mp3", game);
        }
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
            var oz = Math.floor(Math.floor(game.player.position.z) / CELL_SIZE + 0.5);
            var ox = Math.floor(Math.floor(game.player.position.x) / CELL_SIZE + 0.5);
            if (game.level.grid[oz][ox].roomIndex === game.TNTRoom && game.level.grid[oz][ox].isInterior()) {
                var dead = 0;
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
                    if (game.player.health < 0) {
                        dead = 1;
                        game.player.health = 0;
                    }
                    game.player.canBeHurt = false;
                }
                if (dead === 0) {
                    playSound("sound/ouch.mp3", game);
                }
                setTimeout(function () {
                    game.player.canBeHurt = true;
                }, HURT_TIMEOUT);
            }

            // Flash the canvas white
            var tween = new TWEEN.Tween({ alpha: 0.8 })
            .to({ alpha: 0.0 }, FLASH_TIMEOUT)
            .easing(TWEEN.Easing.Circular.Out)
            .onUpdate(function () {
                game.flashCanvas.alpha = this.alpha;
            })
            .start();
            playSound("sound/explosion.mp3", game);

            var z = 0;
            while (z < game.monster.length) {
                var sz = Math.floor(Math.floor(game.monster[z].mesh1.position.z) / CELL_SIZE + 0.5);
                var sx = Math.floor(Math.floor(game.monster[z].mesh2.position.x) / CELL_SIZE + 0.5);
                if (game.level.grid[sz][sx].roomIndex === game.TNTRoom && game.level.grid[sz][sx].isInterior()) {
                    game.scene.remove(game.monster[z].mesh1);
                    game.scene.remove(game.monster[z].mesh2);
                    game.monobjects.splice(z, 1);
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
    }

    // Draw the pain canvas with the current alpha
    var ctx = game.flashCanvas.getContext("2d");
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, game.flashCanvas.width, game.flashCanvas.height);
    ctx.restore();
    ctx.globalAlpha = game.flashCanvas.alpha;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, game.flashCanvas.width, game.flashCanvas.height);

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
var detectDistance = 200;
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
            if (game.monster[z].type === 3) {
                game.monster[z].queue.push(new game.Element(sz, sx, 0));
                game.monster[z].queue.push(new game.Element(oz, ox, 0));
                game.monster[z].at = 1;
                found = 1;
                continue;
            }


            if (game.level.grid[sz][sx].type === CELL_TYPES.door) {
                if (game.level.state[sz][sx] >= 0) {
                    continue;
                }
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
                if (game.level.grid[sz][sx].type === CELL_TYPES.door && game.monster[z].type === 2) {
                    break;
                }
                for (var i = -1; i <= 1; i++) {
                    for (var j = -1 + Math.abs(i) ; j <= 1 - Math.abs(i) ; j++) {
                        if (sz + i === oz && sx + j === ox && (game.monster[z].type === 1 || game.level.grid[oz][ox].type !== CELL_TYPES.door)) {
                            game.monster[z].queue.push(new game.Element(sz + i, sx + j, pointing));
                            game.monster[z].at = game.monster[z].queue.length - 1;
                            found = 1;
                            break;
                        }
                        else {
                            if (game.level.grid[sz + i][sx + j].type !== CELL_TYPES.wall &&
                                visit[sz + i][sx + j] === 0 &&
                                (game.level.grid[sz + i][sx + j].type !== CELL_TYPES.door || (game.level.state[sz + i][sx + j] <= -2 && game.monster[z].type === 1))
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

            if (found === 1 && game.monster[z].type !== 3) {
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
        var needMove = 0;
        if (game.monster[z].at === -1) {
            continue;
        }
        if (game.monster[z].queue[game.monster[z].at].p === 0) {
            if (game.monster[z].type === 2) {
                var sz = Math.floor(Math.floor(game.player.position.z) / CELL_SIZE + 0.5);
                var sx = Math.floor(Math.floor(game.player.position.x) / CELL_SIZE + 0.5);
                if (game.level.grid[sz][sx].type === CELL_TYPES.door) {
                    continue;
                }
            }
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
                    var hdist = hopeTo.distanceTo(game.player.position);
                    if (hdist < HURT_DISTANCE / 2) {
                        stop = 1;
                    }
                    for (var p = 0; p < game.monster.length; p++) {
                        if (p === z) {
                            continue;
                        }
                        hdist = hopeTo.distanceTo(game.monster[p].mesh1.position);
                        if (hdist < MONSTER_DISTANCE) {
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
                    if (dis > detectDistance && game.monster[z].type === 3) {
                        stop = 1;
                    }
                    else {
                        hopeTo.add(game.monster[z].mesh1.position, new THREE.Vector3(
                            game.monster[z].vel * dx / Math.sqrt(dx * dx + dz * dz),
                            0,
                            game.monster[z].vel * dz / Math.sqrt(dx * dx + dz * dz)));
                        var hdist = hopeTo.distanceTo(game.player.position);
                        if (hdist < HURT_DISTANCE / 2) {
                            stop = 1;
                        }
                        for (var p = 0; p < game.monster.length; p++) {
                            if (p === z) {
                                continue;
                            }
                            hdist = hopeTo.distanceTo(game.monster[p].mesh1.position);
                            if (hdist < MONSTER_DISTANCE) {
                                stop = 1;
                                break;
                            }
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
            var g = 0;
            while (g < collisionResults.length) {
                if (collisionResults[g].object.name === "door") {
                    var index = collisionResults[g].object.doorIndex;
                    var dz = game.level.geometry.doors[index].centerz / CELL_SIZE;
                    var dx = game.level.geometry.doors[index].centerx / CELL_SIZE;
                    if (game.level.state[dz][dx] < 0) {
                        collisionResults.splice(g, 1);
                        continue;
                    }
                    g++;
                } else {
                    g++;
                }
            }

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

