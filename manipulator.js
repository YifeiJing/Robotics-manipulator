window.addEventListener('load', init);

// Window size
const width = 960;
const height = 540;

var c0 = new THREE.Vector3(); // center of body
var c1 = new THREE.Vector3(); // center of arm1
// c1.copy(new THREE.Vector3(0., 0., 1.));
var c2 = new THREE.Vector3(); // center of arm2
// c2.copy(new THREE.Vector3(0., 0., 2.));
var c3 = new THREE.Vector3(); // center of arm3
// c3.copy(new THREE.Vector3(0., 0., 3.));
var q01 = new THREE.Quaternion(); // 0A1 matrix
var q02 = new THREE.Quaternion(); // 0A2 matrix
var q03 = new THREE.Quaternion(); // 0A3 matrix
var p0 = new THREE.Vector3(); // position of base origin
var p1 = new THREE.Vector3(); // position of joint 1
var p2 = new THREE.Vector3(); // position of joint 2
var p3 = new THREE.Vector3(); // position of joint 3
var pe = new THREE.Vector3(); // position of hand
var startpoint = new THREE.Vector3(-1.375, -1.575, 0.92);
var endpoint = new THREE.Vector3(1.0, 2.3, 2.9);
var l = [1, 1, 1, 1]; // arm length
var phi = [0, 45, 90];
var move = 0;
var jacobi = new THREE.Matrix3();
var ve = new THREE.Vector3(.0,.0,.0); // vector of velocity

