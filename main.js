import * as THREE from 'three';
import ThreeMeshUI from 'three-mesh-ui';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import VRControl from './utils/VRControls.js';

import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawUtils } from 'three/addons/utils/LDrawUtils.js';

import { XRButton } from 'three/addons/webxr/XRButton.js';

import xrLegoMainUI from './scripts/xrLegoMainUI';

let container, progressBarDiv;

let camera, scene, renderer, controls, transformControls, vrControl, gui, guiData, stats, model, modelbbox, mainUI;

const raycast1ObjectsToTest = new THREE.Group();

const ldrawPath = 'officialLibrary/';

const modelFileList = {
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
let dragging = false;

// this is the hover feature with mouse input 

window.addEventListener('pointermove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('pointerdown', () => {
  console.log("pointerdown");

  selectState = true;

  if (raycaster == null) { return }

  let intersects = raycast1();

  console.log('intersects', intersects);
  console.log('dragging', dragging);

});

window.addEventListener('pointerup', () => {

  console.log("pointerup");

  selectState = false;

  console.log('dragging', dragging);

  dragging = false

});

window.addEventListener('touchstart', (event) => {
  selectState = true;
  mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('touchend', () => {
  selectState = false;
  mouse.x = null;
  mouse.y = null;
});

init();

async function init() {

  stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  const container = document.getElementById('container');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 1);

  //
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  document.body.appendChild(XRButton.createButton(renderer));

  // scene

  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdeebed);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(renderer)).texture;

  // axes helper 

  // scene.add(new THREE.AxesHelper(1)); 

  // UI

  mainUI = new xrLegoMainUI();
  scene.add(mainUI);

  mainUI.position.set(-0.45, 0, .3);

  raycast1ObjectsToTest.add(mainUI);

  scene.add(raycast1ObjectsToTest);

  //mainUI.position.set(-0.65, 1.8, -0.65);

  // controls

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // transformControls = new TransformControls(camera, renderer.domElement);
  // scene.add(transformControls);

  renderer.setAnimationLoop(animate);


  ////////////////
  // VR Controllers
  ////////////////

  vrControl = VRControl(renderer);

  scene.add(vrControl.controllerGrips[0], vrControl.controllers[0]);

  vrControl.controllers[0].addEventListener('selectstart', (event) => {

    selectState = true;
  });
  vrControl.controllers[0].addEventListener('selectend', (event) => {

    selectState = false;

  });

  scene.add(vrControl.controllerGrips[1], vrControl.controllers[1]);

  vrControl.controllers[1].addEventListener('selectstart', (event) => {

    selectState = true;

  });
  vrControl.controllers[1].addEventListener('selectend', (event) => {

    selectState = false;

  });

  //

  guiData = {
    modelFileName: modelFileList['London Bus'],
    displayLines: true,
    conditionalLines: true,
    smoothNormals: true,
    buildingStep: 0,
    noBuildingSteps: 'No steps.',
    flatColors: false,
    mergeModel: false
  };

  window.guiData = guiData;

  window.addEventListener('resize', onWindowResize);

  // load materials and then the model

  progressBarDiv = document.createElement('div');
  progressBarDiv.innerText = 'Loading...';
  progressBarDiv.style.fontSize = '3em';
  progressBarDiv.style.color = '#888';
  progressBarDiv.style.display = 'block';
  progressBarDiv.style.position = 'absolute';
  progressBarDiv.style.top = '50%';
  progressBarDiv.style.width = '100%';
  progressBarDiv.style.textAlign = 'center';

  // load materials and then the model

  reloadObject(true);

}

function updateObjectsVisibility() {

  model.traverse(c => {

    if (c.isLineSegments) {

      if (c.isConditionalLine) {

        c.visible = guiData.conditionalLines;

      } else {

        c.visible = guiData.displayLines;

      }

    } else if (c.isGroup) {

      // Hide objects with building step > gui setting
      c.visible = c.userData.buildingStep <= guiData.buildingStep;

    }

  });

}

window.updateObjectsVisibility = updateObjectsVisibility;

