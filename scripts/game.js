function Game(renderer, canvas) {
    // ------------------------------------------------------------------------
    // Public properties ------------------------------------------------------
    // ------------------------------------------------------------------------
    this.renderer  = renderer;
    this.canvas    = canvas;
    this.isRunning = true;
    this.numFrames = 0;
    this.clock     = new THREE.Clock();
    this.scene     = null;
    this.camera    = null;
    this.objects   = []; // TODO: change to {}? name->object map
    this.lights    = [];
    this.level     = null;
    this.player    = [];
    this.playerDist = [];
    this.oldplayer    = new THREE.Vector3;
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
    this.init = function () {
        var meshGeometry = null,
	texture = THREE.ImageUtils.loadTexture("images/disturb.jpg");
        texture.anisotropy = renderer.getMaxAnisotropy();

        console.log("Game initializing...");

        // Setup scene
        this.scene = new THREE.Scene();
        //this.scene.fog = new THREE.Fog(0x555555, 150, 300);

	//put a green box indicate the volume of our player, for the purpose of collision detection
	var box = new THREE.CubeGeometry(10,22,5);
	material = new THREE.MeshBasicMaterial( { map: texture } );
	this.player=new THREE.Mesh(box,material);
	this.player.position.set(320, 200, 320);
        this.scene.add(this.player);


        // Setup camera
        this.camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR);
        this.camera.position.add(this.player.position,new THREE.Vector3(0,eyeup,debug));
	this.camera.lookAt(new THREE.Vector3(50,0,50));
        this.scene.add(this.camera);


        // Setup some test lighting
        this.lights[0] = new THREE.PointLight(0xff0000);
        this.lights[0].position.set(-20, 50, -20);
        this.lights[1] = new THREE.PointLight(0x0000ff);
        this.lights[1].position.set(0, 50, 0);
        this.scene.add(this.lights[0]);
        this.scene.add(this.lights[1]);

        // Create some test objects to draw 
        // --------------------------------

        // A Sphere
        this.objects[0] = new THREE.Mesh(
            new THREE.SphereGeometry(10, 32, 32),
            new THREE.MeshLambertMaterial({ color: 0xffffff })
        );
        this.objects[0].position.set(20,30,20);
        this.scene.add(this.objects[0]);

        // A planar mesh
        meshGeometry = new THREE.Geometry();
        generateGeometry(
            meshGeometry,
            { w: 80, h: 80, quadSize: 16 }
        );
        /*
        this.objects[1] = new THREE.Mesh(
            meshGeometry,
            new THREE.MeshBasicMaterial({
                color: 0x00aa00,
                shading: THREE.FlatShading,
                wireframe: true
            })
        );
        */
	
        this.objects[1] = new THREE.Mesh(
            new THREE.PlaneGeometry(1280, 1280),
            new THREE.MeshBasicMaterial({ map: texture })
        );
        this.objects[1].rotation.x = - Math.PI / 2;
        //this.scene.add(this.objects[1]);

        // TESTING:
        this.level = new Level(10, this.scene, this.objects);

        console.log("Game initialized.");
    }


    this.update = function (input) {
        var triggerAD = input.trigger.A - input.trigger.D,
            triggerWS = input.trigger.W - input.trigger.S,
            triggerQE = input.trigger.Q - input.trigger.E,
            look = new THREE.Vector3(),
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
        var velocity = 8;
        if (input.hold == 1) {
            if (input.trigger.Jump == 1) {
                input.v = velocity;
                input.trigger.Jump = 0;
                input.hold = 0;
                this.camera.position.y += input.v;
                this.player.position.y += input.v;
                input.v -= 0.5;
            }
        }
        else {
            this.camera.position.y += input.v;
            this.player.position.y += input.v;
            input.v -= 0.5;
        }

        xzNorm = Math.sqrt(input.f.x * input.f.x + input.f.z * input.f.z);
        this.player.position.add(
            this.player.position,
            new THREE.Vector3(
                triggerWS * input.f.x + triggerAD * input.f.z / xzNorm,
                triggerQE * input.f.y * 10, //previouly, triggerWS * input.f.y,
                triggerWS * input.f.z - triggerAD * input.f.x / xzNorm
            )
        );

        this.camera.position.add(
            this.camera.position,
            new THREE.Vector3(
                triggerWS * input.f.x + triggerAD * input.f.z / xzNorm,
                triggerQE * input.f.y * 10, //previouly, triggerWS * input.f.y,
                triggerWS * input.f.z - triggerAD * input.f.x / xzNorm
            )
        );

        look.add(this.camera.position, input.f);
        this.camera.lookAt(look);

        // Move the lights around
        this.lights[0].position.set(
            Math.sin(this.clock.getElapsedTime()) * 50,
            50,
            Math.cos(this.clock.getElapsedTime()) * 50);
        this.lights[1].position.set(
            Math.cos(this.clock.getElapsedTime()) * 50,
            50,
            Math.sin(this.clock.getElapsedTime()) * 50);

        //collision detection code
        if (input.trigger.A || input.trigger.D || input.trigger.W || input.trigger.S || input.hold == 0) {
            input.hold = 0;
            for (var vertexIndex = 0; vertexIndex < this.player.geometry.vertices.length; vertexIndex++) {
                var directionVector = this.player.geometry.vertices[vertexIndex].clone();
                var ray = new THREE.Ray(this.player.position, directionVector.clone().normalize());
                var collisionResults = ray.intersectObjects(this.objects);
                if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < 1e-6) {
                    if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                        var i = 0;
                        var j = 0;
                        var k = 0;
                        if (this.player.position.x - this.oldplayer.x > 0) {
                            for (i = 1; i <= this.player.position.x - this.oldplayer.x; i++) {
                                ray = new THREE.Ray(new THREE.Vector3(this.oldplayer.x + i, this.oldplayer.y, this.oldplayer.z), directionVector.clone().normalize());
                                collisionResults = ray.intersectObjects(this.objects);
                                if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                    break;
                                }
                            }
                            i -= 1;
                        }
                        if (this.player.position.x - this.oldplayer.x < 0) {
                            for (i = -1; i >= this.player.position.x - this.oldplayer.x; i--) {
                                ray = new THREE.Ray(new THREE.Vector3(this.oldplayer.x + i, this.oldplayer.y, this.oldplayer.z), directionVector.clone().normalize());
                                collisionResults = ray.intersectObjects(this.objects);
                                if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                    break;
                                }
                            }
                            i += 1;
                        }

                        if (this.player.position.y - this.oldplayer.y > 0) {
                            for (j = 1; j <= this.player.position.y - this.oldplayer.y; j++) {
                                ray = new THREE.Ray(new THREE.Vector3(this.oldplayer.x + i, this.oldplayer.y + j, this.oldplayer.z), directionVector.clone().normalize());
                                collisionResults = ray.intersectObjects(this.objects);
                                if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                    break;
                                }
                            }
                            j -= 1;
                        }
                        if (this.player.position.y - this.oldplayer.y < 0) {
                            for (j = -1; j >= this.player.position.y - this.oldplayer.y; j--) {
                                ray = new THREE.Ray(new THREE.Vector3(this.oldplayer.x + i, this.oldplayer.y + j, this.oldplayer.z), directionVector.clone().normalize());
                                collisionResults = ray.intersectObjects(this.objects);
                                if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                    break;
                                }
                            }
                            j += 1;
                        }

                        if (this.player.position.z - this.oldplayer.z > 0) {
                            for (k = 1; k <= this.player.position.z - this.oldplayer.z; k++) {
                                ray = new THREE.Ray(new THREE.Vector3(this.oldplayer.x + i, this.oldplayer.y + j, this.oldplayer.z + k), directionVector.clone().normalize());
                                collisionResults = ray.intersectObjects(this.objects);
                                if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                    break;
                                }
                            }
                            k -= 1;
                        }
                        if (this.player.position.z - this.oldplayer.z < 0) {
                            for (k = -1; k >= this.player.position.z - this.oldplayer.z; k--) {
                                ray = new THREE.Ray(new THREE.Vector3(this.oldplayer.x + i, this.oldplayer.y + j, this.oldplayer.z + k), directionVector.clone().normalize());
                                collisionResults = ray.intersectObjects(this.objects);
                                if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                                    break;
                                }
                            }
                            k += 1;
                        }

                        this.player.position.add(this.oldplayer, new THREE.Vector3(i, j, k));
                        this.camera.position.add(this.player.position, new THREE.Vector3(0, eyeup, debug));
                    }
                    ray = new THREE.Ray(new THREE.Vector3().add(this.player.position, new THREE.Vector3(0, -1, 0)), directionVector.clone().normalize());
                    collisionResults = ray.intersectObjects(this.objects);
                    if (collisionResults.length > 0 && collisionResults[0].distance - directionVector.length() < -1e-6) {
                        input.hold = 1;
                        input.v = 0;
                    }
                    else {
                        input.hold = 0;
                    }
                }
            }

            this.oldplayer.copy(this.player.position);
        }
    }


    this.render = function () {
        this.renderer.render(this.scene, this.camera);
        ++this.numFrames;        
    }


    // ------------------------------------------------------------------------
    // Call init to setup Game object on creation
    // ------------------------------------------------------------------------
    this.init();
}


