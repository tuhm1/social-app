import * as FaceDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';
import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { Button, Dimmer, Loader } from 'semantic-ui-react';
import { AmbientLight, ConeGeometry, DoubleSide, HemisphereLight, IcosahedronGeometry, Mesh, MeshNormalMaterial, MeshStandardMaterial, OrthographicCamera, Scene, SpotLight, TextureLoader, WebGLRenderer } from 'three';
import { VideoStreamMerger } from 'video-stream-merger';
import css from '../styles/FaceFilter.module.css';
import { FaceMeshFaceGeometry } from '../FaceMeshGeometry/js/face';

export default function Filter() {
    const filterByNames = {
        'Horn': createHornFilter,
        'Face Paint': createFacePaintFilter,
        'Mask': createNormalFilter,
        'Clown': createClownFilter
    };
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [[record], setRecord] = useState([null]);
    const [[stop], setStop] = useState([null]);
    const [selected, setSelected] = useState(0);
    const [[select], setSelect] = useState([null]);

    useEffect(() => {
        if (!videoRef.current || !canvasRef.current) return;
        let updated, cleanup;
        (async function () {
            const model = await loadModel();
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = videoRef.current;
            const canvas = canvasRef.current;
            video.autoplay = true;
            video.srcObject = stream;
            video.onplay = async () => {
                const renderer = new WebGLRenderer({ antialias: true, alpha: true, canvas });
                renderer.setPixelRatio(window.devicePixelRatio);
                renderer.setSize(video.clientWidth, video.clientHeight);
                const filters = Object.values(filterByNames).map(fn => fn(renderer, video));
                let selected = 0;
                setSelect([i => {
                    selected = i;
                    setSelected(i);
                }]);
                let stop = false;
                const update = async () => {
                    if (stop) return;
                    const faces = await model.estimateFaces({ input: video, predictIrises: false });
                    filters[selected].render(faces);
                    requestAnimationFrame(update);
                };
                update();
                setRecord([() => recordVideoWithFilter(video, canvas)]);
                cleanup = () => {
                    stop = true;
                    stream.getTracks().forEach(t => t.stop());
                }
                if (updated) cleanup();
            }
        })();
        return () => {
            if (cleanup) cleanup();
            else updated = true;
        }
    }, [videoRef.current, canvasRef.current]);
    return <div className={css.page}>
        <Head>
            <title>Face Filters</title>
        </Head>
        <div className={css.center}>
            <div className={css.videoContainer}>
                <video ref={videoRef} />
                <canvas ref={canvasRef} className={css.canvas} />
            </div>
        </div>
        {!record && <Dimmer active><Loader /></Dimmer>}
        <div className={css.buttons}>
            {record && !stop
                && <Button onClick={() => {
                    const stop = record();
                    setStop([stop]);
                }} inverted color='red'>
                    Record
                </Button>
            }
            {stop
                && <Button onClick={async () => {
                    const blob = await stop();
                    window.opener.postMessage(blob);
                    window.close()
                }} color='red'>
                    Stop
                </Button>
            }
            {Object.keys(filterByNames).map((name, i) =>
                <Button onClick={() => select && select(i)}
                    inverted={i !== selected}
                    color='blue' key={name}
                >
                    {name}
                </Button>
            )}
        </div>
    </div>
}

async function loadModel() {
    await tf.setBackend('webgl');
    return FaceDetection.load(
        FaceDetection.SupportedPackages.mediapipeFacemesh,
        { maxFaces: 1, shouldLoadIrisModel: false }
    );
}

function createNormalFilter(renderer, video) {
    const scene = new Scene();
    const light = new HemisphereLight(0xB1E1FF, 0xB97A20, 1);
    scene.add(light);

    const camera = new OrthographicCamera(1, 1, 1, 1, -1000, 1000);
    const width = video.videoWidth;
    const height = video.videoHeight;
    camera.left = -.5 * width;
    camera.right = .5 * width;
    camera.top = .5 * height;
    camera.bottom = -.5 * height;
    camera.updateProjectionMatrix();

    const render = faces => {
        const masks = faces.map(face => {
            const geometry = new FaceMeshFaceGeometry();
            geometry.setSize(width, height);
            geometry.update(face);
            const material = new MeshNormalMaterial();
            const mask = new Mesh(geometry, material);
            return mask;
        });
        masks.forEach(mask => {
            scene.add(mask);
        });
        renderer.render(scene, camera);
        masks.forEach(mask => {
            scene.remove(mask);
            mask.geometry.dispose();
            mask.material.dispose();
        });
    }
    return { render };
}

function createFacePaintFilter(renderer, video) {
    const scene = new Scene();
    const light = new HemisphereLight(0xB1E1FF, 0xB97A20, 1);
    scene.add(light);

    const camera = new OrthographicCamera(1, 1, 1, 1, -1000, 1000);
    const width = video.videoWidth;
    const height = video.videoHeight;
    camera.left = -.5 * width;
    camera.right = .5 * width;
    camera.top = .5 * height;
    camera.bottom = -.5 * height;
    camera.updateProjectionMatrix();

    const material = new MeshStandardMaterial({
        map: new TextureLoader().load('facepaint.png'),
        transparent: true
    });

    const render = faces => {
        const masks = faces.map(face => {
            const geometry = new FaceMeshFaceGeometry();
            geometry.setSize(width, height);
            geometry.update(face);
            const mask = new Mesh(geometry, material);
            return mask;
        });
        masks.forEach(mask => {
            scene.add(mask);
        });
        renderer.render(scene, camera);
        masks.forEach(mask => {
            scene.remove(mask);
            mask.geometry.dispose();
        });
    }
    return { render };
}

