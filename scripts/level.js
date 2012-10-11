// ----------------------------------------------------------------------------
// Level 
// ----------------------------------------------------------------------------
function Level () {
    // ------------------------------------------------------------------------
    // Public properties ------------------------------------------------------
    // ------------------------------------------------------------------------
    this.grid  = null;
    this.debug = true;


    // ------------------------------------------------------------------------
    // Private constants ------------------------------------------------------
    // ------------------------------------------------------------------------
    var CELL_SIZE = 32,
        NUM_CELLS = new THREE.Vector2(100, 100),
        // Note: these are for level generation to represent cell types
        CELL_TYPES = { 
            void: ".",
            empty: " ",
            wall: "#"
        },
        CELL_TYPE_KEYS = Object.keys(CELL_TYPES),
        GROUP_SIZE = 10; // Number of cells in a group of cells
        NUM_GROUPS = new THREE.Vector2(
            NUM_CELLS.x / GROUP_SIZE,
            NUM_CELLS.y / GROUP_SIZE
        );

    // ------------------------------------------------------------------------
    // Level Methods ----------------------------------------------------------
    // ------------------------------------------------------------------------
    (function init () {
        generateGridCells();

        // TODO: generate dungeon rooms via carving algorithm

        // Testing groups
        for(var i = 0; i < 50; ++i) {
            fillGroup(
                Math.floor(Math.random() * NUM_GROUPS.x),
                Math.floor(Math.random() * NUM_GROUPS.y),
                CELL_TYPES[CELL_TYPE_KEYS[Math.floor(Math.random() * 3)]]
            );
        }
        debugPrint();

        // TODO: generate 3d geometry based on dungeon layout
    }) ();


    // Generate a 2d array of NUM_CELLS.x by NUM_CELLS.y cells
    function generateGridCells () {
        var i, j;

        this.grid = new Array(NUM_CELLS.x);
        for(i = 0; i < NUM_CELLS.x; ++i) {
            this.grid[i] = new Array(NUM_CELLS.y);

            for(j = 0; j < NUM_CELLS.y; ++j) {
                this.grid[i][j] = new Cell(i, j, CELL_TYPES.void);
            }
        }
    }


    // Print the grid layout in ascii format to the console
    function debugPrint () {
        var i, j, str = "";
        for(i = 0; i < NUM_CELLS.x; ++i) {
            for(j = 0; j < NUM_CELLS.y; ++j) {
                str += this.grid[i][j].type;
            }
            str += "\n";
        }
        console.log(str);
    }


    // Get a particular group of cells
    function getGroup (x, y) {
        var groupCells = new Array(GROUP_SIZE * GROUP_SIZE),
            i, j, xx, yy, ii = 0;

        // Validate position
        // TODO: write clamp(x, min, max) utility function
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (x >= NUM_GROUPS.x) x = NUM_GROUPS.x - 1;
        if (y >= NUM_GROUPS.y) y = NUM_GROUPS.y - 1;

        // Gather all the cells in this group
        xx = x * GROUP_SIZE;
        yy = y * GROUP_SIZE;
        for(i = xx; i < xx + GROUP_SIZE; ++i)
        for(j = yy; j < yy + GROUP_SIZE; ++j) {
            groupCells[ii++] = this.grid[i][j];
        }

        return groupCells;
    }

    // Fill a particular group of cells
    function fillGroup (x, y, type) {
        var i, group = getGroup(x, y);
        for(i = 0; i < group.length; ++i) {
            group[i].type = type;
        }
    }
}



// ----------------------------------------------------------------------------
// Cell  
// ----------------------------------------------------------------------------
function Cell(x, y, type) {
    this.index = new THREE.Vector2(x,y);
    this.type = type;
}