async function reloadObject(resetCamera) {

  if (model) {

    scene.remove(model);
    scene.remove(modelbbox);

  }

  model = null;
  modelbbox = null;

  // only smooth when not rendering with flat colors to improve processing time
  const lDrawLoader = new LDrawLoader();
  lDrawLoader.smoothNormals = guiData.smoothNormals && !guiData.flatColors;
  lDrawLoader
    .setPath(ldrawPath)
    .load(guiData.modelFileName, function (group2) {

      if (model) {

        scene.remove(model);

      }

      model = group2;

      window.model = model;

      // demonstrate how to use convert to flat colors to better mimic the lego instructions look
      if (guiData.flatColors) {

        function convertMaterial(material) {

          const newMaterial = new THREE.MeshBasicMaterial();
          newMaterial.color.copy(material.color);
          newMaterial.polygonOffset = material.polygonOffset;
          newMaterial.polygonOffsetUnits = material.polygonOffsetUnits;
          newMaterial.polygonOffsetFactor = material.polygonOffsetFactor;
          newMaterial.opacity = material.opacity;
          newMaterial.transparent = material.transparent;
          newMaterial.depthWrite = material.depthWrite;
          newMaterial.toneMapping = false;

          return newMaterial;

        }

        model.traverse(c => {

          if (c.isMesh) {

            if (Array.isArray(c.material)) {

              c.material = c.material.map(convertMaterial);

            } else {

              c.material = convertMaterial(c.material);

            }

          }

        });

      }

      // Merge model geometries by material
      if (guiData.mergeModel) model = LDrawUtils.mergeObject(model);

      // Convert from LDraw coordinates: rotate 180 degrees around OX
      model.rotation.x = Math.PI;
      model.rotation.y = Math.PI / 2;
      model.scale.multiplyScalar(0.002);
      model.position.set(0.65, -0.2, 0);

      // Create a Box3 to hold the bounding box
      const box = new THREE.Box3().setFromObject(model);

      // Calculate the bounding box dimensions
      const size = new THREE.Vector3();
      box.getSize(size);
      console.log('Bounding Box Dimensions:', size);

      // Optionally, visualize the bounding box
      const boxHelper = new THREE.BoxHelper(model, 0xff0000); // Red color for the bounding box
      modelbbox = boxHelper;
      scene.add(boxHelper);

      scene.add(model);

      guiData.buildingStep = model.userData.numBuildingSteps - 1;

      updateObjectsVisibility();

      // createGUI();

    }, () => { }, onError);

}
window.reloadObject = reloadObject;

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

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

  // -------------------
  // lego transfrom logic 
  // --------------------

  const session = renderer.xr.getSession();

  if (session) {
    for (const source of session.inputSources) {

      if (source.gamepad && model != null && source.profiles[0] != 'meta-fixed-hand') {

        const gamepad = source.gamepad;

        // Handle joystick input
        const xAxis = gamepad.axes[2];
        const yAxis = gamepad.axes[3];

        if (source.handedness == 'right') { // right is for positions 
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

function onProgress(xhr) {

  if (xhr.lengthComputable) {

    updateProgressBar(xhr.loaded / xhr.total);

    console.log(Math.round(xhr.loaded / xhr.total * 100, 2) + '% downloaded');

  }

}

function onError(error) {

  const message = 'Error loading model';
  progressBarDiv.innerText = message;
  console.log(message);
  console.error(error);

}

function showProgressBar() {

  document.body.appendChild(progressBarDiv);

}

function hideProgressBar() {

  document.body.removeChild(progressBarDiv);

}

function updateProgressBar(fraction) {

  progressBarDiv.innerText = 'Loading... ' + Math.round(fraction * 100, 2) + '%';

}

// Called in the loop, get intersection with either the mouse or the VR controllers,
// then update the buttons states according to result

function updateButtons() {

  // Find closest intersecting object

  let intersect;

  // --------
  // XR INPUT 
  // -------- 

  if (renderer.xr.isPresenting) {

    vrControl.setFromController(1, raycaster.ray);
    // vrControl.setFromController( 1, raycaster.ray );

    intersect = raycast2();

    // Position the little white dot at the end of the controller pointing ray
    if (intersect) vrControl.setPointerAt(1, intersect.point);

  }

  // -----------
  // MOUSE INPUT
  // -----------

  else if (mouse.x !== null && mouse.y !== null) {

    raycaster.setFromCamera(mouse, camera);

    intersect = raycast2();

  }

  // Update targeted button state (if any)

  if (intersect) {

    if (intersect.object.isUI) { // this is the UI
      if (selectState && !dragging) {

        // Component.setState internally call component.set with the options you defined in component.setupState
        intersect.object.setState('selected');

      } else {

        // Component.setState internally call component.set with the options you defined in component.setupState
        intersect.object.setState('hovered');

      }
    }

  }

  // Update non-targeted buttons state

  window.objsToTest.forEach((obj) => {

    if ((!intersect || obj !== intersect.object) && obj.isUI) {

      // Component.setState internally call component.set with the options you defined in component.setupState
      obj.setState('idle');

    }

  });

}

// ad-hoc when dragging you don't want to call the newly intersected options because you are trying to just drag around the scene. 
// by checking once on down check if you intersect with any

// this gets called on pointer down event 

function raycast1() {

  raycaster.setFromCamera(mouse, camera);

  // Calculate objects intersecting the ray
  const intersections = raycaster.intersectObjects(raycast1ObjectsToTest.children);

  if (intersections.length == 0) {

    dragging = true;

  }

}

// reduce is cool 

// call this always, handles mouse and xr input for interactions 

function raycast2() {

  return window.objsToTest.reduce((closestIntersection, obj) => {

    const intersection = raycaster.intersectObject(obj, true);

    if (!intersection[0]) return closestIntersection;

    if (!closestIntersection || intersection[0].distance < closestIntersection.distance) {

      intersection[0].object = obj;

      return intersection[0];

    }

    return closestIntersection;

  }, null);

}


