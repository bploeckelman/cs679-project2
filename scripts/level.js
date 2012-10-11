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
function Level (numRooms) {
    // ------------------------------------------------------------------------
    // Public properties ------------------------------------------------------
    // ------------------------------------------------------------------------
    this.grid  = null;
    this.rooms = null;


    // ------------------------------------------------------------------------
    // Private constants ------------------------------------------------------
    // ------------------------------------------------------------------------
    var CELL_SIZE = 32,
        NUM_CELLS = new THREE.Vector2(20, 20),
        // Note: these are for level generation to represent cell types
        GROUP_SIZE = 2; // Number of cells in a group of cells
        NUM_GROUPS = new THREE.Vector2(
            NUM_CELLS.x / GROUP_SIZE,
            NUM_CELLS.y / GROUP_SIZE
        ),
        MIN_ROOM_SIZE = 4,
        MAX_ROOM_SIZE = 8;


    // ------------------------------------------------------------------------
    // Level Methods ----------------------------------------------------------
    // ------------------------------------------------------------------------
    this.createRandomlySizedRoom = function () {
        return new Room(new THREE.Vector2(
            randInt(MIN_ROOM_SIZE, MAX_ROOM_SIZE),
            randInt(MIN_ROOM_SIZE, MAX_ROOM_SIZE)
        ));
    };


    this.doesRoomFit = function (room) {
        var i;

        // Does room fit inside level bounds?
        if (room.pos.x < 0 || room.pos.x + room.size.x >= NUM_CELLS.x
         || room.pos.y < 0 || room.pos.y + room.size.y >= NUM_CELLS.y) {
            return false;
        }
        
        // Does room intersect any existing rooms?
        for(i = 0; i < this.rooms.length; ++i) {
            if (this.rooms[i].intersectsRoom(room)) {
                return false;
            }
        }

        // The room fits!
        return true;
    };


    this.addRoom = function (room) {
        if (!this.doesRoomFit(room)) { 
            return false;
        } else {
            if (room.pos.x < 0 || room.pos.y < 0) {
                console.error("Room position is negative!");
            }
            this.rooms.push(room);
            return true;
        }
        // TODO: keep track of where on the grid each room is?
    };


    this.generateRoom = function () {
        var room = this.createRandomlySizedRoom(),
            iter = 200, // max # tries to place room
            result;

        while (iter-- > 0) {
            room.pos = this.findRoomAttachment(room).position;
            if (this.addRoom(room)) {
                // TODO:
                // this.addDoor(room);
            }
        }
    };


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
        while (iters++ < numRooms * 10 && level.rooms.length < numRooms) {
            level.generateRoom();
        }
        console.log("Generated " + level.rooms.length + " rooms.");

        // Randomly add doors between touching rooms
        // TODO

        // Randomly add other features as desired
        // TODO

        console.info("Level generation completed.");

        level.debugPrint("all");
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
    this.tiles = new Array(this.size.y);


    // Initialize this room with walls surrounding empty space
    // -------------------------------------------------------
    (function init (room) {
        var x, y, row;

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


    // Does this room intersect the specified room?
    // --------------------------------------------
    this.intersectsRoom = function (room) {
        if (this.pos.x + this.size.x <= room.pos.x + 1
         || this.pos.x >= room.pos.x + room.size.x - 1
         || this.pos.y + this.size.y <= room.pos.y + 1
         || this.pos.y >= room.pos.y + room.size.y - 1) {
            return false;
        } else {
            return true;
        }
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
                + "size("+this.size.x+","+this.size.y+")\n",
            x, y;
        for(y = 0; y < this.tiles.length; ++y) {
            if (y != 0) { str += "\n"; }
            for(x = 0; x < this.tiles[0].length; ++x) {
                str += this.tiles[y][x];
            }
        }
        console.log(str);
    };
}



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

