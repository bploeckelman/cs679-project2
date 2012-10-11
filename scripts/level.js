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
    var NUM_CELLS = new THREE.Vector2(50, 50),
        CELL_SIZE = 32,
        // Note: these are for level generation to represent cell types
        CELL_TYPES = { 
            void: ".",
            empty: " ",
            wall: "#"
        },
        CELL_TYPE_KEYS = Object.keys(CELL_TYPES);


    // ------------------------------------------------------------------------
    // Level Methods ----------------------------------------------------------
    // ------------------------------------------------------------------------
    (function init () {
        var i, j, 
            debug = true,
            str = "";

        generateGridCells();

        // TODO: generate dungeon rooms via carving algorithm

        if (debug) {
            debugPrint();
        }

        // TODO: generate 3d geometry based on dungeon layout
    }) ();


    // Generate a 2d array of NUM_CELLS.x by NUM_CELLS.y cells
    function generateGridCells () {
        var i, j, type;

        this.grid = new Array(NUM_CELLS.x);
        for(i = 0; i < NUM_CELLS.x; ++i) {
            this.grid[i] = new Array(NUM_CELLS.y);

            for(j = 0; j < NUM_CELLS.y; ++j) {
                type = CELL_TYPES["wall"];
                this.grid[i][j] = new Cell(i, j, type);
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
}



// ----------------------------------------------------------------------------
// Cell  
// ----------------------------------------------------------------------------
function Cell(x, y, type) {
    this.index = new THREE.Vector2(x,y);
    this.type = type;
}

