// ----------------------------------------------------------------------------
// Utility Functions
// ----------------------------------------------------------------------------

function randInt(min, max) {
    return Math.floor(Math.random() * Math.abs(max - min) + min);
}


function clamp(x, min, max) {
    return (x < min) ? min
         : (x > max) ? max 
         : x;
}


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