function createHornFilter(renderer, video) {
    const scene = new Scene();
    const light = new HemisphereLight(0xB1E1FF, 0xB97A20, 1);
    scene.add(light);

    const camera = new OrthographicCamera(1, 1, 1, 1, -1000, 1000);
    const width = video.videoWidth;
    const height = video.videoHeight;
    camera.left = -.5 * width;
    camera.right = .5 * width;
    camera.top = .5 * height;
    camera.bottom = -.5 * height;
    camera.updateProjectionMatrix();

    const render = faces => {
        const noses = faces.map(face => {
            const geometry = new FaceMeshFaceGeometry();
            geometry.setSize(width, height);
            geometry.update(face);
            const noseGeometry = new ConeGeometry(1, 10, 30);
            const material = new MeshNormalMaterial();
            const nose = new Mesh(noseGeometry, material);
            const track = geometry.track(5, 45, 275);
            nose.position.copy(track.position);
            nose.rotation.setFromRotationMatrix(track.rotation);
            nose.rotateX(-Math.PI / 2);
            nose.scale.setScalar(nose.position.z);
            return nose;
        });
        noses.forEach(nose => {
            scene.add(nose);
        });
        renderer.render(scene, camera);
        noses.forEach(nose => {
            scene.remove(nose);
            nose.geometry.dispose();
            nose.material.dispose();
        });
    }
    return { render };
}

function createClownFilter(renderer, video) {
    const scene = new Scene();
    const spotLight = new SpotLight(0xffffbb, 1);
    spotLight.position.set(0.5, 0.5, 1);
    spotLight.position.multiplyScalar(400);
    scene.add(spotLight);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 200;
    spotLight.shadow.camera.far = 800;
    spotLight.shadow.camera.fov = 40;
    spotLight.shadow.bias = -0.001125;
    scene.add(spotLight);
    const hemiLight = new HemisphereLight(0xffffbb, 0x080820, 0.25);
    scene.add(hemiLight);
    const ambientLight = new AmbientLight(0x404040, 0.25);
    scene.add(ambientLight);

    const camera = new OrthographicCamera(1, 1, 1, 1, -1000, 1000);
    const width = video.videoWidth;
    const height = video.videoHeight;
    camera.left = -.5 * width;
    camera.right = .5 * width;
    camera.top = .5 * height;
    camera.bottom = -.5 * height;
    camera.updateProjectionMatrix();

    const colorTexture = new TextureLoader().load("mesh_map.jpg");
    const aoTexture = new TextureLoader().load("ao.jpg");
    const alphaTexture = new TextureLoader().load("mask.png");
    const render = faces => {
        const masks = faces.map(face => {
            const faceGeometry = new FaceMeshFaceGeometry();
            faceGeometry.setSize(width, height);
            faceGeometry.update(face); 
            const faceMaterial = new MeshStandardMaterial({
                color: 0x808080,
                roughness: 0.8,
                metalness: 0.1,
                alphaMap: alphaTexture,
                aoMap: aoTexture,
                //map: colorTexture,
                roughnessMap: colorTexture,
                transparent: true,
                side: DoubleSide,
            });
            const mask = new Mesh(faceGeometry, faceMaterial);

            const noseMaterial = new MeshStandardMaterial({
                color: 0xff2010,
                roughness: 0.4,
                metalness: 0.1,
                transparent: true,
            });
            const nose = new Mesh(new IcosahedronGeometry(1, 3), noseMaterial);
            nose.castShadow = nose.receiveShadow = true;
            const track = faceGeometry.track(5, 45, 275);
            nose.position.copy(track.position);
            nose.rotation.setFromRotationMatrix(track.rotation);
            nose.rotateX(-Math.PI / 2);
            nose.scale.setScalar(40);
            return [mask, nose];
        });
        masks.forEach(([mask, nose]) => {
            scene.add(mask);
            scene.add(nose);
        });
        renderer.render(scene, camera);
        masks.forEach(([mask, nose]) => {
            scene.remove(mask);
            mask.geometry.dispose();
            mask.material.dispose();
            scene.remove(nose);
            nose.geometry.dispose();
            nose.material.dispose();
        });
    }
    return { render };
}

function recordVideoWithFilter(video, canvas) {
    const merger = new VideoStreamMerger({
        width: video.videoWidth,
        height: video.videoHeight
    });
    const stream = canvas.captureStream();
    merger.addMediaElement('video', video);
    merger.addStream(stream);
    merger.start();
    const recorder = new MediaRecorder(merger.result, {});
    recorder.start();
    return () => new Promise(resolve => {
        recorder.ondataavailable = e => {
            resolve(new Blob([e.data]));
        };
        recorder.stop();
    });
}