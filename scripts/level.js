var CELL_TYPES = {
    void: ".",
    empty: " ",
    wall: "#",
    door: "+",
    downstairs: "x",
    upstairs: "^",
    light: "o",
    start: "*",
    zomstart: "z"
},
    CELL_SIZE = 32,
    NUM_CELLS = new THREE.Vector2(25, 25),

    CELL_TYPE_KEYS = Object.keys(CELL_TYPES),
    // Pass as last param into THREE.CubeGeometry() = only generate cube sides
    TOPLESS_CUBE = { px: true, nx: true, py: false, ny: false, pz: true, nz: true };

// ----------------------------------------------------------------------------
// Level 
// ----------------------------------------------------------------------------
function Level(numRooms, game) {
    // ------------------------------------------------------------------------
    // Public properties ------------------------------------------------------
    // ------------------------------------------------------------------------
    this.grid = null;
    this.rooms = null;
    this.geometry = {
        floors: [],
        ceils: [],
        doors: [],
        dummies: [] // for rotating doors about their edge instead of center
    };
    this.mapCanvas = null;
    this.mapContext = null;
    this.playerContext = null;
    this.mapColors = {};
    this.startPos = new THREE.Vector2();
    var zombieNumber = 15;
    this.zombiePos = [];

    // Static geometry groups ------------------------
    // Normal walls
    this.wallGroup = new THREE.Object3D();
    this.wallGeometry = new THREE.Geometry();
    // Cubes above doorways
    this.lintelGroup = new THREE.Object3D();
    this.lintelGeometry = new THREE.Geometry();
    // Door post fillers
    this.fillGroup = new THREE.Object3D();
    this.fillGeometry = new THREE.Geometry();


    // ------------------------------------------------------------------------
    // Private constants ------------------------------------------------------
    // ------------------------------------------------------------------------
    var MIN_ROOM_SIZE = 4,
        MAX_ROOM_SIZE = 8,
        MAP_CELL_SIZE = 8,
        DOOR_TIMEOUT = 750, // milliseconds between door toggles
        FLOOR_TEXTURE = THREE.ImageUtils.loadTexture("images/tile.png"),
        CEIL_TEXTURE = THREE.ImageUtils.loadTexture("images/stone.png"),
        WALL_TEXTURE = THREE.ImageUtils.loadTexture("images/brick.png"),
        LINTEL_TEXTURE = THREE.ImageUtils.loadTexture("images/brick.png"),
        DOOR_TEXTURE = THREE.ImageUtils.loadTexture("images/door.png"),
        FILL_TEXTURE = THREE.ImageUtils.loadTexture("images/brown.png");

    LINTEL_TEXTURE.repeat = new THREE.Vector2(1, 2);
    LINTEL_TEXTURE.wrapT = THREE.RepeatWrapping;

    // ------------------------------------------------------------------------
    // Level Methods ----------------------------------------------------------
    // ------------------------------------------------------------------------

    // Generates a new room with a random size within the min/max bounds
    // -----------------------------------------------------------------
    this.createRandomlySizedRoom = function () {
        return new Room(new THREE.Vector2(
            randInt(MIN_ROOM_SIZE, MAX_ROOM_SIZE),
            randInt(MIN_ROOM_SIZE, MAX_ROOM_SIZE)
        ));
    };


    // Add the specified room to the level 
    // if it doesn't intersect existing rooms
    // --------------------------------------
    this.addRoom = function (room) {
        var i, intersects = false;

        // Does room intersect any existing rooms?
        for (i = 0; i < this.rooms.length; ++i) {
            if (room.intersectsRoom(this.rooms[i])) {
                intersects = true;
                break;
            }
        }

        // If it doesn't intersect, add it
        if (!intersects) {
            this.rooms.push(room);
            return true;
        } else {
            return false;
        }
    };


    // Generate randomly sized rooms and try to add them 
    // until one fits, or we've tried too many times
    // -------------------------------------------------
    this.generateRoom = function () {
        var room = this.createRandomlySizedRoom(),
            iter = 200, // max # tries to place room
            r;

        while (iter-- > 0) {
            // Find a position to attach the new room
            r = this.findRoomAttachment(room);

            // Reject out of bound rooms
            if (r.position.x < 0 || r.position.x + room.size.x >= NUM_CELLS.x
             || r.position.y < 0 || r.position.y + room.size.y >= NUM_CELLS.y) {
                continue;
            }

            // Room position is within level bounds, try to add it
            room.pos = r.position;
            if (this.addRoom(room)) {
                break;
            }
        }
    };


    // Generate all the rooms for a level
    // ----------------------------------
    this.generateRooms = function () {
        var iters = 0;

        this.rooms = [];

        // Seed the this with a randomly sized starting room
        room = this.createRandomlySizedRoom();
        room.pos.x = Math.floor(NUM_CELLS.x / 2) - Math.floor(room.size.x / 2);
        room.pos.y = Math.floor(NUM_CELLS.y / 2) - Math.floor(room.size.y / 2);
        this.addRoom(room);

        // Keep generating rooms until...
        while (this.rooms.length < numRooms // they've all been added
            && iters++ < numRooms * 10) {   // and we haven't tried too often 
            this.generateRoom();
        }

        // Put a light in each room
        this.generateLights();

        console.log("Generated " + this.rooms.length + " rooms.");
    };


    // Generate lights in each room of a level
    // ---------------------------------------
    this.generateLights = function () {
        for (i = 0; i < this.rooms.length; ++i) {
            // Add a light at a random location in every room
            x = randInt(1, this.rooms[i].size.x - 1);
            y = randInt(1, this.rooms[i].size.y - 1);
            this.rooms[i].tiles[y][x] = CELL_TYPES.light;
        }
    };


    // Find a position for the specified room next to an existing room
    // ---------------------------------------------------------------
    this.findRoomAttachment = function (room) {
        var pos = new THREE.Vector2(0, 0),
            rm;

        // Pick a random room
        rm = this.rooms[randInt(0, this.rooms.length)];

        // Randomly place this room on a side of the random room
        switch (randInt(0, 4)) {
            case 0: // north
                pos.x = randInt(rm.pos.x - room.size.x + 3, rm.pos.x + rm.size.x - 2);
                pos.y = rm.pos.y - room.size.y + 1;
                break;
            case 1: // south
                pos.x = randInt(rm.pos.x - room.size.x + 3, rm.pos.x + rm.size.x - 2);
                pos.y = rm.pos.y + rm.size.y - 1;
                break;
            case 2: // east
                pos.x = rm.pos.x + rm.size.x - 1;
                pos.y = randInt(rm.pos.y - room.size.y + 3, rm.pos.y + rm.size.y - 2);
                break;
            case 3: // west
                pos.x = rm.pos.x - room.size.x + 1;
                pos.y = randInt(rm.pos.y - room.size.y + 3, rm.pos.y + rm.size.y - 2);
                break;
        }

        // Return the position of the new room and its target room
        return { position: pos, target: rm };
    };


    // Populates grid with rooms
    // -------------------------------------------------------
    this.populateGrid = function () {
        var i, x, y, xx, yy, room;

        // For each room
        for (i = 0; i < this.rooms.length; ++i) {
            room = this.rooms[i];

            // For each cell of the room
            for (y = 0; y < room.size.y; ++y)
                for (x = 0; x < room.size.x; ++x) {
                    // Get associated grid position
                    xx = x + room.pos.x;
                    yy = y + room.pos.y;

                    // If the grid position is valid, 
                    // set the grid type to the room cell type
                    if (xx >= 0 && xx < NUM_CELLS.x
                     && yy >= 0 && yy < NUM_CELLS.y) {
                        this.grid[yy][xx].type = room.tiles[y][x];
                        this.grid[yy][xx].roomIndex = i;
                    }
                }
        }
    };


    // Generate a 2d array of NUM_CELLS.x by NUM_CELLS.y cells
    // -------------------------------------------------------
    this.generateGridCells = function () {
        var x, y;

        this.grid = new Array(NUM_CELLS.y);
        for (y = 0; y < NUM_CELLS.y; ++y) {
            this.grid[y] = new Array(NUM_CELLS.x);
            for (x = 0; x < NUM_CELLS.x; ++x) {
                this.grid[y][x] = new Cell(x, y, CELL_TYPES.void);
            }
        }

        this.state = new Array(NUM_CELLS.y);
        for (y = 0; y < NUM_CELLS.y; ++y) {
            this.state[y] = new Array(NUM_CELLS.x);
            for (x = 0; x < NUM_CELLS.x; ++x) {
                this.state[y][x] = 0;
            }
        }
    };


    // Print the grid layout in ascii format to the console
    // @what -> either "rooms", "grid", or "all"
    // ----------------------------------------------------
    this.debugPrint = function (what) {
        var x, y, str = "";

        if (what === "rooms" || what === "all") {
            // Print individual rooms
            for (x = 0; x < this.rooms.length; ++x) {
                this.rooms[x].debugPrint();
            }
        }
        if (what === "grid" || what === "all") {
            // Print entire grid layout
            for (y = 0; y < NUM_CELLS.y; ++y) {
                for (x = 0; x < NUM_CELLS.x; ++x) {
                    str += this.grid[y][x].type;
                }
                str += "\n";
            }
            console.log(str);
        }
    };


    // Create features in the map
    // --------------------------------
    this.generateFeatures = function () {
        this.addDoors();
        this.addStartPosition();
    };


    // Creates new geometry based on grid layout
    // -----------------------------------------
    this.generateGeometry = function () {
        var x, y, xx, yy, cell;

        for (y = 0; y < NUM_CELLS.y; ++y)
            for (x = 0; x < NUM_CELLS.x; ++x) {
                cell = this.grid[y][x];
                xx = x * CELL_SIZE;
                yy = y * CELL_SIZE;

                // Generate geometry according to cell type
                if (cell.type === CELL_TYPES.void) {
                    continue;
                } else if (cell.type === CELL_TYPES.empty
                        || cell.type === CELL_TYPES.start
                        || cell.type === CELL_TYPES.zomstart) {
                    this.generateFloorGeometry(xx, yy);
                    this.generateCeilingGeometry(xx, yy);
                } else if (cell.type === CELL_TYPES.wall) {
                    this.generateWallGeometry(xx, yy);
                } else if (cell.type === CELL_TYPES.door) {
                    this.generateFloorGeometry(xx, yy);
                    this.generateCeilingGeometry(xx, yy);
                    this.generateDoorGeometry(xx, yy, cell);
                } else if (cell.type === CELL_TYPES.upstairs
                        || cell.type === CELL_TYPES.downstairs) {
                    // TODO: generate different floor + normal ceiling
                } else if (cell.type === CELL_TYPES.light) {
                    // Note: assumes empty floor, not wall
                    this.generateFloorGeometry(xx, yy);
                    this.generateCeilingGeometry(xx, yy);
                    this.generateLight(xx, yy);
                }
            }

        // Create merged geometry groups
        this.wallGroup = new THREE.Mesh(this.wallGeometry, WALL_MATERIAL);
        this.lintelGroup = new THREE.Mesh(this.lintelGeometry, WALL_FULL_MATERIAL);
        this.fillGroup = new THREE.Mesh(this.fillGeometry, FILL_MATERIAL);

        // Add merged geometry groups to game object array
        game.objects.push(this.wallGroup);
        game.objects.push(this.lintelGroup);
        game.objects.push(this.fillGroup);

        // Add merged geometry groups to scene
        game.scene.add(this.wallGroup);
        game.scene.add(this.lintelGroup);
        game.scene.add(this.fillGroup);
    };

    // Generate floor geometry
    // TODO: had problems merging plane geometry...
    // -------------------------------- 
    var PLANE_GEOMETRY = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE),
        FLOOR_MATERIAL = new THREE.MeshLambertMaterial({ map: FLOOR_TEXTURE });

    this.generateFloorGeometry = function (x, y) {
        var mesh = new THREE.Mesh(PLANE_GEOMETRY, FLOOR_MATERIAL);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, 0, y);

        game.objects.push(mesh);
        game.scene.add(mesh);
        this.geometry.floors.push(mesh);
    };

    // Generate ceiling geometry
    // TODO: had problems merging plane geometry...
    // -------------------------------- 
    var CEIL_MATERIAL = new THREE.MeshLambertMaterial({ map: CEIL_TEXTURE });

    this.generateCeilingGeometry = function (x, y) {
        var mesh = new THREE.Mesh(PLANE_GEOMETRY, CEIL_MATERIAL);
        mesh.rotation.x = Math.PI / 2;
        mesh.position.set(x, 2 * CELL_SIZE, y);

        game.objects.push(mesh);
        game.scene.add(mesh);
        this.geometry.ceils.push(mesh);
    };

    // Generate wall geometry
    // --------------------------------
    // TODO: Clean this up...
    var NORMAL_MATERIAL = new THREE.MeshNormalMaterial(),
        WALL_MATERIAL = new THREE.MeshLambertMaterial({ map: LINTEL_TEXTURE }),
        WALL_FULL_MATERIAL = new THREE.MeshLambertMaterial({ map: WALL_TEXTURE }),
        // Geometry -----
        WALL_GEOMETRY = new THREE.CubeGeometry(CELL_SIZE, 2 * CELL_SIZE, CELL_SIZE,
            1, 2, 1, NORMAL_MATERIAL, TOPLESS_CUBE),
        WALL_FULL_GEOMETRY = new THREE.CubeGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE,
            1, 1, 1, NORMAL_MATERIAL,
            { px: true, nx: true, py: false, ny: true, pz: true, nz: true }),
        // Mesh -----
        WALL_MESH = new THREE.Mesh(WALL_GEOMETRY, NORMAL_MATERIAL);

    // Set the material for each face of the wall geometry
    for (var face in WALL_GEOMETRY.faces) {
        WALL_GEOMETRY.faces[face].materialIndex = 0;
    }
    for (var face in WALL_FULL_GEOMETRY.faces) {
        WALL_FULL_GEOMETRY.faces[face].materialIndex = 0;
    }

    this.generateWallGeometry = function (x, y) {
        // Position geometry for the current cell and merge it with the rest 
        WALL_MESH.position.set(x, CELL_SIZE, y);
        THREE.GeometryUtils.merge(this.wallGeometry, WALL_MESH);
    };

    // Generate door cube, correctly oriented, with dummy rotation node
    // ----------------------------------------------------------------
    var LINTEL_MESH = new THREE.Mesh(WALL_FULL_GEOMETRY, NORMAL_MATERIAL),
        FACE_MATERIAL = new THREE.MeshFaceMaterial(),
        FILL_MATERIAL = new THREE.MeshLambertMaterial({ map: FILL_TEXTURE }),
        DOOR_MATERIAL = new THREE.MeshLambertMaterial({ map: DOOR_TEXTURE }),
        DOOR_VERT_FACE_MATERIALS = [
            FILL_MATERIAL, FILL_MATERIAL,
            FILL_MATERIAL, FILL_MATERIAL,
            DOOR_MATERIAL, DOOR_MATERIAL
        ],
        DOOR_HORIZ_FACE_MATERIALS = [
            DOOR_MATERIAL, DOOR_MATERIAL,
            FILL_MATERIAL, FILL_MATERIAL,
            FILL_MATERIAL, FILL_MATERIAL
        ];

    this.generateDoorGeometry = function (x, y, cell) {
        var cubeSizeX = (cell.doorType === "vertical") ? CELL_SIZE / 2 : CELL_SIZE / 16,
            cubeSizeZ = (cell.doorType === "horizontal") ? CELL_SIZE / 2 : CELL_SIZE / 16,
            dummy = new THREE.Object3D(),
            geom = new THREE.CubeGeometry(cubeSizeX, CELL_SIZE, cubeSizeZ,
                    1, 1, 1, (cell.doorType === "vertical")
                    ? DOOR_VERT_FACE_MATERIALS : DOOR_HORIZ_FACE_MATERIALS, TOPLESS_CUBE),
            mesh = new THREE.Mesh(geom, FACE_MATERIAL);

        // Flip u's on the backwards face of the door geometry
        if (cell.doorType === "vertical") {
            for (var i = 0; i < 4; ++i) {
                if (mesh.geometry.faceVertexUvs[0][2][i].u === 1) {
                    mesh.geometry.faceVertexUvs[0][2][i].u = 0;
                } else
                    if (mesh.geometry.faceVertexUvs[0][2][i].u === 0) {
                        mesh.geometry.faceVertexUvs[0][2][i].u = 1;
                    }
            }
        } else if (cell.doorType === "horizontal") {
            for (var i = 0; i < 4; ++i) {
                if (mesh.geometry.faceVertexUvs[0][1][i].u === 1) {
                    mesh.geometry.faceVertexUvs[0][1][i].u = 0;
                } else
                    if (mesh.geometry.faceVertexUvs[0][1][i].u === 0) {
                        mesh.geometry.faceVertexUvs[0][1][i].u = 1;
                    }
            }
        }
        mesh.geometry.computeFaceNormals();
        mesh.name = "door";
        mesh.canToggle = true;
        mesh.doorState = "closed";
        mesh.centerx = x;
        mesh.centerz = y;
        mesh.doorIndex = this.geometry.doors.push(mesh) - 1;
        mesh.position.set(x, CELL_SIZE / 2, y);
        game.objects.push(mesh);
        game.scene.add(mesh);

        // Setup a dummy rotator, Note: this is a bit hacky, but it works
        mesh.dummy = dummy;
        dummy.rotation.y = Math.PI;
        if (cell.doorType === "horizontal") {
            dummy.position.set(
                mesh.position.x,
                mesh.position.y,
                mesh.position.z + CELL_SIZE / 4);
            mesh.position.set(0, 0, CELL_SIZE / 4);
        } else if (cell.doorType === "vertical") {
            dummy.position.set(
                mesh.position.x + CELL_SIZE / 4,
                mesh.position.y,
                mesh.position.z);
            mesh.position.set(CELL_SIZE / 4, 0, 0);
        }
        dummy.add(mesh);
        game.scene.add(dummy);

        // Generate the filler blocks around door
        this.generateDoorFiller(x, y, cell);

        // Generate a wall block above the door and merge it with the rest
        LINTEL_MESH.position.set(x, 1.5 * CELL_SIZE, y);
        THREE.GeometryUtils.merge(this.lintelGeometry, LINTEL_MESH);
    };

    // Generates filler cubes for either side of a door
    // ------------------------------------------------
    var FILLV_GEOMETRY = new THREE.CubeGeometry(
                CELL_SIZE / 4, CELL_SIZE, CELL_SIZE / 2,
                1, 1, 1, NORMAL_MATERIAL, TOPLESS_CUBE),
        FILLH_GEOMETRY = new THREE.CubeGeometry(
                CELL_SIZE / 2, CELL_SIZE, CELL_SIZE / 4,
                1, 1, 1, NORMAL_MATERIAL, TOPLESS_CUBE);

    this.generateDoorFiller = function (x, y, cell) {
        var geom, mesh1, mesh2;

        if (cell.doorType === "vertical") {
            // FILLER #1
            mesh1 = new THREE.Mesh(FILLV_GEOMETRY, NORMAL_MATERIAL);
            mesh1.position.set(x + (CELL_SIZE / 2) - (CELL_SIZE / 8), CELL_SIZE / 2, y);
            // FILLER #2
            mesh2 = new THREE.Mesh(FILLV_GEOMETRY, NORMAL_MATERIAL);
            mesh2.position.set(x - (CELL_SIZE / 2) + (CELL_SIZE / 8), CELL_SIZE / 2, y);
        } else if (cell.doorType === "horizontal") {
            // FILLER #1
            mesh1 = new THREE.Mesh(FILLH_GEOMETRY, NORMAL_MATERIAL);
            mesh1.position.set(x, CELL_SIZE / 2, y + (CELL_SIZE / 2) - (CELL_SIZE / 8));
            // FILLER #2
            mesh2 = new THREE.Mesh(FILLH_GEOMETRY, NORMAL_MATERIAL);
            mesh2.position.set(x, CELL_SIZE / 2, y - (CELL_SIZE / 2) + (CELL_SIZE / 8));
        }

        // Merge the positioned filler geometry in with the rest
        THREE.GeometryUtils.merge(this.fillGeometry, mesh1);
        THREE.GeometryUtils.merge(this.fillGeometry, mesh2);
    };

    // Generate a light in the specified cell
    // --------------------------------------
    this.generateLight = function (x, y) {
        var color, light, mesh;

        // Add a light if we don't already have too many
        if (game.lights.length < MAX_LIGHTS) {
            color = new THREE.Color();
            color.setRGB(
                clamp(Math.random(), 0.3, 1.0),
                clamp(Math.random(), 0.3, 1.0),
                clamp(Math.random(), 0.3, 1.0)
            );
            light = new THREE.PointLight(color.getHex(), 1.0, 100.0);
            light.position.set(x, CELL_SIZE / 2, y);
            game.lights.push(light);
            game.scene.add(light);

            // Add a mesh to represent the light (mostly for debug purposes)
            mesh = new THREE.Mesh(
                new THREE.SphereGeometry(1),
                new THREE.MeshBasicMaterial({ color: color })
            );
            mesh.position.set(x, CELL_SIZE / 2, y);
            game.scene.add(mesh);
        } else {
            console.warn("Unable to add light, already at max # of lights");
        }
    };


    // Toggle the specified door open or closed
    // ----------------------------------------
    this.toggleDoor = function (index) {
        if (index < 0 || index >= this.geometry.doors.length) {
            console.warn("Warning: attempted to toggle non-existent door");
            return;
        }

        var door = this.geometry.doors[index], tween;
        if (door.doorState === "closed" && door.canToggle) {
            this.state[door.centerz / CELL_SIZE][door.centerx / CELL_SIZE] = 1;
            tween = new TWEEN.Tween({ rot: Math.PI })
                .to({ rot: Math.PI / 2 }, DOOR_TIMEOUT)
                .easing(TWEEN.Easing.Elastic.Out)
                .onUpdate(function () {
                    door.dummy.rotation.y = this.rot;
                })
                .start();

            door.doorState = "open";
            door.canToggle = false;

            setTimeout(function () {
                door.canToggle = true;
            }, DOOR_TIMEOUT);
        } else if (door.doorState === "open" && door.canToggle) {
            this.state[door.centerz / CELL_SIZE][door.centerx / CELL_SIZE] = 0;
            tween = new TWEEN.Tween({ rot: Math.PI / 2 })
                .to({ rot: Math.PI }, DOOR_TIMEOUT)
                .easing(TWEEN.Easing.Elastic.Out)
                .onUpdate(function () {
                    door.dummy.rotation.y = this.rot;
                })
                .start();

            door.doorState = "closed";
            door.canToggle = false;

            setTimeout(function () {
                door.canToggle = true;
            }, DOOR_TIMEOUT);
        }
    };


    // Add randomized starting location for player
    // -------------------------------------------
    this.addStartPosition = function () {
        var x, y;

        while (true) {
            x = randInt(1, NUM_CELLS.x - 1);
            y = randInt(1, NUM_CELLS.y - 1);
            if (this.grid[y][x].type === CELL_TYPES.empty) {
                this.grid[y][x].type = CELL_TYPES.start;
                this.startPos = new THREE.Vector2(x * CELL_SIZE, y * CELL_SIZE);
                break;
            }
        }

        while (this.zombiePos.length < zombieNumber) {
            x = randInt(1, NUM_CELLS.x - 1);
            y = randInt(1, NUM_CELLS.y - 1);
            if (this.grid[y][x].type === CELL_TYPES.empty) {
                this.grid[y][x].type = CELL_TYPES.zomstart;
                this.zombiePos.push(new THREE.Vector2(x * CELL_SIZE, y * CELL_SIZE));
            }
        }
    };


    // Add doors to the map
    // --------------------------------
    this.addDoors = function () {
        var x, y, cell, cellA, cellB;

        for (y = 2; y < NUM_CELLS.y - 2; ++y)
            for (x = 2; x < NUM_CELLS.x - 2; ++x) {
                cell = this.grid[y][x];

                if (cell.type === CELL_TYPES.wall) {
                    // Get neighbor cells
                    celly1 = this.grid[y - 1][x];
                    celly2 = this.grid[y + 1][x];
                    celly3 = this.grid[y - 2][x];
                    celly4 = this.grid[y + 2][x];

                    cellx1 = this.grid[y][x - 1];
                    cellx2 = this.grid[y][x + 1];
                    cellx3 = this.grid[y][x - 2];
                    cellx4 = this.grid[y][x + 2];

                    // If no neighbor cell is a door...
                    if (celly1.type !== CELL_TYPES.door && celly2.type !== CELL_TYPES.door
                     && celly3.type !== CELL_TYPES.door && celly4.type !== CELL_TYPES.door
                     && cellx1.type !== CELL_TYPES.door && cellx2.type !== CELL_TYPES.door
                     && cellx3.type !== CELL_TYPES.door && cellx4.type !== CELL_TYPES.door) {
                        // If both immediate y neighbors are interior cells...
                        if (celly1.isInterior() && celly2.isInterior()) {
                            // Found a potential door!, add location to the list
                            console.log("Potential door @ (" + x + "," + y + ")");
                            cell.type = CELL_TYPES.door;
                            cell.doorType = "vertical";
                            continue;
                        }
                        // If both immediate x neighbors are interior cells...
                        if (cellx1.isInterior() && cellx2.isInterior()) {
                            // Found a potential door!, add location to the list
                            console.log("Potential door @ (" + x + "," + y + ")");
                            cell.type = CELL_TYPES.door;
                            cell.doorType = "horizontal";
                            continue;
                        }
                    }
                }
            }
    };


    // Generate minimap using a 2d canvas
    // ----------------------------------
    this.generateMinimap = function () {
        var mainCanvas = document.getElementById("canvas");

        // Create and position the map canvas, then add it to the document
        mapCanvas = document.createElement("canvas");
        mapCanvas.id = "minimap";
        mapCanvas.style.position = "absolute";
        mapCanvas.width = MAP_CELL_SIZE * NUM_CELLS.x;
        mapCanvas.height = MAP_CELL_SIZE * NUM_CELLS.y;
        // TODO: have to handle window resizing
        mapCanvas.style.bottom = 0;
        mapCanvas.style.right = 0;
        document.getElementById("container").appendChild(mapCanvas);

        // Save the 2d context for this canvas
        mapContext = mapCanvas.getContext("2d");

        // Setup colors for each cell type
        this.mapColors.void = "#202020";
        this.mapColors.empty = "#000000";
        this.mapColors.wall = "#c0c0c0";
        this.mapColors.door = "#00ffff";
        this.mapColors.upstairs = "#a000a0";
        this.mapColors.downstairs = "#200020";
        this.mapColors.light = "#aaaa00";
        this.mapColors.start = "#00ff00";
    };

    this.generateInformation = function () {
        var mainCanvas = document.getElementById("canvas");

        // Create and position the information, then add it to the document
        playerInfo = document.createElement("canvas");
        playerInfo.id = "info";
        playerInfo.style.position = "absolute";
        playerInfo.width = canvas.width * 0.95;
        playerInfo.height = canvas.height * 0.22;
        // TODO: have to handle window resizing
        playerInfo.style.bottom = 0;
        playerInfo.style.right = 0;
        document.getElementById("container").appendChild(playerInfo);

        // Save the 2d context for this canvas
        playerContext = playerInfo.getContext("2d");
    }

    // Update minimap
    // --------------------------------
    this.updateMinimap = function () {
        var i, x, y, xx, yy, px, py, zx, zy, cell, color, occupied;

        // Calculate the player's position on the minimap
        px = Math.floor(game.player.position.x / CELL_SIZE * MAP_CELL_SIZE) + MAP_CELL_SIZE / 2;
        py = Math.floor(game.player.position.z / CELL_SIZE * MAP_CELL_SIZE) + MAP_CELL_SIZE / 2;
        // Get the room index of the currently occupied cell
        occupied = this.grid[Math.floor(py / MAP_CELL_SIZE)]
                            [Math.floor(px / MAP_CELL_SIZE)].roomIndex;

        // Clear the map
        mapContext.save();
        mapContext.setTransform(1, 0, 0, 1, 0, 0);
        mapContext.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
        mapContext.restore();

        // Blend the map a bit
        mapContext.globalAlpha = 0.5;

        // Draw the map cells
        for (y = 0; y < NUM_CELLS.y; ++y)
            for (x = 0; x < NUM_CELLS.x; ++x) {
                cell = this.grid[y][x];
                xx = x * MAP_CELL_SIZE;
                yy = y * MAP_CELL_SIZE;

                // This is sorta hacky, but it works...
                switch (cell.type) {
                    case CELL_TYPES.void: color = this.mapColors.void; break;
                    case CELL_TYPES.empty: color = this.mapColors.empty; break;
                    case CELL_TYPES.wall: color = this.mapColors.wall; break;
                    case CELL_TYPES.door: color = this.mapColors.door; break;
                    case CELL_TYPES.upstairs: color = this.mapColors.upstairs; break;
                    case CELL_TYPES.downstairs: color = this.mapColors.downstairs; break;
                    case CELL_TYPES.light: color = this.mapColors.light; break;
                    case CELL_TYPES.start: color = this.mapColors.start; break;
                }

                // Light up all the interior cells of the room the player is currently in
                if (cell.roomIndex === occupied && cell.isInterior()) {
                    mapContext.globalAlpha = 1.0;
                    mapContext.fillStyle = "#ffff22";
                    mapContext.fillRect(xx, yy, MAP_CELL_SIZE, MAP_CELL_SIZE);
                    mapContext.globalAlpha = 0.5;
                    continue;
                }

                if (cell.type !== CELL_TYPES.void && cell.type !== CELL_TYPES.start && cell.type !== CELL_TYPES.zomstart) {
                    mapContext.fillStyle = color;
                    mapContext.fillRect(xx, yy, MAP_CELL_SIZE, MAP_CELL_SIZE);
                }
            }

        // Draw the player
        mapContext.beginPath();
        mapContext.strokeStyle = "#ff0000";
        mapContext.lineWidth = 3;
        mapContext.arc(px, py, 3, 0, 2 * Math.PI, false);
        mapContext.stroke();

        // Draw the zombie
        mapContext.strokeStyle = "#0000ff";
        mapContext.lineWidth = 3;
        for (var z = 0; z < zombieNumber; z++) {
            mapContext.beginPath();
            zx = Math.floor(game.zombie[z].mesh.position.x / CELL_SIZE * MAP_CELL_SIZE) + MAP_CELL_SIZE / 2;
            zy = Math.floor(game.zombie[z].mesh.position.z / CELL_SIZE * MAP_CELL_SIZE) + MAP_CELL_SIZE / 2;
            mapContext.arc(zx, zy, 3, 0, 2 * Math.PI, false);
            mapContext.stroke();
        }
    };

    // Update player
    // --------------------------------
    this.updatePlayer = function () {
        // Clear the map
        playerContext.save();
        playerContext.setTransform(1, 0, 0, 1, 0, 0);
        playerContext.clearRect(0, 0, playerInfo.width, playerInfo.height);
        playerContext.restore();

        // Blend the map a bit
        playerContext.globalAlpha = 0.5;
        playerContext.strokeStyle = "#ff7f00";
        playerContext.font = '40px Arial';
        playerContext.textBaseline = 'middle';
        playerContext.textAlign = 'center';
        playerContext.strokeText("Health:", playerInfo.width * 1.5 / 20, playerInfo.height / 1.5);
        playerContext.strokeText(game.player.health.toString(), playerInfo.width * 3 / 20, playerInfo.height / 1.5);
        playerContext.strokeText("Armor:", playerInfo.width * 5.5 / 20, playerInfo.height / 1.5);
        playerContext.strokeText(game.player.armor.toString(), playerInfo.width * 7 / 20, playerInfo.height / 1.5);
        playerContext.strokeText("Time:", playerInfo.width * 9.5 / 20, playerInfo.height / 1.5);
        playerContext.strokeText("0", playerInfo.width * 11 / 20, playerInfo.height / 1.5);
        playerContext.strokeText("Ammo:", playerInfo.width * 13.5 / 20, playerInfo.height / 1.5);
        playerContext.strokeText(game.player.ammo.toString(), playerInfo.width * 15 / 20, playerInfo.height / 1.5);
    };


    // Update this level
    // --------------------------------
    this.update = function () {
        // Update dynamic stuff
        this.updateMinimap();
        this.updatePlayer();

        // Draw the player's healthbar
        // TODO: use another 2d canvas for gui stuff like this, like the minimap
        //var healthText = document.getElementById("healthbar");
        //healthText.innerText = "player health: " + game.player.health + "%";
    };



    // ------------------------------------------------------------------------
    // Populates this room object on creation
    // ------------------------------------------------------------------------
    (function generate(level, numRooms) {
        console.info("Generating level...");
        level.generateGridCells();
        level.generateRooms();
        level.populateGrid();
        level.generateFeatures();
        level.generateMinimap();
        level.generateInformation();
        level.generateGeometry();
        console.info("Level generation completed.");

        level.debugPrint("grid");
    })(this, numRooms);

} // end Level object 


