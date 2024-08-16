import * as THREE from 'three';
import ThreeMeshUI from 'three-mesh-ui';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import VRControl from './utils/vrControls';

import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawUtils } from 'three/addons/utils/LDrawUtils.js';

import { XRButton } from 'three/addons/webxr/XRButton.js';

import xrLegoMainUI from './scripts/xrLegoMainUI';
import { compressNormals } from 'three/examples/jsm/utils/GeometryCompressionUtils.js';

let container, progressBarDiv;

let camera, scene, renderer, controls, transformControls, vrControl, gui, guiData, stats, model, mainUI; 


// stuff to move the lego 
let selectedObject; 
let tempMatrix = new THREE.Matrix4();
let moveOffset = new THREE.Vector3();
let plane = new THREE.Plane();

const ldrawPath = 'officialLibrary/';

const modelFileList = {
  'Stonehenge': 'models/Stonehenge.mpd_Packed.mpd', 
  'Car': 'models/car.ldr_Packed.mpd',
  'Radar Truck': 'models/889-1-RadarTruck.mpd_Packed.mpd',
  'Trailer': 'models/4838-1-MiniVehicles.mpd_Packed.mpd',
  'Bulldozer': 'models/4915-1-MiniConstruction.mpd_Packed.mpd',
  'Helicopter': 'models/4918-1-MiniFlyers.mpd_Packed.mpd',
  'X-Wing mini': 'models/30051-1-X-wingFighter-Mini.mpd_Packed.mpd',
  'AT-ST mini': 'models/30054-1-AT-ST-Mini.mpd_Packed.mpd',
  'AT-AT mini': 'models/4489-1-AT-AT-Mini.mpd_Packed.mpd',
  'Shuttle': 'models/4494-1-Imperial Shuttle-Mini.mpd_Packed.mpd',
  'TIE Interceptor': 'models/6965-1-TIEIntercep_4h4MXk5.mpd_Packed.mpd',
  'Star fighter': 'models/6966-1-JediStarfighter-Mini.mpd_Packed.mpd',
  'X-Wing': 'models/7140-1-X-wingFighter.mpd_Packed.mpd',
  'AT-ST': 'models/10174-1-ImperialAT-ST-UCS.mpd_Packed.mpd',
  'Pyramid': 'models/pyramid.mpd_Packed.mpd',
  'Mini Colosseum': 'models/Mini-Colosseum.mpd_Packed.mpd',
  'Taipei': 'models/Taipei.mpd_Packed.mpd', 
  'London Bus': 'models/LondonBus.mpd_Packed.mpd',
};

window.objsToTest = [];

const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();
mouse.x = mouse.y = null;

let selectState = false;

window.addEventListener( 'pointermove', ( event ) => {
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
} );

window.addEventListener( 'pointerdown', () => {
	selectState = true;
} );

window.addEventListener( 'pointerup', () => {
	selectState = false;
} );

window.addEventListener( 'touchstart', ( event ) => {
	selectState = true;
	mouse.x = ( event.touches[ 0 ].clientX / window.innerWidth ) * 2 - 1;
	mouse.y = -( event.touches[ 0 ].clientY / window.innerHeight ) * 2 + 1;
} );

window.addEventListener( 'touchend', () => {
	selectState = false;
	mouse.x = null;
	mouse.y = null;
} );

init();

