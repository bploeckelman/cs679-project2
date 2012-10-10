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
    this.objects   = [];
    this.lights    = [];

    // ------------------------------------------------------------------------
    // Private constants ------------------------------------------------------
    // ------------------------------------------------------------------------
    var FOV    = 67,
        ASPECT = canvas.width / canvas.height,
        NEAR   = 1,
        FAR    = 1000;

    // ------------------------------------------------------------------------
    // Game Methods -----------------------------------------------------------
    // ------------------------------------------------------------------------
    this.init = function () {
        var meshGeometry = null;

        console.log("Game initializing...");

        // Setup scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x555555, 150, 300);

        // Setup camera
        this.camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR);
        this.camera.position.set(-30, 20, -30);
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
        // meshGeometry = new THREE.Geometry();
        // generateGeometry(
        //     meshGeometry,
        //     { w: 80, h: 80, quadSize: 16 }
        // );
        // this.objects[1] = new THREE.Mesh(
        //     meshGeometry,
        //     new THREE.MeshBasicMaterial({
        //         color: 0x00aa00,
        //         shading: THREE.FlatShading,
        //         wireframe: true
        //     })
        // );
	
	//I tried to replace the triangle grid with an image
	var geometry = new THREE.PlaneGeometry(1280,1280);
	var texture = THREE.ImageUtils.loadTexture( "images/disturb.jpg" );
	texture.anisotropy = renderer.getMaxAnisotropy();
	var material = new THREE.MeshBasicMaterial( { map: texture } );
	this.objects[1] = new THREE.Mesh(geometry,material);
	this.objects[1].rotation.x = - Math.PI / 2;
        this.scene.add(this.objects[1]);



        console.log("Game initialized.");
    }


    this.update = function (input) {
        var triggerAD = input.trigger.A - input.trigger.D,
            triggerWS = input.trigger.W - input.trigger.S,
            look = new THREE.Vector3(),
            xzNorm;

        // Reorient camera
        if ((input.mouseX - canvas.offsetLeft)/canvas.width<0.2){
            input.center-=0.1*(0.2-(input.mouseX - canvas.offsetLeft)/canvas.width);
        }
        if ((input.mouseX - canvas.offsetLeft)/canvas.width>0.8){
            input.center+=0.1*((input.mouseX - canvas.offsetLeft)/canvas.width-0.8);
        }            
        input.f.z=Math.sin(input.theta)*Math.sin(input.phi+input.center)
        input.f.x=Math.sin(input.theta)*Math.cos(input.phi+input.center);
        input.f.y=Math.cos(input.theta);       

        xzNorm = Math.sqrt(input.f.x*input.f.x + input.f.z*input.f.z);
        this.camera.position.add(
            this.camera.position,
            new THREE.Vector3(
                triggerWS * input.f.x + triggerAD * input.f.z / xzNorm,
                0,//triggerWS * input.f.y,
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

// function generateGeometry (geom, data) {
//     var size = data.quadSize, index = 0, i, j;

//     // Generate quads in geometry object 
//     // for each cell in a data.w*data.h sized grid
//     for(i = 0; i < data.w; ++i)
//     for(j = 0; j < data.h; ++j, ++index) {
//         generateQuad(geom, index,
//             { x: size*(i - data.w/2), z: size*(j - data.h/2) }, size);
//     }
// }

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
