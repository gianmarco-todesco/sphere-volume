'use strict';
let scene, camera;

window.addEventListener('DOMContentLoaded', (event) => {    
        const canvas = document.getElementById('renderCanvas');
        canvas.addEventListener('wheel', evt => evt.preventDefault());
        const engine = new BABYLON.Engine(canvas, true);
        scene = new BABYLON.Scene(engine);
        camera = new BABYLON.ArcRotateCamera('cam', 
            Math.PI/2,1.2,
            11, 
            new BABYLON.Vector3(0,0,0), 
            scene);
        camera.attachControl(canvas,true);
        camera.fov = 0.4;
        camera.wheelPrecision = 50;
        camera.lowerRadiusLimit = 3;
        camera.upperRadiusLimit = 13*2;            
        let light1 = new BABYLON.PointLight('light1',new BABYLON.Vector3(-1,1,0), scene);
        light1.parent = camera;
    
        populateScene(scene);
        
        engine.runRenderLoop(()=>scene.render());
        window.addEventListener("resize", () => engine.resize());
});

let sphere, cone, cylinder;
let yPos = 0.01;
let clipPlane, clipPlane2;
let borderMaterial;
let segm1Mat, disk1Mat, section1Mat;
let segm2Mat, disk2Mat, section2Mat;
let segm3Mat, disk3Mat, section3Mat;
let hRingMat, vRingMat;
let dotMat;

function setYPos(y) {
    yPos = y;
    clipPlane.d = -yPos;
    sphere.refresh();
    cone.refresh();
    cylinder.refresh();
}

function populateScene() {
    clipPlane = new BABYLON.Plane(0, 1, 0, 0);
    clipPlane2 = new BABYLON.Plane(0, 0, 1, 0);
    
    borderMaterial = createMaterial(0.6,0.3,0.3,0.1);
    segm1Mat = createMaterial(0.8,0.1,0.1,0.1);
    segm2Mat = createMaterial(0.1,0.8,0.1,0.1);
    segm3Mat = createMaterial(0.1,0.1,0.8,0.1);
    disk1Mat = createMaterial(0.8,0.4,0.4,0.1);
    disk2Mat = createMaterial(0.4,0.8,0.4,0.1);
    disk3Mat = createMaterial(0.4,0.4,0.8,0.1);
    section1Mat = createMaterial(0.6,0.5,0.5,0.1);
    section2Mat = createMaterial(0.5,0.6,0.5,0.1);
    section3Mat = createMaterial(0.5,0.5,0.6,0.1);
    hRingMat = createMaterial(0.1,0.1,0.1,0.1);
    vRingMat = createMaterial(0.5,0.5,0.5,0.1);
    dotMat = createMaterial(0.1,0.1,0.1,0.1);

    sphere = new Sphere();
    sphere.pivot.position.x = -2.5;

    cone = new Cone();
    cylinder = new Cylinder();
    cylinder.pivot.position.x = 2.5;

    setYPos(0.1);

    let v = document.getElementById('slider1').value;
    updateSlider(v);
}

function updateSlider(v) {
    setYPos(Math.max(0, Math.min(1,v)));
}



class DiskWithBorder {
    constructor(options) {
        let planes = options.planes || [];
        this.borderThickness = 0.04;
        this.pivot = new BABYLON.TransformNode('dwb', scene); 
        let border = this.border = BABYLON.MeshBuilder.CreateTorus("torus", {
            diameter:2,
            thickness:this.borderThickness,
            tessellation:70,
            updatable:true,
        }, scene);
        border.material = borderMaterial;
        setClipPlanes(border, planes);
        border.parent = this.pivot;

        let disk = this.disk = BABYLON.MeshBuilder.CreateDisc("disc", {
            radius:1,
            tessellation:70,
            updatable:true,
        }, scene);
        disk.parent = this.pivot;
        disk.rotation.x = Math.PI/2;
        setClipPlanes(disk, planes);        
    }