// ----------------------------------------------------------------------------
// Utility Functions
// TODO: move to utility script
// ----------------------------------------------------------------------------

function generateGeometry (geom, data) {
    var size = data.quadSize, index = 0, i, j;

    // Generate quads in geometry object 
    // for each cell in a data.w*data.h sized grid
    for(i = 0; i < data.w; ++i)
    for(j = 0; j < data.h; ++j, ++index) {
        generateQuad(geom, index,
            { x: size*(i - data.w/2), z: size*(j - data.h/2) }, size);
    }
}

function generateQuad (geom, index, center, width) {
    var quad = [[ -1,  1],
                [  1,  1],
                [  1, -1],
                [ -1, -1]],
        i, v1, v2, v3,
        face = null,
        halfW = width / 2;

    quad.push(quad[0]);

    for(i = 0; i < 4; ++i) { 
        // Generate vertices for this quad
        v1 = new THREE.Vector3(center.x, 0, center.z);
        v2 = new THREE.Vector3(quad[i+0][0] * halfW + center.x, 
                               0, 
                               quad[i+0][1] * halfW + center.z);
        v3 = new THREE.Vector3(quad[i+1][0] * halfW + center.x,
                               0,
                               quad[i+1][1] * halfW + center.z);
        geom.vertices.push(v1);
        geom.vertices.push(v2);
        geom.vertices.push(v3);

        // Generate a face for this quad
        face = new THREE.Face3((i * 3 + 0) + (index * 12), 
                               (i * 3 + 1) + (index * 12),
                               (i * 3 + 2) + (index * 12));
        // Calculate normalized surface normal for this quad
        face.normal = (function () {
            var vx = (v1.y - v3.y)*(v2.z - v3.z) - (v1.z - v3.z)*(v2.y - v3.y),
                vy = (v1.z - v3.z)*(v2.x - v3.x) - (v1.x - v3.x)*(v2.z - v3.z),
                vz = (v1.x - v3.x)*(v2.y - v3.y) - (v1.y - v3.y)*(v2.x - v3.x),
                va = Math.sqrt(vx*vx + vy*vy + vz*vz);
            return new THREE.Vector3(vx/va, vy/va, vz/va);
        }) ();
        geom.faces.push(face);
    }
}
