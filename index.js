import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let renderer;
let scene;
let camera;
let controls;

const particleSize = 0.1;
const spaceHalfSize = 10;
const friction = 0.99;

let particleTypes = {
  base: '#F0F'
}
let particles = []
let gravityForces = [
  {
    typeSrc: "base",
    typeDest: "base",
    forces: [
      {
        minDist: 0,
        maxDist: 20,
        force: -2,
      },
      {
        minDist: 20,
        maxDist: 1000,
        force: 1,
      }
    ]
  }
];

function addType() {
  let randomHexString = [...Array(6)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  console.log(randomHexString);
  let typename = `Type${Object.keys(particleTypes).length}`;
  particleTypes[typename] = `#${randomHexString}`;
  generateParticles(typename, 20);
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById("addTypeButton").addEventListener('click', addType);
});

function updateParticleVelocities(particle, index, particles) {
  let forcex = 0;
  let forcey = 0;
  particles.forEach((other, oidx) => {
    if (index == oidx) return;
    const distx = (other.position.x - particle.position.x) / particleSize;
    const disty = (other.position.y - particle.position.y) / particleSize;
    const dsq = (distx * distx + disty * disty) / particleSize;
    const nx = distx / Math.sqrt(dsq);
    const ny = disty / Math.sqrt(dsq);

    const rule = gravityForces
      .find(({typeSrc, typeDest}) => typeSrc == particle.type && typeDest == other.type)
      ?.forces?.find(({minDist, maxDist}) => dsq >= (minDist * minDist) && dsq < (maxDist * maxDist));
    if (!rule) return;

    const a = (rule.maxDist * rule.maxDist - rule.minDist * rule.minDist) / 2
    const force = -(rule.force / a) * Math.abs(dsq - a - (rule.minDist * rule.minDist)) + rule.force;
    forcex += (force * nx * particleSize);
    forcey += (force * ny * particleSize);
  });
  particle.velocity.x += forcex;
  particle.velocity.y += forcey;
  particle.velocity.x *= friction;
  particle.velocity.y *= friction;
}

function updateParticlePosition(particle, time){
  particle.position.x += particle.velocity.x;
  particle.position.y += particle.velocity.y;
  if (particle.position.x < -spaceHalfSize) {
    particle.position.x += spaceHalfSize * 2;
  }
  if (particle.position.x > spaceHalfSize) {
    particle.position.x -= spaceHalfSize * 2;
  }
  if (particle.position.y < -spaceHalfSize) {
    particle.position.y += spaceHalfSize * 2;
  }
  if (particle.position.y > spaceHalfSize) {
    particle.position.y -= spaceHalfSize * 2;
  }
  particle.meshes.forEach((mesh, idx) => {
    const xoff = ((idx % 3) - 1) * spaceHalfSize * 2;
    const yoff = (Math.floor(idx / 3) - 1) * spaceHalfSize * 2;
    mesh.position.x = particle.position.x + xoff;
    mesh.position.y = particle.position.y + yoff;
    mesh.rotation.x = time / particle.rotationSpeed.x;
    mesh.rotation.y = time / particle.rotationSpeed.y;
  });
}

function createRandomParticle(type) {
  const color = particleTypes[type];
  const geometry = new THREE.DodecahedronGeometry( particleSize / 2 );
  const material = new THREE.MeshPhongMaterial({color: color});

  let particle = {
    type,
    position: {
      x: Math.random() * spaceHalfSize * 2 - spaceHalfSize,
      y: Math.random() * spaceHalfSize * 2 - spaceHalfSize,
    },
    velocity: {
      x: (Math.random() * 20 - 10) * particleSize,
      y: (Math.random() * 20 - 10) * particleSize,
    },     
    rotationSpeed: {
      x: (Math.random() * 2000 + 1000),
      y: (Math.random() * 2000 + 1000),
    },
    meshes: []
  };

  for(let j = 0; j < 9; j++) {
    let mesh = new THREE.Mesh( geometry, material );
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add( mesh );
    particle.meshes.push(mesh);
  }
  particles.push(particle);
}

function generateParticles(type, number) {
  for (let i = 0; i < number; i++) {
    createRandomParticle(type)
  }
}

function updateMeshes(time) {
  particles.forEach(updateParticleVelocities);
  particles.forEach(particle => {
    updateParticlePosition(particle, time);
  });
}

function initialize() {
  let container = document.getElementById('container');
  
  // init
  console.log('hello??');

  camera = new THREE.PerspectiveCamera( 90, container.offsetWidth / container.offsetHeight, 0.01, 1000 );
  camera.position.z = 8;

  scene = new THREE.Scene();

  generateParticles("base", 50);

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setSize( container.offsetWidth, container.offsetHeight );
  renderer.shadowMap.enabled = true;
  renderer.setAnimationLoop( animation );
  console.log(renderer);
  container.appendChild( renderer.domElement );

  const light = new THREE.DirectionalLight( 0xffffff , 1); // soft white light
  light.position.z = 10
  scene.add( light );

  controls = new OrbitControls(camera, renderer.domElement);
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN
  }
  controls.minDistance = 1;
  controls.maxDistance = 15;
  controls.update();
}

function animation( time ) {
  updateMeshes(time);
  
  controls.update();
  
  renderer.render( scene, camera );
}

window.addEventListener('load', initialize);

console.log("why")