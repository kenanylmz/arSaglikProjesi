import React, {useMemo, useRef, useCallback} from 'react';
import {StyleSheet, View, PanResponder} from 'react-native';
import WebView from 'react-native-webview';

interface Props {
  modelFile: 'ilac1.glb' | 'ilac2.glb' | 'ilac3.glb';
  size?: number;
}

export function Model3DViewer({modelFile, size = 280}: Props) {
  const webviewRef = useRef<WebView>(null);
  const lastTouchRef = useRef<{x: number; y: number} | null>(null);
  const lastPinchDistRef = useRef<number | null>(null);
  const autoRotateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inject = useCallback((js: string) => {
    webviewRef.current?.injectJavaScript(js + '; true;');
  }, []);

  const resetAutoRotate = useCallback(() => {
    if (autoRotateTimerRef.current) {
      clearTimeout(autoRotateTimerRef.current);
    }
    autoRotateTimerRef.current = setTimeout(() => {
      inject('window.__startAutoRotate && window.__startAutoRotate()');
    }, 2500);
  }, [inject]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: evt => {
          inject('window.__stopAutoRotate && window.__stopAutoRotate()');
          if (autoRotateTimerRef.current) {
            clearTimeout(autoRotateTimerRef.current);
          }
          const touches = evt.nativeEvent.touches;
          if (touches.length === 1) {
            lastTouchRef.current = {x: touches[0].pageX, y: touches[0].pageY};
          } else if (touches.length === 2) {
            const dx = touches[0].pageX - touches[1].pageX;
            const dy = touches[0].pageY - touches[1].pageY;
            lastPinchDistRef.current = Math.sqrt(dx * dx + dy * dy);
          }
        },
        onPanResponderMove: evt => {
          const touches = evt.nativeEvent.touches;
          if (touches.length === 1 && lastTouchRef.current) {
            // Tek parmak: döndür
            const dx = touches[0].pageX - lastTouchRef.current.x;
            const dy = touches[0].pageY - lastTouchRef.current.y;
            inject(`window.__rotate && window.__rotate(${dx}, ${dy})`);
            lastTouchRef.current = {x: touches[0].pageX, y: touches[0].pageY};
          } else if (touches.length === 2 && lastPinchDistRef.current !== null) {
            // İki parmak: zoom
            const dx = touches[0].pageX - touches[1].pageX;
            const dy = touches[0].pageY - touches[1].pageY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const delta = lastPinchDistRef.current - dist;
            inject(`window.__zoom && window.__zoom(${delta})`);
            lastPinchDistRef.current = dist;
          }
        },
        onPanResponderRelease: () => {
          lastTouchRef.current = null;
          lastPinchDistRef.current = null;
          resetAutoRotate();
        },
        onPanResponderTerminate: () => {
          lastTouchRef.current = null;
          lastPinchDistRef.current = null;
          resetAutoRotate();
        },
      }),
    [inject, resetAutoRotate],
  );

  const html = useMemo(
    () => `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0}
html,body{width:100%;height:100%;background:transparent;overflow:hidden}
canvas{display:block}
</style>
<script type="importmap">
{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}
</script>
</head>
<body>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const W = window.innerWidth, H = window.innerHeight;
const renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});
renderer.setSize(W, H);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, W/H, 0.01, 100);
camera.position.set(0, 0.1, 0.55);

scene.add(new THREE.AmbientLight(0xffffff, 1.0));
const d1 = new THREE.DirectionalLight(0xffffff, 2.0);
d1.position.set(2,3,2); scene.add(d1);
const d2 = new THREE.DirectionalLight(0xaaccff, 0.8);
d2.position.set(-2,1,-1); scene.add(d2);

// Spherical coords - kamera pozisyonu
let spherical = {theta: 0, phi: Math.PI/2, radius: 0.55};
let autoRotate = true;
let model = null;
let floatTime = 0;

function updateCamera(){
  camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
  camera.position.y = spherical.radius * Math.cos(spherical.phi);
  camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
  camera.lookAt(0, 0, 0);
}
updateCamera();

// React Native'den çağrılacak kontrol fonksiyonları
window.__rotate = function(dx, dy){
  spherical.theta -= dx * 0.008;
  spherical.phi = Math.max(0.2, Math.min(Math.PI - 0.2, spherical.phi + dy * 0.008));
  updateCamera();
};
window.__zoom = function(delta){
  spherical.radius = Math.max(0.2, Math.min(1.5, spherical.radius + delta * 0.005));
  updateCamera();
};
window.__stopAutoRotate = function(){ autoRotate = false; };
window.__startAutoRotate = function(){ autoRotate = true; };

// Model yükle
const loader = new GLTFLoader();
const buf = await new Promise((res, rej) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'file:///android_asset/models/${modelFile}', true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = () => res(xhr.response);
  xhr.onerror = rej;
  xhr.send();
});
const gltf = await new Promise((res, rej) => loader.parse(buf, '', res, rej));
model = gltf.scene;

const box = new THREE.Box3().setFromObject(model);
const center = box.getCenter(new THREE.Vector3());
const maxDim = Math.max(...box.getSize(new THREE.Vector3()).toArray());
const sc = 0.28 / maxDim;
model.scale.setScalar(sc);
model.position.copy(center.clone().multiplyScalar(-sc));
scene.add(model);

const clock = new THREE.Clock();
(function animate(){
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  if(autoRotate){ spherical.theta += dt * 0.8; updateCamera(); }
  if(model && autoRotate){
    floatTime += dt;
    model.position.y = Math.sin(floatTime * 1.2) * 0.010 - center.y * sc;
  }
  renderer.render(scene, camera);
})();
</script>
</body>
</html>`,
    [modelFile],
  );

  return (
    <View
      style={[styles.container, {width: size, height: size}]}
      {...panResponder.panHandlers}>
      <WebView
        ref={webviewRef}
        source={{html, baseUrl: 'file:///android_asset/models/'}}
        style={styles.webview}
        originWhitelist={['*']}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
        javaScriptEnabled={true}
        domStorageEnabled={true}
        androidLayerType="hardware"
        overScrollMode="never"
        scrollEnabled={false}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
