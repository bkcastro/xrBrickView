import * as DigitalBaconUI from 'digitalbacon-ui';
import * as THREE from 'three';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawUtils } from 'three/addons/utils/LDrawUtils.js';

import { XRButton } from 'three/addons/webxr/XRButton.js';

import xrLegoMainUI from './scripts/xrLegoMainUI';

let container, progressBarDiv;

let camera, scene, renderer, controls, gui, guiData, stats;

let model;

const ldrawPath = 'ldraw/officialLibrary/';

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
  'Pyramid of Giza': 'models/Pyramid_of_Giza.mpd_Packed.mpd',
  'Great Wall of China': 'models/Great_Wall_of_China.mpd_Packed.mpd', 
  'Mini Colosseum': 'models/Mini-Colosseum.mpd_Packed.mpd',
  'Lady Liberty': 'models/Lady_Liberty.mpd_Packed.mpd',
  'Taipei': 'models/Taipei.mpd_Packed.mpd'
};

init();

async function init() {

  stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  const container = document.getElementById('container');
  document.body.appendChild( container );

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 100 );
  camera.position.set( 0, 2, 2 );
  camera.lookAt(new THREE.Vector3(0 , 2 , 0));

  //

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setAnimationLoop( animate );
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

  scene.add(new THREE.AxesHelper(1)); 

  // Bacon UI

  await DigitalBaconUI.init(container, renderer, scene, camera);
  DigitalBaconUI.InputHandler.enableXRControllerManagement(scene);

  let mainUI = new xrLegoMainUI(); 
  scene.add(mainUI.getObject());

  // controls = new OrbitControls( camera, renderer.domElement );
  // controls.enableDamping = true;

  //

  guiData = {
    modelFileName: modelFileList[ 'Car' ],
    displayLines: true,
    conditionalLines: true,
    smoothNormals: true,
    buildingStep: 0,
    noBuildingSteps: 'No steps.',
    flatColors: false,
    mergeModel: false
  };

  window.addEventListener( 'resize', onWindowResize );

  progressBarDiv = document.createElement( 'div' );
  progressBarDiv.innerText = 'Loading...';
  progressBarDiv.style.fontSize = '3em';
  progressBarDiv.style.color = '#888';
  progressBarDiv.style.display = 'block';
  progressBarDiv.style.position = 'absolute';
  progressBarDiv.style.top = '50%';
  progressBarDiv.style.width = '100%';
  progressBarDiv.style.textAlign = 'center';


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

function reloadObject( resetCamera ) {

  if ( model ) {

    scene.remove( model );

  }

  model = null;

  updateProgressBar( 0 );
  showProgressBar();

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
      model.position.set(0.5, 1.5, -0.8);

      scene.add( model );

      guiData.buildingStep = model.userData.numBuildingSteps - 1;

      updateObjectsVisibility();

      // Adjust camera and light

      const bbox = new THREE.Box3().setFromObject( model );
      const size = bbox.getSize( new THREE.Vector3() );
      const radius = Math.max( size.x, Math.max( size.y, size.z ) ) * 0.5;

      if ( resetCamera ) {

        // controls.target0.copy( bbox.getCenter( new THREE.Vector3() ) );
        // controls.position0.set( - 2.3, 1, 2 ).multiplyScalar( radius ).add( controls.target0 );
        // controls.reset();

      }

      createGUI();

      hideProgressBar();

    }, onProgress, onError );

}

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

    gui.add( guiData, 'buildingStep', 0, model.userData.numBuildingSteps - 1 ).step( 1 ).name( 'Building step' ).onChange( updateObjectsVisibility );

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

  if (frame) {
    DigitalBaconUI.update(frame);
  }

  //controls.update();
  render();

  stats.end();

}

function render() {

  renderer.render( scene, camera );

}

function onProgress( xhr ) {

  if ( xhr.lengthComputable ) {

    updateProgressBar( xhr.loaded / xhr.total );

    console.log( Math.round( xhr.loaded / xhr.total * 100, 2 ) + '% downloaded' );

  }

}

function onError( error ) {

  const message = 'Error loading model';
  progressBarDiv.innerText = message;
  console.log( message );
  console.error( error );

}

function showProgressBar() {

  document.body.appendChild( progressBarDiv );

}

function hideProgressBar() {

  document.body.removeChild( progressBarDiv );

}

function updateProgressBar( fraction ) {

  progressBarDiv.innerText = 'Loading... ' + Math.round( fraction * 100, 2 ) + '%';

}