    set radius(r) {
        this.r = r;
        this.disk.scaling.set(r,r,1);

        let mesh = this.border;
        var positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        var normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
        var uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
        let n = uvs.length/2;
        const thickness = this.borderThickness/2;
        for(let i=0; i<n; i++) {
            let u = uvs[2*i], v = uvs[2*i+1];
            let phi = Math.PI*2*u;
            let x = Math.sin(phi) * r;
            let y = Math.cos(phi) * r;
            positions[3*i] = x + normals[3*i]*thickness;
            positions[3*i+1] = normals[3*i+1]*thickness;
            positions[3*i+2] = y + normals[3*i+2]*thickness;            
        }
        mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    }
}

class Sphere {
    constructor() {
        let spherePivot = this.pivot = new BABYLON.TransformNode('sphere', scene);
        this.disk2 = new DiskWithBorder({planes:[clipPlane]});
        this.disk2.disk.material = section3Mat;
        this.disk2.border.material = vRingMat;        
        this.disk2.pivot.parent = spherePivot;
        this.disk2.pivot.rotation.x = Math.PI/2;

        this.disk1 = new DiskWithBorder({planes:[clipPlane2]}); // clipPlane2
        this.disk1.disk.material = disk3Mat;
        this.disk1.border.material = hRingMat;        
        this.disk1.pivot.parent = spherePivot;
        
        let sphereMesh = BABYLON.MeshBuilder.CreateSphere('s', { 
            diameter:2
        }, scene);
        sphereMesh.material = section3Mat;
        //sphere.material.backFaceCulling=false;
        //sphere.material.twoSidedLighting=false;
        sphereMesh.parent = spherePivot;

        setClipPlanes(sphereMesh, [clipPlane, clipPlane2]);
    

        let p1 = new BABYLON.Vector3(-Math.sqrt(1-yPos*yPos), yPos, 0);
        let p2 = new BABYLON.Vector3(0, yPos, 0);
        let p3 = new BABYLON.Vector3(0,0, 0);

        this.segm1 = createSegment();
        this.segm1.material = segm1Mat;
        this.segm1.parent = spherePivot;
        
        this.segm2 = createSegment();
        this.segm2.material = segm2Mat;
        this.segm2.parent = spherePivot;
        this.segm2.onBeforeRenderObservable.add(()=>{ scene.resetCachedMaterial(); })
        
        this.segm3 = createSegment();
        this.segm3.material = segm3Mat;    
        this.segm3.parent = spherePivot;
        this.segm3.onBeforeRenderObservable.add(()=>{ scene.resetCachedMaterial(); })
        
        this.dot1 = createDot();
        this.dot1.parent = spherePivot;
        this.dot2 = createDot();
        this.dot2.parent = spherePivot;
        this.dot3 = createDot();
        this.dot3.parent = spherePivot;
    }

    refresh() {
        this.disk1.pivot.position.y = yPos;
        this.disk1.radius = Math.sqrt(1-yPos*yPos);
        let p0 = BABYLON.Vector3.Zero();
        let p1 = new BABYLON.Vector3(0,yPos,0);
        let p2 = new BABYLON.Vector3(Math.sqrt(1-yPos*yPos),yPos,0);
        align(this.segm2, p0, p1);
        align(this.segm1, p0, p2);
        align(this.segm3, p1, p2);  
        this.dot2.position.copyFrom(p1);
        this.dot3.position.copyFrom(p2);
              
    }
}

