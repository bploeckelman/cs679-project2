var CELL_TYPES = { 
        void: ".",
        empty: " ",
        wall: "#",
        door: "+",
        downstairs: "x",
        upstairs: "^",
        light: "o",
        start: "*"
    },
    CELL_TYPE_KEYS = Object.keys(CELL_TYPES);

// ----------------------------------------------------------------------------
// Level 
// ----------------------------------------------------------------------------
function Level (numRooms, game) {
    // ------------------------------------------------------------------------
    // Public properties ------------------------------------------------------
    // ------------------------------------------------------------------------
    this.grid  = null;
    this.rooms = null;
    this.geometry = {
        floors: [],
        ceils: [],
        walls: [],
        doors: [],
        dummies: [] // for rotating doors about their edge instead of center
    };
    this.mapCanvas  = null;
    this.mapContext = null;
    this.mapColors = {};
    this.startPos  = new THREE.Vector2();


    // ------------------------------------------------------------------------
    // Private constants ------------------------------------------------------
    // ------------------------------------------------------------------------
    var CELL_SIZE = 32,
        NUM_CELLS = new THREE.Vector2(20, 20),
        MIN_ROOM_SIZE = 4,
        MAX_ROOM_SIZE = 8,
        MAP_CELL_SIZE = 8,
        DOOR_TIMEOUT  = 200, // milliseconds between door toggles
        FLOOR_TEXTURE = THREE.ImageUtils.loadTexture("images/tile.png"),
        CEIL_TEXTURE  = THREE.ImageUtils.loadTexture("images/stone.png"),
        WALL_TEXTURE  = THREE.ImageUtils.loadTexture("images/brick.png"),
        DOOR_TEXTURE  = THREE.ImageUtils.loadTexture("images/door.png"),
        FILL_TEXTURE = THREE.ImageUtils.loadTexture("images/brown.png");


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
        for(i = 0; i < this.rooms.length; ++i) {
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
            || iters++ < numRooms * 10) {   // and we haven't tried too often 
            this.generateRoom();
        }

        // Put a light in each room
        this.generateLights();

        console.log("Generated " + this.rooms.length + " rooms.");
    };


    // Generate lights in each room of a level
    // ---------------------------------------
    this.generateLights = function () {
        for(i = 0; i < this.rooms.length; ++i) {
            // Add a light at a random location in every room
            x = randInt(1, this.rooms[i].size.x - 1);
            y = randInt(1, this.rooms[i].size.y - 1);
            this.rooms[i].tiles[y][x] = CELL_TYPES.light;
        }
    };


    // Find a position for the specified room next to an existing room
    // ---------------------------------------------------------------
    this.findRoomAttachment = function (room) {
        var pos = new THREE.Vector2(0,0),
            rm;

        // Pick a random room
        rm = this.rooms[randInt(0, this.rooms.length)];

        // Randomly place this room on a side of the random room
        switch (randInt(0,4)) {
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
        for(i = 0; i < this.rooms.length; ++i) {
            room = this.rooms[i];

            // For each cell of the room
            for(y = 0; y < room.size.y; ++y)
            for(x = 0; x < room.size.x; ++x) {
                // Get associated grid position
                xx = x + room.pos.x;
                yy = y + room.pos.y;

                // If the grid position is valid, 
                // set the grid type to the room cell type
                if (xx >= 0 && xx < NUM_CELLS.x
                 && yy >= 0 && yy < NUM_CELLS.y) {
                    this.grid[yy][xx].type = room.tiles[y][x];                    
                }
            }
        }
    };


    // Generate a 2d array of NUM_CELLS.x by NUM_CELLS.y cells
    // -------------------------------------------------------
    this.generateGridCells = function () {
        var x, y;

        this.grid = new Array(NUM_CELLS.y);
        for(y = 0; y < NUM_CELLS.y; ++y) {
            this.grid[y] = new Array(NUM_CELLS.x);
            for(x = 0; x < NUM_CELLS.x; ++x) {
                this.grid[y][x] = new Cell(x, y, CELL_TYPES.void);
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
            for(x = 0; x < this.rooms.length; ++x) {
                this.rooms[x].debugPrint();
            }
        }
        if (what === "grid" || what === "all") {
            // Print entire grid layout
            for(y = 0; y < NUM_CELLS.y; ++y) {
                for(x = 0; x < NUM_CELLS.x; ++x) {
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

        for(y = 0; y < NUM_CELLS.y; ++y)
        for(x = 0; x < NUM_CELLS.x; ++x) {
            cell = this.grid[y][x];
            xx = x * CELL_SIZE;
            yy = y * CELL_SIZE;

            // Generate geometry according to cell type
            if (cell.type === CELL_TYPES.void) {
                continue;
            } else if (cell.type === CELL_TYPES.empty
                    || cell.type === CELL_TYPES.start) {
                this.generateFloorGeometry(xx, yy, game);
                this.generateCeilingGeometry(xx, yy, game);
            } else if (cell.type === CELL_TYPES.wall) {
                this.generateWallGeometry(xx, yy, game);
            } else if (cell.type === CELL_TYPES.door) {
                this.generateFloorGeometry(xx, yy, game);
                this.generateCeilingGeometry(xx, yy, game);
                this.generateDoorGeometry(xx, yy, game, cell);
            } else if (cell.type === CELL_TYPES.upstairs 
                    || cell.type === CELL_TYPES.downstairs) {
                // TODO: generate different floor + normal ceiling
            } else if (cell.type === CELL_TYPES.light) {
                // Note: assumes empty floor, not wall
                this.generateFloorGeometry(xx, yy, game);
                this.generateCeilingGeometry(xx, yy, game);
                this.generateLight(xx, yy, game);

            }
        }
    };

    // Generate floor geometry
    // -------------------------------- 
    this.generateFloorGeometry = function (x, y, game) {
        var mesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE),
                    new THREE.MeshLambertMaterial({ map: FLOOR_TEXTURE }) );
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, 0, y);

        game.objects.push(mesh);
        game.scene.add(mesh);
        this.geometry.floors.push(mesh);
    };

    // Generate ceiling geometry
    // -------------------------------- 
    this.generateCeilingGeometry = function (x, y, game) {
        var mesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE),
                    new THREE.MeshLambertMaterial({ map: CEIL_TEXTURE }) );
        mesh.rotation.x = Math.PI / 2;
        mesh.position.set(x, CELL_SIZE, y);

        game.objects.push(mesh);
        game.scene.add(mesh);
        this.geometry.ceils.push(mesh);
    };

    // Generate wall geometry
    // --------------------------------
    this.generateWallGeometry = function (x, y, game) {
        // TODO: figure out if this is a shared wall and 
        //       generate only the required geometry 
        // NOTE: three.js CubeGeometry c'tor takes args
        //       that specify which sides to create! 
        //       (and different materials can be applied to each side)
        // For now, take the easy way out and just generate a full cube
        var mesh = new THREE.Mesh(
                    new THREE.CubeGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE),
                    new THREE.MeshLambertMaterial({ map: WALL_TEXTURE }) );
        //geom.computeTangents();
        mesh.geometry.computeFaceNormals();
        mesh.position.set(x, CELL_SIZE / 2, y);

        game.objects.push(mesh);
        game.scene.add(mesh);
        this.geometry.walls.push(mesh);
    };

    // Generate door cube, correctly oriented, with dummy rotation node
    // ----------------------------------------------------------------
    this.generateDoorGeometry = function (x, y, game, cell) {
        var cubeSizeX = (cell.doorType === "vertical") ? CELL_SIZE / 2 : CELL_SIZE / 16,
            cubeSizeZ = (cell.doorType === "horizontal") ? CELL_SIZE / 2 : CELL_SIZE / 16,
            dummy = new THREE.Object3D(),
            mesh = new THREE.Mesh(
                    new THREE.CubeGeometry(cubeSizeX, CELL_SIZE, cubeSizeZ),
                    new THREE.MeshLambertMaterial({ map: DOOR_TEXTURE }) );
            CELL_SIZE,
        mesh.geometry.computeFaceNormals();
        mesh.name      = "door";
        mesh.canToggle = true;
        mesh.doorState = "closed";
        mesh.doorIndex = this.geometry.doors.push(mesh) - 1;
        mesh.position.set(x, CELL_SIZE / 2, y);

        game.objects.push(mesh);
        game.scene.add(mesh);

        // Setup a dummy rotator, Note: this is a bit hacky, but it works
        mesh.dummy = dummy;
        dummy.rotation.y = Math.PI;
        if (cell.doorType === "horizontal") {
            dummy.position.set(
                mesh.position.x + CELL_SIZE / 4,
                mesh.position.y,
                mesh.position.z);
            mesh.position.set(CELL_SIZE / 4, 0, 0);
        } else if (cell.doorType === "vertical") {
            dummy.position.set(
                mesh.position.x,
                mesh.position.y,
                mesh.position.z + CELL_SIZE / 4);
            mesh.position.set(0, 0, CELL_SIZE / 4);
        }
        dummy.add(mesh);
        game.scene.add(dummy);

        // Generate the filler blocks around door
        this.generateDoorFiller(x, y, game, cell);
    };

    // Generates filler cubes for either side of a door
    // ------------------------------------------------
    this.generateDoorFiller = function (x, y, game, cell) {
        var geom, mesh1, mesh2;

        if (cell.doorType === "vertical") {
            // FILLER #1
            mesh1 = new THREE.Mesh(
                new THREE.CubeGeometry(CELL_SIZE / 4, CELL_SIZE, CELL_SIZE / 2),
                new THREE.MeshLambertMaterial({ map: FILL_TEXTURE }) );
            mesh1.position.set(
                x + (CELL_SIZE / 2) - (CELL_SIZE / 8),
                CELL_SIZE / 2,
                y );
            // FILLER #2
            mesh2 = new THREE.Mesh(
                new THREE.CubeGeometry(CELL_SIZE / 4, CELL_SIZE, CELL_SIZE / 2),
                new THREE.MeshLambertMaterial({ map: FILL_TEXTURE }) );
            mesh2.position.set(
                x - (CELL_SIZE / 2) + (CELL_SIZE / 8),
                CELL_SIZE / 2,
                y );
        } else if (cell.doorType === "horizontal") {
            // FILLER #1
            mesh1 = new THREE.Mesh(
                new THREE.CubeGeometry(CELL_SIZE / 2, CELL_SIZE, CELL_SIZE / 4),
                new THREE.MeshLambertMaterial({ map: FILL_TEXTURE }) );
            mesh1.position.set(
                x,
                CELL_SIZE / 2,
                y + (CELL_SIZE / 2) - (CELL_SIZE / 8) );
            // FILLER #2
            mesh2 = new THREE.Mesh(
                new THREE.CubeGeometry(CELL_SIZE / 2, CELL_SIZE, CELL_SIZE / 4),
                new THREE.MeshLambertMaterial({ map: FILL_TEXTURE }) );
            mesh2.position.set(
                x,
                CELL_SIZE / 2,
                y - (CELL_SIZE / 2) + (CELL_SIZE / 8) );
        }

        mesh1.geometry.computeFaceNormals();
        mesh2.geometry.computeFaceNormals();
        game.objects.push(mesh1, mesh2);
        game.scene.add(mesh1);
        game.scene.add(mesh2);
        this.geometry.walls.push(mesh1, mesh2);
    };

    // Generate a light in the specified cell
    // --------------------------------------
    this.generateLight = function (x, y, game) {
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

        var door = this.geometry.doors[index];
        if (door.doorState === "closed" && door.canToggle) {
            door.dummy.rotation.y = Math.PI / 2;
            door.doorState = "open";
            door.canToggle = false;
            setTimeout(function () {
                door.canToggle = true;
            }, DOOR_TIMEOUT);
        } else if (door.doorState === "open" && door.canToggle) {
            door.dummy.rotation.y = Math.PI;
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
                this.grid[y][x].type === CELL_TYPES.start;
                this.startPos = new THREE.Vector2(x * CELL_SIZE, y * CELL_SIZE);
                break;
            }
        }
    };


    // Add doors to the map
    // --------------------------------
    this.addDoors = function () {
        var x, y, cell, cellA, cellB;

        for(y = 1; y < NUM_CELLS.y - 1; ++y)
        for(x = 1; x < NUM_CELLS.x - 1; ++x) { 
            cell = this.grid[y][x];

            if (cell.type === CELL_TYPES.wall) {
                cellA = this.grid[y - 1][x];
                cellB = this.grid[y + 1][x];
                if (cellA.isInterior() && cellB.isInterior()) {
                    // Found a potential door!, add location to the list
                    console.log("Potential door @ (" + x + "," + y + ")");
                    cell.type = CELL_TYPES.door;
                    cell.doorType = "vertical";
                    // TODO
                    continue;
                }
                cellA = this.grid[y][x - 1];
                cellB = this.grid[y][x + 1];
                if (cellA.isInterior() && cellB.isInterior()) {
                    // Found a potential door!, add location to the list
                    console.log("Potential door @ (" + x + "," + y + ")");
                    cell.type = CELL_TYPES.door;
                    cell.doorType = "horizontal";
                    // TODO
                    continue;
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
        mapCanvas.width  = MAP_CELL_SIZE * NUM_CELLS.x;
        mapCanvas.height = MAP_CELL_SIZE * NUM_CELLS.y;
        // TODO: have to handle window resizing
        mapCanvas.style.top  = (mainCanvas.height - mapCanvas.height + 12) + "px";
        mapCanvas.style.left = (mainCanvas.width  - 20) + "px";
        document.getElementById("container").appendChild(mapCanvas);

        // Save the 2d context for this canvas
        mapContext = mapCanvas.getContext("2d");

        // Setup colors for each cell type
        this.mapColors.void       = "#202020";
        this.mapColors.empty      = "#000000";
        this.mapColors.wall       = "#c0c0c0";
        this.mapColors.door       = "#00ffff";
        this.mapColors.upstairs   = "#a000a0";
        this.mapColors.downstairs = "#200020";
        this.mapColors.light      = "#aaaa00";
        this.mapColors.start      = "#00ff00";
    };


    // Update minimap
    // --------------------------------
    this.updateMinimap = function () {
        var i, x, y, xx, yy, px, py, cell, color;

        // Clear the map
        mapContext.save();
        mapContext.setTransform(1, 0, 0, 1, 0, 0);
        mapContext.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
        mapContext.restore();

        // Blend the map a bit
        mapContext.globalAlpha = 0.5;

        // Draw the map cells
        for(y = 0; y < NUM_CELLS.y; ++y)
        for(x = 0; x < NUM_CELLS.x; ++x) {
            cell = this.grid[y][x]; 
            xx = x * MAP_CELL_SIZE;
            yy = y * MAP_CELL_SIZE;

            // This is sorta hacky, but it works...
            switch (cell.type) {
                case CELL_TYPES.void:       color = this.mapColors.void;       break;
                case CELL_TYPES.empty:      color = this.mapColors.empty;      break;
                case CELL_TYPES.wall:       color = this.mapColors.wall;       break;
                case CELL_TYPES.door:       color = this.mapColors.door;       break;
                case CELL_TYPES.upstairs:   color = this.mapColors.upstairs;   break;
                case CELL_TYPES.downstairs: color = this.mapColors.downstairs; break;
                case CELL_TYPES.light:      color = this.mapColors.light;      break;
                case CELL_TYPES.start:      color = this.mapColors.start;      break;
            }

            if (cell.type !== CELL_TYPES.void) {
                mapContext.fillStyle = color;
                mapContext.fillRect(xx, yy, MAP_CELL_SIZE, MAP_CELL_SIZE);
            }
        }

        // Calculate the player's position on the minimap
        px = Math.floor(game.player.position.x / CELL_SIZE * MAP_CELL_SIZE) + MAP_CELL_SIZE / 2;
        py = Math.floor(game.player.position.z / CELL_SIZE * MAP_CELL_SIZE) + MAP_CELL_SIZE / 2;
        //console.log("player map pos = (" + px + "," + py + ")");

        // Draw the player
        mapContext.beginPath();
        mapContext.strokeStyle = "#ff0000";
        mapContext.lineWidth = 4;
        mapContext.arc(px, py, 3, 0, 2 * Math.PI, false);
        mapContext.stroke();
    };


    // Update this level
    // --------------------------------
    this.update = function () {
        this.updateMinimap();
        // TODO: update any other dynamic stuff
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
        level.generateGeometry();
        console.info("Level generation completed.");

        level.debugPrint("grid");
    }) (this, numRooms);

} // end Level object 


// ----------------------------------------------------------------------------
// Cell  
// ----------------------------------------------------------------------------
function Cell(x, y, type) {
    this.index = new THREE.Vector2(x,y);
    this.type = type;
    this.doorType = null;


    this.isInterior = function () {
        // Don't include stairs, as they don't belong next to a door 
        return (this.type === CELL_TYPES.empty
             || this.type === CELL_TYPES.light);
    };
}


// ----------------------------------------------------------------------------
// Room
// ----------------------------------------------------------------------------
function Room (size) {
    this.size  = size;
    this.pos   = new THREE.Vector2(0,0);
    this.tiles = null;


    // Initialize this room with walls surrounding empty space
    // -------------------------------------------------------
    (function init (room) {
        var x, y, row;

        room.tiles = new Array(room.size.y);
        for(y = 0; y < room.size.y; ++y) {
            row = new Array(room.size.x);
            for(x = 0; x < room.size.x; ++x) {
                if (y === 0 || y === room.size.y - 1
                 || x === 0 || x === room.size.x - 1) {
                    row[x] = CELL_TYPES.wall;
                } else {
                    row[x] = CELL_TYPES.empty;
                }
            }
            room.tiles[y] = row;
        }
    }) (this);


    // Does this room intersect the specified room?
    // --------------------------------------------
    this.intersectsRoom = function (room) {
        // The +/- 1's are to allow overlapping walls
        return !(this.left()   > room.right() - 1
              || this.right()  < room.left() + 1
              || this.top()    > room.bottom() - 1
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
               doors.push(new THREE.Vector2(x,y));
            }
        }
        return doors;
    };


    // Print the layout of this room to the console
    // --------------------------------------------
    this.debugPrint = function () {
        var str = "Room: "
                + "pos("+this.pos.x+","+this.pos.y+") "
                + "size("+this.size.x+","+this.size.y+") "
                + "lrtb("+this.left()+","+this.right()
                +     ","+this.top()+","+this.bottom()+")\n",
            x, y;
        for(y = 0; y < this.tiles.length; ++y) {
            if (y != 0) { str += "\n"; }
            for(x = 0; x < this.tiles[0].length; ++x) {
                str += this.tiles[y][x];
            }
        }
        console.log(str);
    };


    // Some helpers to get bounds of room
    // ----------------------------------
    this.left   = function () { return this.pos.x; };
    this.right  = function () { return this.pos.x + this.size.x - 1; };
    this.top    = function () { return this.pos.y; };
    this.bottom = function () { return this.pos.y + this.size.y - 1; };

} // end Room object