async function init() {

  stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  const container = document.getElementById('container');
  document.body.appendChild( container );

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 100 );
  camera.position.set( 0, 3, 4 );

  //
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.xr.enabled = true;
  container.appendChild( renderer.domElement );

  document.body.appendChild(XRButton.createButton(renderer));

  // scene

  const pmremGenerator = new THREE.PMREMGenerator( renderer );

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xdeebed );
  scene.environment = pmremGenerator.fromScene( new RoomEnvironment( renderer ) ).texture;

  // axes helper 

  // scene.add(new THREE.AxesHelper(1)); 

  // UI

  mainUI = new xrLegoMainUI(); 
  scene.add(mainUI); 

  mainUI.position.set(-0.65, 1.8, -0.65);

  // controls

  controls = new OrbitControls( camera, renderer.domElement );
  controls.enableDamping = true;

  transformControls = new TransformControls(camera, renderer.domElement); 
  scene.add(transformControls); 

  renderer.setAnimationLoop( animate );

 
  ////////////////
	// VR Controllers
	////////////////

	vrControl = VRControl( renderer );

	scene.add( vrControl.controllerGrips[ 0 ], vrControl.controllers[ 0 ] );

	vrControl.controllers[ 0 ].addEventListener( 'selectstart', (event) => {

		selectState = true;

	} );
	vrControl.controllers[ 0 ].addEventListener( 'selectend', (event) => {

		selectState = false;

	} );

  scene.add( vrControl.controllerGrips[ 1 ], vrControl.controllers[ 1 ] );

	vrControl.controllers[ 1 ].addEventListener( 'selectstart', (event) => {

		selectState = true;
  
	} );
	vrControl.controllers[ 1 ].addEventListener( 'selectend', (event) => {

		selectState = false;

	} );

  //

  guiData = {
    modelFileName: modelFileList[ 'London Bus' ],
    displayLines: true,
    conditionalLines: true,
    smoothNormals: true,
    buildingStep: 0,
    noBuildingSteps: 'No steps.',
    flatColors: false,
    mergeModel: false
  };

  window.guiData = guiData;

  window.addEventListener( 'resize', onWindowResize );

  // load materials and then the model

  reloadObject( true );

}

function updateObjectsVisibility() {

  model.traverse( c => {

    if ( c.isLineSegments ) {

      if ( c.isConditionalLine ) {

        c.visible = guiData.conditionalLines;

      } else {

        c.visible = guiData.displayLines;

      }

    } else if ( c.isGroup ) {

      // Hide objects with building step > gui setting
      c.visible = c.userData.buildingStep <= guiData.buildingStep;

    }

  } );

}

window.updateObjectsVisibility = updateObjectsVisibility;

async function reloadObject( resetCamera ) {

  if ( model ) {

    scene.remove( model );

  }

  model = null;

  // only smooth when not rendering with flat colors to improve processing time
  const lDrawLoader = new LDrawLoader();
  lDrawLoader.smoothNormals = guiData.smoothNormals && ! guiData.flatColors;
  lDrawLoader
    .setPath( ldrawPath )
    .load( guiData.modelFileName, function ( group2 ) {

      if ( model ) {

        scene.remove( model );

      }

      model = group2;

      window.model = model;

      // demonstrate how to use convert to flat colors to better mimic the lego instructions look
      if ( guiData.flatColors ) {

        function convertMaterial( material ) {

          const newMaterial = new THREE.MeshBasicMaterial();
          newMaterial.color.copy( material.color );
          newMaterial.polygonOffset = material.polygonOffset;
          newMaterial.polygonOffsetUnits = material.polygonOffsetUnits;
          newMaterial.polygonOffsetFactor = material.polygonOffsetFactor;
          newMaterial.opacity = material.opacity;
          newMaterial.transparent = material.transparent;
          newMaterial.depthWrite = material.depthWrite;
          newMaterial.toneMapping = false;

          return newMaterial;

        }

        model.traverse( c => {

          if ( c.isMesh ) {

            if ( Array.isArray( c.material ) ) {

              c.material = c.material.map( convertMaterial );

            } else {

              c.material = convertMaterial( c.material );

            }

          }

        } );

      }

      // Merge model geometries by material
      if ( guiData.mergeModel ) model = LDrawUtils.mergeObject( model );

      // Convert from LDraw coordinates: rotate 180 degrees around OX
      model.rotation.x = Math.PI;
      model.rotation.y = Math.PI / 2;
      model.scale.multiplyScalar(0.002);
      model.position.set(0.5, 1.2, -0.8);

      scene.add( model );

      guiData.buildingStep = model.userData.numBuildingSteps - 1;

      updateObjectsVisibility();

      createGUI();

    }, () => {} , onError );

}
window.reloadObject = reloadObject; 

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function createGUI() {

  if ( gui ) {

    gui.destroy();

  }

  gui = new GUI();

  gui.add( guiData, 'modelFileName', modelFileList ).name( 'Model' ).onFinishChange( function () {

    reloadObject( true );

  } );

  gui.add( guiData, 'flatColors' ).name( 'Flat Colors' ).onChange( function () {

    reloadObject( false );

  } );

  gui.add( guiData, 'mergeModel' ).name( 'Merge model' ).onChange( function () {

    reloadObject( false );

  } );

  if ( model.userData.numBuildingSteps > 1 ) {

    //gui.add( guiData, 'buildingStep', 0, model.userData.numBuildingSteps - 1 ).step( 1 ).name( 'Building step' ).onChange( updateObjectsVisibility );
    window.buildingStepControl = gui.add(guiData, 'buildingStep', 0, model.userData.numBuildingSteps - 1)
.step(1)
.name('Building step')
.onChange(updateObjectsVisibility);


  } else {

    gui.add( guiData, 'noBuildingSteps' ).name( 'Building step' ).onChange( updateObjectsVisibility );

  }

  gui.add( guiData, 'smoothNormals' ).name( 'Smooth Normals' ).onChange( function changeNormals() {

    reloadObject( false );

  } );

  gui.add( guiData, 'displayLines' ).name( 'Display Lines' ).onChange( updateObjectsVisibility );
  gui.add( guiData, 'conditionalLines' ).name( 'Conditional Lines' ).onChange( updateObjectsVisibility );

}