class Cone {
    constructor() {
        let conePivot = this.conePivot = new BABYLON.TransformNode('cone', scene);
        this.disk1 = new DiskWithBorder({diskMaterial: disk1Mat, planes:[clipPlane2]});
        this.disk1.disk.material = disk2Mat;
        this.disk1.border.material = hRingMat;
        
        let upCone = BABYLON.MeshBuilder.CreateCylinder('s', { 
            diameterTop:2.2,
            diameterBottom:0,        
            height:1.1,
            tessellation:70
        }, scene);
        upCone.material = section2Mat
        //upCone.visibility = 0.5;
        upCone.position.y = 0.5;
        let dnCone = BABYLON.MeshBuilder.CreateCylinder('s', { 
            diameterTop:0,
            diameterBottom:2,        
            height:1,
            tessellation:70
        }, scene);
        dnCone.material = section2Mat;
        dnCone.position.y = -0.5;
        
        upCone.onBeforeRenderObservable.add(() => {
            if(scene.clipPlane != null) console.log("nono")
        })
        upCone.onAfterRenderObservable.add(() => {
            if(scene.clipPlane != null) console.log("nono")
        })
        setClipPlanes(upCone, [clipPlane, clipPlane2]);
        setClipPlanes(dnCone, [clipPlane2]);

        let face = new BABYLON.Mesh("face", scene);
        let vd = new BABYLON.VertexData();
        vd.positions = [-1, 1, 0, 1, 1, 0, 0, 0, 0, 1,-1,0, -1,-1,0];
        vd.normals = [];
        for(let i=0;i<5; i++) vd.normals.push(0,0,1);        
        vd.indices = [0, 1, 2, 2, 3, 4];
        vd.applyToMesh(face);
        face.material = section2Mat;

        face.onBeforeRenderObservable.add(() => { scene.clipPlane2 = clipPlane; });
        face.onAfterRenderObservable.add(() => { scene.clipPlane2 = null; });    

        this.segm1 = createSegment();
        this.segm1.material = segm2Mat;
        this.segm2 = createSegment();
        this.segm2.material = segm2Mat;

        let segm3 = this.segm3 = createSegment();
        segm3.material = vRingMat;
        
        let segm4 = this.segm4 = createSegment();
        segm4.material = vRingMat;

        
        this.dot1 = createDot();
        this.dot1.parent = conePivot;
        this.dot2 = createDot();
        this.dot2.parent = conePivot;
        this.dot3 = createDot();
        this.dot3.parent = conePivot;
        
    }

    refresh() {
        this.disk1.pivot.position.y = yPos;
        this.disk1.radius = yPos;
        let p0 = BABYLON.Vector3.Zero();
        let p1 = new BABYLON.Vector3(0,yPos,0);
        let p2 = new BABYLON.Vector3(yPos,yPos,0);
        align(this.segm1, p0, p1);
        align(this.segm2, p1, p2);
        align(this.segm3, new BABYLON.Vector3(-yPos,yPos,0), new BABYLON.Vector3(1,-1,0));
        align(this.segm4, new BABYLON.Vector3(yPos,yPos,0), new BABYLON.Vector3(-1,-1,0));
        this.dot2.position.copyFrom(p1);
        this.dot3.position.copyFrom(p2);

    }
}


class Cylinder {
    constructor() {
        let pivot = this.pivot = new BABYLON.TransformNode('cylinder', scene);
        this.disk1 = new DiskWithBorder({planes:[clipPlane2]});
        this.disk1.pivot.parent = pivot;
        this.disk1.disk.material = disk1Mat;
        this.disk1.border.material = hRingMat;
        
        let cylinder = this.cylinder = BABYLON.MeshBuilder.CreateCylinder('s', { 
            diameter:2,
            height:2.1,
            tessellation:70
        }, scene);
        cylinder.parent = pivot;
        cylinder.material = section1Mat; 
        cylinder.position.y = 0.05;       
        setClipPlanes(cylinder, [clipPlane, clipPlane2]);

        let face = new BABYLON.Mesh("face", scene);
        let vd = new BABYLON.VertexData();
        vd.positions = [-1, 1, 0, 1, 1, 0, 1, -1, 0, -1, -1, 0];
        vd.normals = [];
        for(let i=0;i<4; i++) vd.normals.push(0,0,1);        
        vd.indices = [0, 1, 2, 0, 2, 3];
        vd.applyToMesh(face);
        face.material = section1Mat;
        face.parent = pivot;

        face.onBeforeRenderObservable.add(() => { scene.clipPlane2 = clipPlane; });
        face.onAfterRenderObservable.add(() => { scene.clipPlane2 = null; });    

        
        this.segm1 = createSegment();
        this.segm1.material = segm1Mat;
        this.segm1.parent = pivot;

        let segm2 = this.segm2 = createSegment();
        segm2.material = vRingMat;
        segm2.parent = pivot;
        
        let segm3 = this.segm3 = createSegment();
        segm3.material = vRingMat;
        segm3.parent = pivot;

        let segm4 = this.segm4 = createSegment();
        segm4.material = vRingMat;
        segm4.parent = pivot;

        this.dot1 = createDot();
        this.dot1.parent = pivot;
        this.dot2 = createDot();
        this.dot2.parent = pivot;
    }