// ----------------------------------------------------------------------------
// Cell  
// ----------------------------------------------------------------------------
function Cell(x, y, type) {
    this.index = new THREE.Vector2(x, y);
    this.type = type;
    this.doorType = null;


    this.isInterior = function () {
        // Don't include stairs, as they don't belong next to a door 
        return (this.type === CELL_TYPES.empty
             || this.type === CELL_TYPES.light || this.type === CELL_TYPES.start || this.type === CELL_TYPES.zomstart);
    };
}


// ----------------------------------------------------------------------------
// Room
// ----------------------------------------------------------------------------
function Room(size) {
    this.size = size;
    this.pos = new THREE.Vector2(0, 0);
    this.tiles = null;


    // Initialize this room with walls surrounding empty space
    // -------------------------------------------------------
    (function init(room) {
        var x, y, row;

        room.tiles = new Array(room.size.y);
        for (y = 0; y < room.size.y; ++y) {
            row = new Array(room.size.x);
            for (x = 0; x < room.size.x; ++x) {
                if (y === 0 || y === room.size.y - 1
                 || x === 0 || x === room.size.x - 1) {
                    row[x] = CELL_TYPES.wall;
                } else {
                    row[x] = CELL_TYPES.empty;
                }
            }
            room.tiles[y] = row;
        }
    })(this);


    // Does this room intersect the specified room?
    // --------------------------------------------
    this.intersectsRoom = function (room) {
        // The +/- 1's are to allow overlapping walls
        return !(this.left() > room.right() - 1
              || this.right() < room.left() + 1
              || this.top() > room.bottom() - 1
              || this.bottom() < room.top() + 1);
    };


    // Are there stairs anywhere in this room?
    // ---------------------------------------
    this.hasStairs = function () {
        var x, y;
        for (y = 0; y < this.size.y; ++y)
            for (x = 0; x < this.size.x; ++x) {
                if (this.tiles[y][x] === CELL_TYPES.upstairs
                 || this.tiles[y][x] === CELL_TYPES.downstairs) {
                    return true;
                }
            }
        return false;
    };


    // Find and return all door positions
    // ----------------------------------
    this.getDoorLocations = function () {
        var doors = [];
        for (y = 0; y < this.size.y; ++y)
            for (x = 0; x < this.size.x; ++x) {
                if (this.tiles[y][x] === CELL_TYPES.door) {
                    doors.push(new THREE.Vector2(x, y));
                }
            }
        return doors;
    };


    // Print the layout of this room to the console
    // --------------------------------------------
    this.debugPrint = function () {
        var str = "Room: "
                + "pos(" + this.pos.x + "," + this.pos.y + ") "
                + "size(" + this.size.x + "," + this.size.y + ") "
                + "lrtb(" + this.left() + "," + this.right()
                + "," + this.top() + "," + this.bottom() + ")\n",
            x, y;
        for (y = 0; y < this.tiles.length; ++y) {
            if (y != 0) { str += "\n"; }
            for (x = 0; x < this.tiles[0].length; ++x) {
                str += this.tiles[y][x];
            }
        }
        console.log(str);
    };


    // Some helpers to get bounds of room
    // ----------------------------------
    this.left = function () { return this.pos.x; };
    this.right = function () { return this.pos.x + this.size.x - 1; };
    this.top = function () { return this.pos.y; };
    this.bottom = function () { return this.pos.y + this.size.y - 1; };

} // end Room object