// 

function animate(time, frame) {
  stats.begin();
  ThreeMeshUI.update(); 
  controls.update(); 
  mainUI.lookAt(camera.position);

  if (model) {
   // model.rotation.y = Math.sin(time/6000) + Math.PI / 2;
  }

  // ----------
  // lego transfrom logic 
  // -----------

  const session = renderer.xr.getSession();

  if (session) {
      for (const source of session.inputSources) {

          if (source.gamepad && model != null && source.profiles[0] != 'meta-fixed-hand') {
         
            const gamepad = source.gamepad;

            // Handle joystick input
            const xAxis = gamepad.axes[2]; 
            const yAxis = gamepad.axes[3]; 

            if ( source.handedness == 'right') { // right is for postions 
              model.position.x += xAxis * 0.1;
              model.position.z += yAxis * 0.1;

              if (gamepad.buttons[5].pressed) {
                model.position.y += 0.1; 
              } 

              if (gamepad.buttons[4].pressed) {
                model.position.y -= 0.1; 
              }

            } else { // left is for rotation
              model.rotation.x += xAxis * 0.1;
              model.rotation.y += yAxis * 0.1;

              if (gamepad.buttons[5].pressed) {
                model.scale.multiplyScalar(1.1)
              } 

              if (gamepad.buttons[4].pressed) {
                model.scale.multiplyScalar(0.9)
              }
            }
          }
      }
  }

  updateButtons(); 

  renderer.render(scene, camera); 
  stats.end();
}

function onError( error ) {

  const message = 'Error loading model';
  progressBarDiv.innerText = message;
  console.log( message );
  console.error( error );

}

// Called in the loop, get intersection with either the mouse or the VR controllers,
// then update the buttons states according to result

function updateButtons() {

	// Find closest intersecting object

	let intersect;

	if ( renderer.xr.isPresenting ) {

		vrControl.setFromController( 1, raycaster.ray );
    // vrControl.setFromController( 1, raycaster.ray );

		intersect = raycast();

		// Position the little white dot at the end of the controller pointing ray
		if ( intersect ) vrControl.setPointerAt( 1, intersect.point );

	} else if ( mouse.x !== null && mouse.y !== null ) {

		raycaster.setFromCamera( mouse, camera );

		intersect = raycast();

	}

	// Update targeted button state (if any)

	if ( intersect ) {

    if (intersect.object.isUI) { // this is the UI
      if ( selectState ) {

        // Component.setState internally call component.set with the options you defined in component.setupState
        intersect.object.setState( 'selected' );
  
      } else {
  
        // Component.setState internally call component.set with the options you defined in component.setupState
        intersect.object.setState( 'hovered' );
  
      }
    } 

	}

	// Update non-targeted buttons state

	window.objsToTest.forEach( ( obj ) => {

		if ( ( !intersect || obj !== intersect.object ) && obj.isUI ) {

			// Component.setState internally call component.set with the options you defined in component.setupState
			obj.setState( 'idle' );

		}

	} );

}

//

function raycast() {

	return window.objsToTest.reduce( ( closestIntersection, obj ) => {

		const intersection = raycaster.intersectObject( obj, true );

		if ( !intersection[ 0 ] ) return closestIntersection;

		if ( !closestIntersection || intersection[ 0 ].distance < closestIntersection.distance ) {

			intersection[ 0 ].object = obj;

			return intersection[ 0 ];

		}

		return closestIntersection;

	}, null );

}