    refresh() {
        this.disk1.pivot.position.y = yPos;        
        let p1 = new BABYLON.Vector3(0,yPos,0);
        let p2 = new BABYLON.Vector3(1,yPos,0);
        align(this.segm1, p1, p2);
        align(this.segm2, new BABYLON.Vector3(-1,yPos,0), new BABYLON.Vector3(-1,-1,0));
        align(this.segm3, p2, new BABYLON.Vector3(1,-1,0));
        align(this.segm4, p1, new BABYLON.Vector3(0,-1,0));
        this.dot1.position.copyFrom(p1);
        this.dot2.position.copyFrom(p2);

    }
}


function createMaterial(r,g,b,s) {
    let material = new BABYLON.StandardMaterial('mat',scene);
    material.diffuseColor.set(r,g,b);
    material.specularColor.set(s,s,s);
    return material;    
}

function createDot() {
    let dot = BABYLON.MeshBuilder.CreateSphere('c',{
        diameter:0.1
    }, scene);
    dot.material = dotMat;
    setClipPlanes(dot, []);
    return dot;
}


function createSegment() {
    let mesh = BABYLON.MeshBuilder.CreateCylinder('c',{
            diameter:0.05,
            height: 1
        }, scene);
    setClipPlanes(mesh, []);
    return mesh;
}

function align(mesh, p1, p2) {
    let delta = p2.subtract(p1);
    mesh.position.set(0,0,0);
    mesh.lookAt(delta);
    mesh.rotate(BABYLON.Axis.X, Math.PI/2);
    mesh.scaling.set(1,delta.length(),1);
    BABYLON.Vector3.LerpToRef(p1,p2,0.5,mesh.position);   
}
let count = 0;

function setClipPlanes(obj, planes) {
    console.log(obj);
    if(planes.length==0) {
        obj.onBeforeRenderObservable.add(() => { 
            scene.clipPlane = null;
            scene.clipPlane2 = null;
            scene.resetCachedMaterial(); 
            scene.resetDrawCache(); 
        });        
    }
    else if(planes.length==1) {
        let plane = planes[0];
        obj.onBeforeRenderObservable.add(() => { 
            scene.clipPlane = plane;
            scene.clipPlane2 = null; 
            scene.resetCachedMaterial(); 
            scene.resetDrawCache(); 
        });
        obj.onAfterRenderObservable.add(() => {  
            scene.clipPlane = null; 
        });    
    } else if(planes.length==2) {
        let plane = planes[0];
        let plane2 = planes[1]
        obj.onBeforeRenderObservable.add(() => { 
            scene.clipPlane = plane; 
            scene.clipPlane2 = plane2; 
            scene.resetCachedMaterial(); 
            scene.resetDrawCache(); 
        });
        obj.onAfterRenderObservable.add(() => { 
            scene.clipPlane = null; 
            scene.clipPlane2 = null; 
        });
    }
}