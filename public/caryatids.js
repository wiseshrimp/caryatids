/*

TO DO:
- Connect db
- Setup controls
- Add image uploader to s3 & format image to be correct window ratio before saving
- Make wall/window look nice
- Fix text? Looks very blurry

*/

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
let isColliding = false
let boundingBox
let hasSwitched = false
let objects = []
let boundingBoxes = []

class App {
    constructor() {
        this.dots = []

        // Window position settings
        this.windowX = 0
        this.windowY = 4.1
        this.windowZ = -10.9
        this.windowXOffset = 10
        this.imageMeshes = []
        this.sockets = []
        
        this.door = null
        this.secondDoor = null
        this.isDoorMoving = false
        this.doorUpdate = false
        this.hasImagesLoaded = false

        this.direction = new THREE.Vector3()
        this.velocity = new THREE.Vector3()

        this.currentIdx = 0

        this.loadImages()
        this.setupScene()
        this.addEventListeners()
    }

    loadImages = () => {
        this.imageLoader = new THREE.TextureLoader()

        for (let idx = 0; idx < Images.length; idx++) {
            this.imageLoader.load(Images[idx], texture => {
                let mat = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true
                })
                mat.side = THREE.DoubleSide
                let mesh = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 100), mat)
                this.imageMeshes.push(mesh)
            })                             
        }
    }

    addEventListeners = () => {
        window.addEventListener('resize', this.onWindowResize)
    }

    onWindowResize = ev => {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize( window.innerWidth, window.innerHeight )
    }

    setupCamera = () => {
        this.camera = new THREE.PerspectiveCamera(
            this.fov,
            this.aspect,
            this.near,
            this.far
        )
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.camera.position.set(0, 1, 1300) // z = 1615
        this.raycaster = new THREE.Raycaster()

    }

    onSocketMove = (pos, rot) => {
        if (!this.socket) return
        this.socket.emit('move', {pos, rot})
    }

    setupControls = () => {
        this.controls = new THREE.PointerLockControls(this.camera, this.renderer.domElement, this.onSocketMove)
        this.controls.enableKeys = true
        this.controls.enableDamping = true
		this.controls.minPolarAngle = 0.8
		this.controls.maxPolarAngle = 2.4
        this.controls.dampingFactor = 0.0
        this.scene.add(this.controls.getObject())
        document.addEventListener('keydown', this.onKeyDown)
        document.addEventListener('keyup', this.onKeyUp)
        document.addEventListener('mousedown', this.onMouseDown)
        document.addEventListener('mouseup', this.onMouseUp)
    }

    onKeyDown = ev => {
        switch (ev.which) {
            case 38:
            case 87:
                moveForward = true
                return
            case 37:
            case 65:
                moveLeft = true
                return
            case 39:
            case 68:
                moveRight = true
                return
            case 40:
            case 83:
                moveBackward = true
                return
            default:
                return
        }
    }

    onKeyUp = ev => {
        switch (ev.which) {
            case 38:
            case 87:
                moveForward = false
                return
            case 37:
            case 65:
                moveLeft = false
                return
            case 39:
            case 68:
                moveRight = false
                return
            case 40:
            case 83:
                moveBackward = false
                return
            default:
                return
        }
    }

    setupScene = () => {
        this.scene = new THREE.Scene()
        let canvas = this.canvasEl = document.getElementById('canvas')
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true
        })
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.shadowMap.enabled = true
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping
        this.renderer.toneMappingExposure = 1
        this.renderer.outputEncoding = THREE.sRGBEncoding
        this.renderer.physicallyCorrectLights = true
        this.raycaster = new THREE.Raycaster()
        this.fov = 50
        this.aspect = 2 // Canvas default
        this.near = 5
        this.far = 1500

        this.setupCamera()
        this.setupControls()
        this.addScene()
        this.render()

        const pmremGenerator = new THREE.PMREMGenerator(this.renderer)
        pmremGenerator.compileEquirectangularShader()

        this.rgbeLoader = new THREE.RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .load('dawn.hdr', tex => {
            const envMap = pmremGenerator.fromEquirectangular(tex).texture
            this.scene.background = envMap
            this.scene.environment = envMap
            tex.dispose()
            pmremGenerator.dispose()
        })
    }

    addScene = () => {
        var loader = new THREE.GLTFLoader()
        loader.load( 'hallwaytest/DoubleHallway_Final.gltf', ( gltf ) => {
            this.gltf = gltf.scene
            gltf.scene.traverse( child => {
                if (child.isMesh) {
                    if (child.name === 'VideoArchOtherSide') {
                        let audreyVid = document.getElementById('audrey')
                        this.audreyVid = audreyVid
                        var texture = new THREE.VideoTexture( audreyVid )
                        texture.minFilter = THREE.LinearFilter
                        texture.magFilter = THREE.LinearFilter
                        texture.format = THREE.RGBFormat
                        child.geometry = new THREE.PlaneGeometry(1,    1, 1) 
                        child.rotation.set(-Math.PI / 2, 0, 0)
                        child.material = new THREE.MeshBasicMaterial({
                            map: texture,
                            side: THREE.DoubleSide
                        })
                        audreyVid.play()
                    }
                    if (child.name === 'VideoArch') {
                        child.geometry.dispose()
                        child.material.dispose()
                        child.visible = false
                    }
                    if (child.name === 'VideoWindow') {
                        let sculptureVid = document.getElementById('sculptures')
                        this.sculptureVid = sculptureVid
                        var texture = new THREE.VideoTexture( sculptureVid )
                        texture.minFilter = THREE.LinearFilter
                        texture.magFilter = THREE.LinearFilter
                        texture.format = THREE.RGBFormat
                        child.geometry = new THREE.PlaneGeometry(1,    1, 1) 
                        child.rotation.set(-Math.PI / 2, 0, -Math.PI / 2)
                        child.material = new THREE.MeshBasicMaterial({
                            map: texture
                        })
                        sculptureVid.play()
                    } else {
                        objects.push(child)

                    }
                    if (child.name === 'Image') {
                        if (child.parent) this.door = child.parent

                    }
                }
            } )
            gltf.scene.name = 'Hallway'
            gltf.scene.position.set(0, -20, 0)
            gltf.scene.scale.set(1, 1, 1)
            this.scene.add( gltf.scene )
        } )
    }

    loadVideos = () => {
        let sculptureVid = document.getElementById('sculptures')
    }

    onSocketConnect = data => {
        let mesh = this.imageMeshes[0].clone()
        mesh.position.set(data.pos.x, data.pos.y, data.pos.z)
        mesh.rotation.set(data.rot._x, data.rot._y, data.rot._z)
        mesh.name = 'user'
        this.sockets.push({
            id: data.id,
            mesh
        })
        console.log('connected')
        this.scene.add(mesh)
    }

    onSocketDisconnect = data => {
        console.log('onDisconnect', data)
        // let idx = this.sockets.findIndex(socket => socket.id === data.id)
        // this.scene.remove(this.sockets[idx])
        // this.sockets = this.sockets.splice(idx, 1)
    }

    onInitialLoad = meshes => {
        console.log(meshes)
        meshes.forEach(data => {
            let mesh = this.imageMeshes[0].clone()
            mesh.position.set(data.pos.x, data.pos.y, data.pos.z)
            mesh.rotation.set(data.rot._x, data.rot._y, data.rot._z)
            mesh.name = 'user'
            this.scene.add(mesh)
            this.sockets.push(data)
        })
    }

    setupSockets = () => {
        this.socket = io()
        this.socket.on('initialload', this.onInitialLoad)

        this.socket.emit('userconnect', {
            pos: {
                x: this.camera.position.x,
                y: this.camera.position.y,
                z: this.camera.position.z
            },
            rot: {
                x: this.camera.rotation._x,
                y: this.camera.rotation._y,
                z: this.camera.rotation._z
            }
        })
        this.socket.on('userconnect', this.onSocketConnect)
        this.socket.on('userdisconnect', this.onSocketDisconnect)
        this.socket.on('move', this.onMove)
    }

    onMove = data => {
        console.log(this.sockets)
        let idx = this.sockets.findIndex(socket => socket.id === data.id)
        this.sockets[idx].mesh.position.set(data.pos.x, data.pos.y, data.pos.z)
        this.sockets[idx].mesh.rotation.set(data.rot._x, data.rot._y, data.rot._z)
    }


    /* 
    Collision detection taken from Aidan Nelson's YORB 2020: https://github.com/AidanNelson/YORB2020 
    */

    checkCollisions = (pts, dir, arrowHelperOffset) => {
        let collisionDistance = 20
        for (let idx = 0; idx < pts.length; idx++) {
            let pt = pts[idx].clone()
            this.raycaster.set(pt, dir)
            let collisions = this.raycaster.intersectObjects(objects)
            if (collisions.length > 0 && collisions[0].distance < collisionDistance) {
                if (collisions[0].object.name === 'user') return
                if (collisions[0].object.name === 'VideoArch') {
                    this.passedArch1 = true
                    if (this.passedArch2) {
                        this.sculptureVid.play()
                        this.passedArch1 = false
                        this.passedArch2 = false
                    }
                    return
                }
                if (collisions[0].object.name === 'VideoArchOtherSide') {
                    this.passedArch2 = true
                    if (this.passedArch1) {
                        this.sculptureVid.pause()
                        this.passedArch1 = false
                        this.passedArch2 = false
                    }
                    return
                }
                return true
            }
        }
        return false
    }


    setupCollisionDetection() {
        this.obstacles = {
            forward: false,
            backward: false,
            right: false,
            left: false,
        }
    }

    detectCollisions = () => {
        this.obstacles = {
            forward: false,
            backward: false,
            right: false,
            left: false,
        }
        var matrix = new THREE.Matrix4()
        matrix.extractRotation(this.camera.matrix)
        var backwardDir = new THREE.Vector3(0, 0, 1).applyMatrix4(matrix)
        var forwardDir = backwardDir.clone().negate()
        var rightDir = forwardDir.clone().cross(new THREE.Vector3(0, 1, 0)).normalize()
        var leftDir = rightDir.clone().negate()

        // TODO more points around avatar so we can't be inside of walls
        let pt = this.controls.getObject().position.clone()

        this.forwardCollisionDetectionPoints = [pt]
        this.backwardCollisionDetectionPoints = [pt]
        this.rightCollisionDetectionPoints = [pt]
        this.leftCollisionDetectionPoints = [pt]

        // check forward
        this.obstacles.forward = this.checkCollisions(this.forwardCollisionDetectionPoints, forwardDir, 0)
        this.obstacles.backward = this.checkCollisions(this.backwardCollisionDetectionPoints, backwardDir, 4)
        this.obstacles.left = this.checkCollisions(this.leftCollisionDetectionPoints, leftDir, 8)
        this.obstacles.right = this.checkCollisions(this.rightCollisionDetectionPoints, rightDir, 12)
    }

    updateControls = () => {
        let time = performance.now()
        let rawDelta = (time - prevTime) / 1000

        this.velocity.x -= this.velocity.x * 5.0 * rawDelta
        this.velocity.z -= this.velocity.z * 5.0 * rawDelta
        this.velocity.y -= 9.8 * 100.0 * rawDelta // 100.0 = mass
        this.direction.z = Number( moveForward ) - Number( moveBackward )
        this.direction.x = Number( moveRight ) - Number( moveLeft )
        this.direction.normalize() // this ensures consistent movements in all .directions

        if ( moveForward || moveBackward ) this.velocity.z -= this.direction.z * 500.0 * rawDelta
        if ( moveLeft || moveRight ) this.velocity.x -= this.direction.x * 500.0 * rawDelta


        if ((this.velocity.x > 0 && !this.obstacles.left) || (this.velocity.x < 0 && !this.obstacles.right)) {
            this.controls.moveRight(- this.velocity.x * rawDelta)
        }
        if ((this.velocity.z > 0 && !this.obstacles.backward) || (this.velocity.z < 0 && !this.obstacles.forward)) {
            this.controls.moveForward(-this.velocity.z * rawDelta)
        }

        this.controls.getObject().position.y += ( this.velocity.y * rawDelta ) // new behavior

        if ( this.controls.getObject().position.y < 10 ) {

            this.velocity.y = 0
            this.controls.getObject().position.y = 5

            canJump = true

        }
        prevTime = time
    }
    
    render = (t) => {
        if (!this.hasImagesLoaded && this.imageMeshes.length === Images.length) {
            this.hasImagesLoaded = true
            console.log('sfdkl')
            this.setupSockets()
        }
        if (this.gltf) {
            this.detectCollisions()
            this.updateControls()
        }
        this.renderer.render(this.scene, this.camera)

        requestAnimationFrame(this.render)
    }
}

let app = new App()
