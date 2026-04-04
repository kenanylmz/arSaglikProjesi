import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import WebView from 'react-native-webview';

interface Props {
  modelFile: 'ilac1.glb' | 'ilac2.glb';
  size?: number;
}

export function Model3DViewer({modelFile, size = 280}: Props) {
  const html = useMemo(
    () => `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0}
html,body{width:100%;height:100%;background:transparent;overflow:hidden}
canvas{width:100%!important;height:100%!important;display:block;background:transparent}
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
// Minimal Three.js GLB renderer - inline
(function(){
  var canvas = document.getElementById('c');
  var gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if(!gl) { document.body.innerHTML='<p style="color:white;text-align:center;padding:20px">WebGL desteklenmiyor</p>'; return; }

  // Three.js'yi CDN'den yükle
  var s1 = document.createElement('script');
  s1.src = 'https://unpkg.com/three@0.160.0/build/three.min.js';
  s1.onload = function(){
    var s2 = document.createElement('script');
    s2.src = 'https://unpkg.com/three@0.160.0/examples/js/loaders/GLTFLoader.js';
    s2.onload = initScene;
    document.head.appendChild(s2);
  };
  document.head.appendChild(s1);

  function initScene(){
    var W = canvas.clientWidth, H = canvas.clientHeight;
    canvas.width = W * 2; canvas.height = H * 2;

    var renderer = new THREE.WebGLRenderer({canvas:canvas, alpha:true, antialias:true});
    renderer.setSize(W, H);
    renderer.setPixelRatio(2);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;

    var scene = new THREE.Scene();

    var camera = new THREE.PerspectiveCamera(45, W/H, 0.1, 100);
    camera.position.set(0, 0.15, 0.5);
    camera.lookAt(0, 0.05, 0);

    // Işıklandırma
    var amb = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(amb);
    var dir1 = new THREE.DirectionalLight(0xffffff, 1.5);
    dir1.position.set(2, 3, 2);
    scene.add(dir1);
    var dir2 = new THREE.DirectionalLight(0xaaccff, 0.6);
    dir2.position.set(-2, 1, -1);
    scene.add(dir2);
    var point = new THREE.PointLight(0xfff0dd, 0.5, 10);
    point.position.set(0, 2, 0);
    scene.add(point);

    // Model yükle
    var loader = new THREE.GLTFLoader();
    var modelUrl = 'file:///android_asset/models/${modelFile}';

    loader.load(modelUrl, function(gltf){
      var model = gltf.scene;

      // Modeli ortala ve boyutlandır
      var box = new THREE.Box3().setFromObject(model);
      var center = box.getCenter(new THREE.Vector3());
      var bsize = box.getSize(new THREE.Vector3());
      var maxDim = Math.max(bsize.x, bsize.y, bsize.z);
      var scale = 0.3 / maxDim;
      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));

      scene.add(model);

      // Animasyon döngüsü
      var clock = new THREE.Clock();
      function animate(){
        requestAnimationFrame(animate);
        var t = clock.getElapsedTime();
        model.rotation.y = t * 0.8;
        model.position.y = Math.sin(t * 1.5) * 0.015;
        renderer.render(scene, camera);
      }
      animate();

    }, undefined, function(err){
      // file:// başarısız olursa XHR ile dene
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'file:///android_asset/models/${modelFile}', true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function(){
        if(xhr.status === 200 || xhr.status === 0){
          loader.parse(xhr.response, '', function(gltf){
            var model = gltf.scene;
            var box = new THREE.Box3().setFromObject(model);
            var center = box.getCenter(new THREE.Vector3());
            var bsize = box.getSize(new THREE.Vector3());
            var maxDim = Math.max(bsize.x, bsize.y, bsize.z);
            var scale = 0.3 / maxDim;
            model.scale.setScalar(scale);
            model.position.sub(center.multiplyScalar(scale));
            scene.add(model);
            var clock = new THREE.Clock();
            function animate(){
              requestAnimationFrame(animate);
              var t = clock.getElapsedTime();
              model.rotation.y = t * 0.8;
              model.position.y = Math.sin(t * 1.5) * 0.015;
              renderer.render(scene, camera);
            }
            animate();
          });
        }
      };
      xhr.send();
    });
  }
})();
</script>
</body>
</html>`,
    [modelFile],
  );

  return (
    <View style={[styles.container, {width: size, height: size}]}>
      <WebView
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
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        setBuiltInZoomControls={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
