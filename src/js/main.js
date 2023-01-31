import '../css/style.scss'
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

import Lenis from '@studio-freight/lenis';
import vertexSource from "./shader/vertexShader.glsl";
import fragmentSource from "./shader/fragmentShader.glsl";

import img from '../images/image.jpg';
// import img2 from '../images/photo03.jpg';
// import img2 from 'https://picsum.photos/id/237/2048/1024?grayscale';
import imgDisp1 from '../images/displacement.jpg';

class Main {
  constructor() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    this.canvas = document.querySelector("#canvas");
    this.renderer = null;
    this.scene = new THREE.Scene();
    this.camera = null;
    this.cameraFov = 45;
    this.cameraFovRadian = (this.cameraFov / 2) * (Math.PI / 180);
    this.cameraDistance = (this.viewport.height / 2) / Math.tan(this.cameraFovRadian);
    this.geometry = null;
    this.material = null;
    this.mesh = null;

    this.lenis = new Lenis({
      duration: 2.0,
    });

    this.loader = new THREE.TextureLoader();
    this.textures = [
      'https://picsum.photos/id/345/2048/1024?grayscale',
      'https://picsum.photos/id/411/2048/1024?grayscale',
      'https://picsum.photos/id/22/2048/1024?grayscale'
    ];
    this.loadTextures = [];
    this._setTexture();

    this.uniforms = {
      // uTime: {
      //   value: 0.0
      // },
      // uTex: {
      //   value: this.texture
      // },
      // uResolution: {
      //   value: new THREE.Vector2(this.viewport.width, this.viewport.height)
      // },
      // uTexResolution: {
      //   value: new THREE.Vector2(2048, 1024)
      // },
      uTime: {
        value: 0.0
      },
      uTexCurrent: {
        value: null
      },
      uTexNext: {
        value: null
      },
      uTexDisp: {
        value: null
      },
      uResolution: {
        value: new THREE.Vector2(this.viewport.width, this.viewport.height)
      },
      uTexResolution: {
        value: new THREE.Vector2(2048, 1024)
      },
      uProgress: {
        value: 0.0
      },
    };

    this.init();

    this._setAnimation();
  }

  _setRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.viewport.width, this.viewport.height);
  }

  _setCamera() {
    // this.camera = new THREE.PerspectiveCamera(45, this.viewport.width / this.viewport.height, 1, 100);
    // this.camera.position.set(0, 0, 5);
    // this.scene.add(this.camera);

    //ウインドウとWebGL座標を一致させる
    // const fov = 45;
    // const fovRadian = (fov / 2) * (Math.PI / 180); //視野角をラジアンに変換
    // const distance = (this.viewport.height / 2) / Math.tan(fovRadian); //ウインドウぴったりのカメラ距離
    this.camera = new THREE.PerspectiveCamera(this.cameraFov, this.viewport.width / this.viewport.height, 1, this.cameraDistance * 2);
    this.camera.position.z = this.cameraDistance;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.camera);
  }

  _setLight() {
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(1, 1, 1);
    this.scene.add(light);
  }

  _setTexture() {
    //テクスチャ
    for(let i = 0; i < this.textures.length; i++){
      this.loadTextures.push(this.loader.load(this.textures[i]));
    }
  }

  _addMesh() {
    //ジオメトリ
    this.geometry = new THREE.PlaneGeometry(this.viewport.width, this.viewport.height, 40, 40);

    //テクスチャ
    this.uniforms.uTexCurrent.value = this.loadTextures[0];
    this.uniforms.uTexNext.value = this.loadTextures[1];

    this.uniforms.uTexDisp.value = this.loader.load(imgDisp1);

    // console.log(this.texture);

    //マテリアル
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexSource,
      fragmentShader: fragmentSource,
      side: THREE.DoubleSide
    });

    //メッシュ
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  _setAnimation() {

    const tl1 = gsap.timeline({
      scrollTrigger: {
        trigger: '#section02',
        start: 'top center',
        toggleActions: 'play none none reverse',
        markers: true,
        onEnter: ()=> {
          console.log('on enter');
        },
        onLeaveBack: ()=> {
          console.log('on leaveback');
          this.uniforms.uTexCurrent.value = this.loadTextures[0];
          this.uniforms.uTexNext.value = this.loadTextures[1];
        }
      }
    });

    tl1.to(this.uniforms.uProgress, {
      value: 1.0,
      duration: 0.8,
      ease: "Expo.easeOut",
      onStart: ()=> {
        console.log('on start');
      },
      onComplete: ()=> {
        console.log('on complete');
        this.uniforms.uTexCurrent.value = this.loadTextures[1];
        this.uniforms.uTexNext.value = this.loadTextures[2];
        this.uniforms.uProgress.value = 0.0;
      },
      onReverseComplete: ()=> {
        console.log('on reverse complete');
        this.uniforms.uTexCurrent.value = this.loadTextures[0];
        this.uniforms.uTexNext.value = this.loadTextures[1];
        // this.uniforms.uProgress.value = 0.0;
      }
    })
  }

  init() {
    this._setRenderer();
    this._setCamera();
    this._setLight();
    this._addMesh();

    this._update();
    this._addEvent();
  }

  _update(time) {

    this.lenis.raf(time);

    this.uniforms.uTime.value += 0.03;

    //レンダリング
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this._update.bind(this));
  }

  _onResize() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }
    // レンダラーのサイズを修正
    this.renderer.setSize(this.viewport.width, this.viewport.height);
    // カメラのアスペクト比を修正
    this.camera.aspect = this.viewport.width / this.viewport.height;
    this.camera.updateProjectionMatrix();
    // カメラの位置を調整
    this.cameraDistance = (this.viewport.height / 2) / Math.tan(this.cameraFovRadian); //ウインドウぴったりのカメラ距離
    this.camera.position.z = this.cameraDistance;
    // uniforms変数に反映
    this.mesh.material.uniforms.uResolution.value.set(this.viewport.width, this.viewport.height);
    // meshのscale設定
    const scaleX = Math.round(this.viewport.width / this.mesh.geometry.parameters.width * 100) / 100 + 0.01;
    const scaleY = Math.round(this.viewport.height / this.mesh.geometry.parameters.height * 100) / 100 + 0.01;
    this.mesh.scale.set(scaleX, scaleY, 1);
  }

  _addEvent() {
    window.addEventListener("resize", this._onResize.bind(this));
  }
}

const main = new Main();
