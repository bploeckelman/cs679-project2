var CELL_TYPES = { 
        void: ".",
        empty: " ",
        wall: "#",
        door: "+",
        downstairs: "x",
        upstairs: "^"
    },
    CELL_TYPE_KEYS = Object.keys(CELL_TYPES);

// ----------------------------------------------------------------------------
// Level 
// ----------------------------------------------------------------------------
function Level (numRooms, scene) {
    // ------------------------------------------------------------------------
    // Public properties ------------------------------------------------------
    // ------------------------------------------------------------------------
    this.grid  = null;
    this.rooms = null;
    this.scene = scene;
    this.geometry = {
        floors: [],
        ceils: [],
        walls: []
    };


    // ------------------------------------------------------------------------
    // Private constants ------------------------------------------------------
    // ------------------------------------------------------------------------
    var CELL_SIZE = 32,
        NUM_CELLS = new THREE.Vector2(20, 20),
        MIN_ROOM_SIZE = 4,
        MAX_ROOM_SIZE = 8;


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
    // TODO: this is a hack
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

    
    // Creates new geometry based on grid layout
    // -----------------------------------------
    this.generateGeometry = function () {
        var x, y, xx, yy, type, geom, mat,
            floorTexture = THREE.ImageUtils.loadTexture("images/tile.png"),
            ceilTexture = THREE.ImageUtils.loadTexture("images/stone.png"),
            wallTexture = THREE.ImageUtils.loadTexture("images/brick.png");

        for(y = 0; y < NUM_CELLS.y; ++y)
        for(x = 0; x < NUM_CELLS.x; ++x) {
            type = this.grid[y][x].type;
            xx = x * CELL_SIZE;
            yy = y * CELL_SIZE;

            if (type === CELL_TYPES.void) {
                continue;
            } else if (type === CELL_TYPES.empty) {
                // Generate floor geometry
                geom = new THREE.Mesh(
                    new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE),
                    new THREE.MeshBasicMaterial({ map: floorTexture })
                );
                geom.rotation.x = -Math.PI / 2;
                geom.position.set(xx, 0, yy);
                this.geometry.floors.push(geom);
                this.scene.add(geom);
                
                // Generate ceiling geometry
                geom = new THREE.Mesh(
                    new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE),
                    new THREE.MeshBasicMaterial({ map: ceilTexture })
                );
                geom.rotation.x = Math.PI / 2;
                geom.position.set(xx, CELL_SIZE, yy);
                this.geometry.ceils.push(geom);
                this.scene.add(geom);
            } else if (type === CELL_TYPES.wall) {
                // TODO: figure out if this is a shared wall and 
                //       generate only the required geometry 
                // NOTE: three.js CubeGeometry c'tor takes args
                //       that specify which sides to create! 
                //       (and different materials can be applied to each side)

                // For now, take the easy way out and just generate a full cube
                geom = new THREE.Mesh(
                    new THREE.CubeGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE),
                    new THREE.MeshBasicMaterial({ map: wallTexture })
                );
                geom.position.set(xx, CELL_SIZE / 2, yy);
                this.geometry.walls.push(geom);
                this.scene.add(geom);
            } else if (type === CELL_TYPES.door) {
                // TODO: generate door cube
            } else if (type === CELL_TYPES.upstairs 
                    || type === CELL_TYPES.downstairs) {
                // TODO: generate different floor + normal ceiling
            }
        }
    };


    // ------------------------------------------------------------------------
    // Populates this room object on creation
    // ------------------------------------------------------------------------
    (function generate(level, numRooms) {
        var x, y, room, iters = 0;

        console.info("Generating level...");

        level.rooms = [];
        level.generateGridCells();

        // Seed the level with a randomly sized starting room
        room = level.createRandomlySizedRoom();
        room.pos.x = Math.floor(NUM_CELLS.x / 2) - Math.floor(room.size.x / 2);
        room.pos.y = Math.floor(NUM_CELLS.y / 2) - Math.floor(room.size.y / 2);
        level.addRoom(room);

        // Keep generating rooms until we reach the limit
        // or we've tried too many times
        while (level.rooms.length < numRooms && iters++ < numRooms * 10) {
            level.generateRoom();
        }
        console.log("Generated " + level.rooms.length + " rooms.");

        // Randomly add doors between touching rooms
        // TODO

        // Randomly add other features as desired
        // TODO

        console.info("Level generation completed.");

        // TODO: this is a hack... should link rooms directly to grid on creation
        level.populateGrid();

        level.generateGeometry();

        level.debugPrint("grid");
    }) (this, numRooms);

} // end Level object 


// ----------------------------------------------------------------------------
// Cell  
// ----------------------------------------------------------------------------
function Cell(x, y, type) {
    this.index = new THREE.Vector2(x,y);
    this.type = type;
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



// ----------------------------------------------------------------------------
// TODO: move these to a utility script 
function randInt(min, max) {
    return Math.floor(Math.random() * Math.abs(max - min) + min);
}

function clamp(x, min, max) {
    return (x < min) ? min
         : (x > max) ? max 
         : x;
}

