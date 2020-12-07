THREE.PointerLockControls = function ( camera, domElement, socketMessage ) {

	if ( domElement === undefined ) {

		console.warn( 'THREE.PointerLockControls: The second parameter "domElement" is now mandatory.' );
		domElement = document.body;

	}

	this.domElement = domElement;
	this.isLocked = false;
	this.socketMessage = socketMessage
	this.lastPos

	// Set to constrain the pitch of the camera
	// Range is 0 to Math.PI radians
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	//
	// internals
	//

	var scope = this;

	var changeEvent = new Event('change')
	var lockEvent = new Event('lock')
	var unlockEvent = new Event('unlock')

	var euler = new THREE.Euler( 0, 0, 0, 'YXZ' );

	var PI_2 = Math.PI / 2;

    var vec = new THREE.Vector3();
    
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)


	function onMouseMove( event ) {
		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		euler.setFromQuaternion( camera.quaternion );

		euler.y += movementX * 0.001;
		euler.x += movementY * 0.001;

		euler.x = Math.max( PI_2 - scope.maxPolarAngle, Math.min( PI_2 - scope.minPolarAngle, euler.x ) );

		camera.quaternion.setFromEuler( euler );

		document.dispatchEvent( changeEvent );

    }
    
    function onMouseDown (ev) {
        document.addEventListener( 'mousemove', onMouseMove, false );

    }
    function onMouseUp (ev) {
        document.removeEventListener('mousemove', onMouseMove, false)
    }

	function onPointerlockChange() {
        document.dispatchEvent( lockEvent );

        scope.isLocked = true;

		// if ( scope.domElement.ownerDocument.pointerLockElement === scope.domElement ) {

		// 	document.dispatchEvent( lockEvent );

		// 	scope.isLocked = true;

		// } else {

		// 	document.dispatchEvent( unlockEvent );

		// 	scope.isLocked = false;

		// }

	}

	function onPointerlockError() {

		console.error( 'THREE.PointerLockControls: Unable to use Pointer Lock API' );

	}

	this.connect = function () {

		document.addEventListener( 'mousemove', onMouseMove, false );

	};

	this.disconnect = function () {

		document.removeEventListener( 'mousemove', onMouseMove, false );

	};

	this.dispose = function () {

		this.disconnect();

	};

	this.getObject = function () { // retaining this method for backward compatibility

		return camera;

	};

	this.getDirection = function () {

		var direction = new THREE.Vector3( 0, 0, - 1 );

		return function ( v ) {

			return v.copy( direction ).applyQuaternion( camera.quaternion );

		};

	}();

	this.moveForward = function ( distance, isClose) {

		// move forward parallel to the xz-plane
		// assumes camera.up is y-up

		vec.setFromMatrixColumn( camera.matrix, 0 )

		vec.crossVectors( camera.up, vec );
		camera.position.addScaledVector( vec, distance );
		if (Math.round(distance) != 0) {
			this.socketMessage(camera.position, camera.rotation)
		}
	};

	this.moveRight = function ( distance, isClose) {

		vec.setFromMatrixColumn( camera.matrix, 0 );

		camera.position.addScaledVector( vec, distance );
		if (Math.round(distance) != 0) {
			this.socketMessage(camera.position, camera.rotation)
		}

	};

	this.lock = function () {

		// this.domElement.requestPointerLock();

	};

	this.unlock = function () {

		// scope.domElement.ownerDocument.exitPointerLock();

	};


};
