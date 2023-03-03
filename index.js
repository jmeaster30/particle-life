import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let mesh;
let renderer;
let scene;
let camera;
let controls;

const particleSize = 0.05;
const spaceHalfSize = 5;
const friction = 0.95;

let particles = []
let gravityForces = [
  {
    minDist: 0,
    maxDist: 10,
    force: -25,
  },
  {
    minDist: 10,
    maxDist: 1000,
    force: 0.5,
  }
];

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

    const rule = gravityForces.find(({minDist, maxDist}) => dsq >= (minDist * minDist) && dsq < (maxDist * maxDist))
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
    mesh.rotation.x = time / 2000;
    mesh.rotation.y = time / 1000;
  });
}

function generateMeshes() {
  for (let i = 0; i < 250; i++) {
    const geometry = new THREE.BoxGeometry( particleSize, particleSize, particleSize );
    const material = new THREE.MeshNormalMaterial();

    let particle = {
      position: {
        x: Math.random() * spaceHalfSize * 2 - spaceHalfSize,
        y: Math.random() * spaceHalfSize * 2 - spaceHalfSize,
      },
      velocity: {
        x: (Math.random() * 20 - 10) * particleSize,
        y: (Math.random() * 20 - 10) * particleSize,
      },     
      meshes: []
    };

    for(let j = 0; j < 9; j++) {
      mesh = new THREE.Mesh( geometry, material );
      scene.add( mesh );
      particle.meshes.push(mesh);
    }
    particles.push(particle);
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

  generateMeshes();

  renderer = new THREE.WebGLRenderer( { antialias: true } );

  renderer.setSize( container.offsetWidth, container.offsetHeight );
  renderer.setAnimationLoop( animation );
  console.log(renderer);
  container.appendChild( renderer.domElement );

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