function init() {
  // renderer 
  const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#myCanvas')
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.setClearColor(0xffffff);

  // scene
  const scene = new THREE.Scene();

  // camera
  const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
  camera.up.x = 0; camera.up.y = 0; camera.up.z = 1;    
  camera.position.set(7, 7, 7);

  // camera controller
  const controls = new THREE.OrbitControls(camera);
  controls.enableDamping = true;
  controls.dampingFactor = 0.2;

  // parallel light
  const directionalLight = new THREE.DirectionalLight( 0xFFFFFF, 0.7 );
  directionalLight.position.set(0, 1, 1);
  scene.add( directionalLight );

  // ambient light
  const ambientLight = new THREE.AmbientLight( 0xf0f0f0 ); // soft white light
  scene.add(ambientLight);

  // floor mesh
  createFloor();

  function createFloor() {
    var geometry = new THREE.Geometry();
    var N = 10;
    var w = 1;
    for( var i=0; i<N; i++){
      for( var j=0; j<=N; j++){
        geometry.vertices.push( new THREE.Vector3((i - N/2 ) * w, (j - N/2 ) * w, 0) );
        geometry.vertices.push( new THREE.Vector3(((i+1) - N/2 ) * w, (j - N/2 ) * w, 0) );
      }
      for( var j=0; j<=N; j++){
        geometry.vertices.push( new THREE.Vector3((j - N/2 ) * w, (i - N/2 ) * w, 0) );
        geometry.vertices.push( new THREE.Vector3((j - N/2 ) * w, ((i+1) - N/2 ) * w, 0) );
      }
    }
    var material = new THREE.LineBasicMaterial({ color: 0x000000, transparent:true, opacity:0.5 });
    lines = new THREE.LineSegments(geometry, material);
    scene.add(lines);

    for( var i=0; i<3; i++){
      var geometry = new THREE.Geometry();
      geometry.vertices.push( new THREE.Vector3(0, 0, 0) );
      if (i  == 0) {
        geometry.vertices.push( new THREE.Vector3(N*w/4, 0, 0) );
        var material = new THREE.LineBasicMaterial({ color: 0xFF0000, transparent:true, opacity:0.5 });
      } else if (i == 1) {
        geometry.vertices.push( new THREE.Vector3(0, N*w/4, 0) );
        var material = new THREE.LineBasicMaterial({ color: 0x00FF00, transparent:true, opacity:0.5 });
      } else {
        geometry.vertices.push( new THREE.Vector3(0, 0, N*w/4) );
        var material = new THREE.LineBasicMaterial({ color: 0x0000FF, transparent:true, opacity:0.5 });
      }
      axis = new THREE.Line(geometry, material);
      scene.add(axis);
    }
  }

  // base
  createBase();

  function createBase() {
    var geometry_base = new THREE.BoxGeometry(1, 1, l[0]);
    var material_base = new THREE.MeshStandardMaterial({color: 0xff0000, side: THREE.DoubleSide});
    base = new THREE.Mesh(geometry_base, material_base);
    scene.add(base);
  }

  // arm 1
  createArm1();

  function createArm1() {
    var geometry = new THREE.BoxGeometry(0.2, 0.2, l[1]);
    var material = new THREE.MeshStandardMaterial({color: 0x00ff00, side: THREE.DoubleSide});
    arm1 = new THREE.Mesh(geometry, material);
    // arm1.position.set(0,5,0);
    scene.add(arm1);
  }

  // arm 2
  createArm2();

  function createArm2() {
    var geometry = new THREE.BoxGeometry(l[2], 0.2, 0.2);
    var material = new THREE.MeshStandardMaterial({color: 0x0000ff, side: THREE.DoubleSide});
    arm2 = new THREE.Mesh(geometry, material);
    scene.add(arm2);
  }

  // arm 3
  createArm3();

  function createArm3() {
    var geometry = new THREE.BoxGeometry(l[3], 0.2, 0.2);
    var material = new THREE.MeshStandardMaterial({color: 0xff00ff, side: THREE.DoubleSide});
    arm3 = new THREE.Mesh(geometry, material);
    scene.add(arm3);
  }

  DK();

  // rendering
  tick();

  // keyboad control
  var RotSpeed = 5.0;
  var PosSpeed = 0.1;

  document.addEventListener("keydown", onDocumentKeyDown, false);
  function onDocumentKeyDown(event) {
    var keyCode = event.which;
    if (keyCode == 90) {
      // z
      ve.z += PosSpeed;
    } else if (keyCode == 88) {
      // x
      ve.z -= PosSpeed;
    } else if (keyCode == 65) {
      // a
      ve.y += PosSpeed;
    } else if (keyCode == 83) {
      // s
      ve.y -= PosSpeed;
    } else if (keyCode == 81) {
      // q
      ve.x += PosSpeed;
    } else if (keyCode == 87) {
      // w
      ve.x -= PosSpeed;
    } else if (keyCode == 32) {
      // space
      phi[0] =  0.0;
      phi[1] = 45.0;
      phi[2] = 90.0;
      ve.set(0,0,0);
      DK();
    } else if (keyCode == 69) {
      // e
      move = 1;
    } else if (keyCode == 82) {
      // r
      move = 0;
    }
    // IK();
    // DK();
  }


  function DK() {
    //Insert code for DK here
    // Lengths
    var l0 = new THREE.Vector3(0, 0, l[0]);
    var l1 = new THREE.Vector3(0, 0, l[1]);
    var l2 = new THREE.Vector3(l[2], 0, 0);
    var l3 = new THREE.Vector3(l[3], 0, 0);
    // centers
    var h0 = new THREE.Vector3(0, 0, l[0]/2.0);
    var h1 = new THREE.Vector3(0, 0, l[1]/2.0);
    var h2 = new THREE.Vector3(l[2]/2.0, 0, 0);
    var h3 = new THREE.Vector3(l[3]/2.0, 0, 0);

    var x_axis = new THREE.Vector3(1, 0, 0);
    var y_axis = new THREE.Vector3(0, 1, 0);
    var z_axis = new THREE.Vector3(0, 0, 1);

    // tranformation calcs
    var q1 = new THREE.Quaternion().setFromAxisAngle(x_axis, -Math.PI/2.0);
    var q2 = new THREE.Quaternion().setFromAxisAngle(z_axis, -Math.PI/2.0);
    var q3 = new THREE.Quaternion().setFromAxisAngle(z_axis, phi[1]*Math.PI/180.0);
    var q12 = new THREE.Quaternion().multiplyQuaternions(q1, q2).multiply(q3);
    var q23 = new THREE.Quaternion().setFromAxisAngle(z_axis, phi[2]*Math.PI/180.0);

    q01.setFromAxisAngle(z_axis, phi[0]*Math.PI/180.0);
    q02 = q01.clone();
    q02.multiply(q12);
    q03 = q02.clone();
    q03.multiply(q23);

    // Positions
    p0.set(0,0,0);
    p1 = l0.clone();
    p2 = p1.clone();
    p2.add(l1.applyQuaternion(q01));
    p3 = p2.clone();
    p3.add(l2.applyQuaternion(q02));
    pe = p3.clone();
    pe.add(l3.applyQuaternion(q03));

    // Centers
    c0 = h0.clone();
    c1 = p1.clone();
    c1.copy(p1);
    c1.add(h1.applyQuaternion(q01));
    c2 = p2.clone();
    c2.add(h2.applyQuaternion(q02));
    c3 = p3.clone();
    c3.add(h3.applyQuaternion(q03));
  }

  function IK() {
    //Insert code for IK here
    // px and py in pe, finding angels accordingly
    var px = pe.x;
    var py = pe.y;
    var pz = pe.z;

    phi0 = Math.atan2(py,px);
    var C1 = Math.cos(phi0);
    var r = Math.sqrt(Math.pow(px/C1,2)+Math.pow(pz-l[0]-l[1],2))
    var Phi = Math.atan2(pz-l[0]-l[1],px/C1);
    var d = 1./(2.*l[2])*(Math.pow(px/C1,2)+Math.pow(pz-l[0]-l[1],2)+Math.pow(l[2],2)-Math.pow(l[3],2));

    if (d > r) return;
    phi[0] = Math.atan2(py,px); 
    phi[1] = Math.atan2(d/r, Math.sqrt(1-Math.pow(d/r,2))) - Phi;
    phi[2] = Math.atan2(px/C1-Math.sin(phi[1])*l[2], pz-l[0]-l[1]-Math.cos(phi[1])*l[2]) - phi[1];

    phi[0] = phi[0] * 180 / Math.PI;
    phi[1] = phi[1] * 180 / Math.PI;
    phi[2] = phi[2] * 180 / Math.PI;
  }

  function calcJacobi() {
    //Insert code for jacobian calculation here
    const C1 = Math.cos(phi[0]*Math.PI/180.0);
    const C2 = Math.cos(phi[1]*Math.PI/180.0);
    const C23 = Math.cos((phi[1]+phi[2])*Math.PI/180.0);
    const S1 = Math.sin(phi[0]*Math.PI/180.0);
    const S2 = Math.sin(phi[1]*Math.PI/180.0);
    const S23 = Math.sin((phi[1]+phi[2])*Math.PI/180.0);
    
    jacobi.set(-S1*(S2*l[2]+S23*l[3]), C1*(C2*l[2]+C23*l[3]), C1*C23*l[3],
                C1*(S2*l[2]+S23*l[3]), S1*(C2*l[2]+C23*l[3]), S1*C23*l[3],
                0, -S2*l[2]-S23*l[3], -S23*l[3]);
  }

  var iteration = 1;
  var max_iter = 60;
  var dt = 0.1;
  function tick() {
    
    calcJacobi();
    var ved = new THREE.Vector3();
    ved.set(ve.x,ve.y,ve.z);
    var im = new THREE.Matrix3();
    if (Math.abs(jacobi.determinant()) < 0.1)
    {
      console.log("Out of range determinant\n");
      ve.set(0,0,0);
    }
    im.getInverse(jacobi);
    var phid = new THREE.Vector3();
    phid = ved.applyMatrix3(im);

    phi[0] = phi[0] + phid.x / Math.PI * 180.0 * dt;
    phi[1] = phi[1] + phid.y / Math.PI * 180.0 * dt; 
    phi[2] = phi[2] + phid.z / Math.PI * 180.0 * dt;

    DK();

    base.position.copy(c0);
    arm1.position.copy(c1);
    arm1.quaternion.copy(q01);
    arm2.position.copy(c2);
    arm2.quaternion.copy(q02);
    arm3.position.copy(c3);
    arm3.quaternion.copy(q03);

    // update camera controller
    controls.update();

    // rendering
    renderer.render(scene, camera);

    console.log("phi " + phi[0] + " " + phi[1] + " " + phi[2]);
    // console.log("pe" + " " + pe.x + " " + pe.y + " "+ pe.z);
    console.log("ve" + " " + ve.x + " " + ve.y + " "+ ve.z);
    requestAnimationFrame(tick);
  }


}