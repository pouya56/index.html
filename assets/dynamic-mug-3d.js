/* ==========================================================================
   Dynamic Mug 3D — live WebGL preview for the Sublimation customizer
   --------------------------------------------------------------------------
   Self-contained module. Loads Three.js (r128) + GLTFLoader + OrbitControls
   from a CDN on first use, renders a 3D mug from a .glb model, and wraps the
   customer's flat design onto the mug body as a live texture.

   Public API:
     const viewer = await DynMug3D.create(containerEl, opts);
     viewer.setDesignCanvas(canvasOrImage);   // feed the flat design
     viewer.refresh();                          // design pixels changed
     const dataUrl = await viewer.snapshot();   // PNG for the cart mockup
     viewer.resize(); viewer.dispose();

   opts (all optional except modelUrl):
     modelUrl     (string)  URL of the .glb  (required)
     arcDeg       (number)  how many degrees of the mug the print wraps  [200]
     radiusScale  (number)  decal radius vs. body radius                 [1.02]
     heightFrac   (number)  print band height as a fraction of the mug   [0.55]
     yOffset      (number)  print band vertical nudge, -1..1             [0]
     rotationDeg  (number)  spin the print around the mug                [0]
     flipY        (bool)    flip the design vertically                   [false]
     autoRotate   (bool)    gently spin the mug when idle                [true]
     onReady/onError/onProgress (fn)
   ========================================================================== */
(function () {
  "use strict";
  var R = "0.128.0";
  // Each lib lists mirror hosts tried in order — if one host is blocked by a
  // store's CSP or is down, the next is tried. Merchants can also self-host by
  // pre-loading THREE + GLTFLoader + OrbitControls before this script runs.
  var HOSTS = [
    "https://cdn.jsdelivr.net/npm/three@" + R,
    "https://unpkg.com/three@" + R,
    "https://cdn.jsdelivr.net/npm/three@" + R  // retry primary once
  ];
  var LIB_PATHS = [
    "/build/three.min.js",
    "/examples/js/loaders/GLTFLoader.js",
    "/examples/js/controls/OrbitControls.js"
  ];

  var _libs = null;
  function loadOne(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = src; s.async = false;
      s.onload = function () { res(); };
      s.onerror = function () { if (s.parentNode) s.parentNode.removeChild(s); rej(new Error("Failed to load " + src)); };
      document.head.appendChild(s);
    });
  }
  // Load a lib, checking `ready()` first (may already be present) and trying
  // each mirror host until one succeeds.
  async function loadLib(path, ready) {
    if (ready && ready()) return;
    var lastErr = null;
    for (var i = 0; i < HOSTS.length; i++) {
      try { await loadOne(HOSTS[i] + path); if (!ready || ready()) return; }
      catch (e) { lastErr = e; }
    }
    if (ready && ready()) return;
    throw lastErr || new Error("Could not load " + path);
  }
  function ensureLibs() {
    if (_libs) return _libs;
    _libs = (async function () {
      await loadLib(LIB_PATHS[0], function () { return !!window.THREE; });
      await loadLib(LIB_PATHS[1], function () { return !!(window.THREE && window.THREE.GLTFLoader); });
      await loadLib(LIB_PATHS[2], function () { return !!(window.THREE && window.THREE.OrbitControls); });
      if (!window.THREE || !window.THREE.GLTFLoader) throw new Error("Failed to load three GLTFLoader");
      return window.THREE;
    })();
    return _libs;
  }

  function num(v, d) { v = parseFloat(v); return isFinite(v) ? v : d; }
  function median(arr) {
    if (!arr.length) return 0;
    var a = arr.slice().sort(function (x, y) { return x - y; });
    var mid = a.length >> 1;
    return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
  }

  function Viewer(container, opts) {
    this.container = container;
    this.opts = opts || {};
    this.disposed = false;
    this._designSource = null;
    this._raf = 0;
  }

  Viewer.prototype.init = async function () {
    var THREE = await ensureLibs();
    this.THREE = THREE;
    if (this.disposed) return this;
    this._setup();
    await this._loadModel();
    if (this.disposed) return this;
    this._buildDecal();
    this._loop();
    if (typeof this.opts.onReady === "function") { try { this.opts.onReady(this); } catch (e) {} }
    return this;
  };

  Viewer.prototype._setup = function () {
    var THREE = this.THREE, c = this.container;
    var w = Math.max(1, c.clientWidth || 400), h = Math.max(1, c.clientHeight || 400);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(w, h);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";
    c.appendChild(renderer.domElement);
    this.renderer = renderer;

    var scene = new THREE.Scene();
    if (this.opts.bg) { scene.background = new THREE.Color(this.opts.bg); }
    this.scene = scene;

    var camera = new THREE.PerspectiveCamera(35, w / h, 0.01, 100);
    camera.position.set(0, 0.1, 4);
    this.camera = camera;

    // Soft studio lighting for a clean white-ceramic look.
    var hemi = new THREE.HemisphereLight(0xffffff, 0xdfe4ea, 0.85);
    scene.add(hemi);
    var key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(2.5, 3.5, 3);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-3, 1, -2);
    scene.add(fill);
    var rim = new THREE.DirectionalLight(0xffffff, 0.6);
    rim.position.set(0, 2, -4);
    scene.add(rim);
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 2;
    controls.maxDistance = 7;
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.86;
    controls.autoRotate = this.opts.autoRotate !== false;
    controls.autoRotateSpeed = 1.1;
    var self = this;
    controls.addEventListener("start", function () { controls.autoRotate = false; });
    this.controls = controls;

    this._model = new THREE.Group();
    scene.add(this._model);

    if (typeof ResizeObserver !== "undefined") {
      this._ro = new ResizeObserver(function () { self.resize(); });
      this._ro.observe(c);
    }
  };

  Viewer.prototype._loadModel = function () {
    var THREE = this.THREE, self = this;
    return new Promise(function (resolve, reject) {
      if (!self.opts.modelUrl) { reject(new Error("No modelUrl provided")); return; }
      var loader = new THREE.GLTFLoader();
      loader.load(
        self.opts.modelUrl,
        function (gltf) {
          try {
            var obj = gltf.scene || (gltf.scenes && gltf.scenes[0]);
            // Normalise: centre at origin, scale so the tallest side ≈ 2 units.
            var box = new THREE.Box3().setFromObject(obj);
            var size = new THREE.Vector3(); box.getSize(size);
            var center = new THREE.Vector3(); box.getCenter(center);
            var maxDim = Math.max(size.x, size.y, size.z) || 1;
            var s = 2 / maxDim;
            obj.position.sub(center);          // centre
            var wrap = new THREE.Group();
            wrap.add(obj);
            wrap.scale.setScalar(s);
            self._model.add(wrap);

            // Recompute normalised metrics for the decal.
            var nbox = new THREE.Box3().setFromObject(self._model);
            var nsize = new THREE.Vector3(); nbox.getSize(nsize);
            var ncenter = new THREE.Vector3(); nbox.getCenter(ncenter);
            self._metrics = self._fitBody(nbox, nsize, ncenter);
            resolve(gltf);
          } catch (e) { reject(e); }
        },
        function (ev) { if (typeof self.opts.onProgress === "function") { try { self.opts.onProgress(ev); } catch (e) {} } },
        function (err) { reject(err || new Error("GLTF load error")); }
      );
    });
  };

  // Estimate the mug BODY (ignoring the handle) by sampling mesh vertices in
  // world space: the horizontal centre comes from the vertices around mid-height
  // (a robust centre that isn't dragged sideways by the handle), and the radius
  // from a high percentile of their distance to that centre (the handle is a few
  // far outliers, so a percentile lands on the body surface).
  Viewer.prototype._fitBody = function (nbox, nsize, ncenter) {
    var THREE = this.THREE;
    var fallback = { radius: Math.min(nsize.x, nsize.z) / 2, height: nsize.y, cx: ncenter.x, cy: ncenter.y, cz: ncenter.z };
    try {
      var yMid = ncenter.y, yHalf = nsize.y * 0.25;   // middle 50% of the height
      var v = new THREE.Vector3();
      var xs = [], zs = [];
      var pts = [];
      this._model.updateMatrixWorld(true);
      this._model.traverse(function (o) {
        if (!o.isMesh || !o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
        var pos = o.geometry.attributes.position, mw = o.matrixWorld;
        for (var i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i).applyMatrix4(mw);
          if (Math.abs(v.y - yMid) > yHalf) continue;   // only the mid band
          xs.push(v.x); zs.push(v.z); pts.push(v.x, v.z);
        }
      });
      if (xs.length < 50) return fallback;
      // Median centre — robust to the handle cluster on one side.
      var cx = median(xs), cz = median(zs);
      // Radius = 82nd percentile distance from centre (body surface, not handle).
      var d = [];
      for (var k = 0; k < pts.length; k += 2) d.push(Math.hypot(pts[k] - cx, pts[k + 1] - cz));
      d.sort(function (a, b) { return a - b; });
      var radius = d[Math.floor(d.length * 0.82)] || fallback.radius;
      return { radius: radius, height: nsize.y, cx: cx, cy: ncenter.y, cz: cz };
    } catch (e) { return fallback; }
  };

  Viewer.prototype._buildDecal = function () {
    var THREE = this.THREE, o = this.opts, m = this._metrics || { radius: 0.66, height: 1.8, cy: 0 };
    // this.fit holds the current (live-tunable) fit values.
    if (!this.fit) this.fit = {
      arcDeg: num(o.arcDeg, 200), radiusScale: num(o.radiusScale, 1.02),
      heightFrac: num(o.heightFrac, 0.55), yOffset: num(o.yOffset, 0),
      rotationDeg: num(o.rotationDeg, 0), flipY: o.flipY === true
    };
    var arcDeg = this.fit.arcDeg;
    var radiusScale = this.fit.radiusScale;
    var heightFrac = this.fit.heightFrac;
    var yOffset = this.fit.yOffset;
    var rotationDeg = this.fit.rotationDeg;

    var r = m.radius * radiusScale;
    var bandH = m.height * heightFrac;
    var arc = THREE.MathUtils.degToRad(Math.max(20, Math.min(340, arcDeg)));

    // Open cylinder segment spanning `arc`, centred on the +Z face (toward the
    // camera). In THREE, cylinder theta=0 is +Z, so start the segment at -arc/2.
    var geo = new THREE.CylinderGeometry(r, r, bandH, 96, 1, true, -arc / 2, arc);

    // Blank transparent texture until a design is supplied.
    var tex = this._makeTexture();
    this._decalTex = tex;

    var mat = new THREE.MeshStandardMaterial({
      map: tex, transparent: true, alphaTest: 0.01,
      roughness: 0.55, metalness: 0.0,
      side: THREE.FrontSide, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(m.cx || 0, (m.cy || 0) + yOffset * bandH, m.cz || 0);
    mesh.rotation.y = THREE.MathUtils.degToRad(rotationDeg);
    this._model.add(mesh);
    this._decal = mesh;
    if (this._designSource) this._applyDesign();
  };

  Viewer.prototype._removeDecal = function () {
    if (!this._decal) return;
    try { this._model.remove(this._decal); } catch (e) {}
    try { if (this._decal.geometry) this._decal.geometry.dispose(); } catch (e) {}
    try { if (this._decal.material) { if (this._decal.material.map) this._decal.material.map.dispose(); this._decal.material.dispose(); } } catch (e) {}
    this._decal = null; this._decalTex = null;
  };

  // Live-adjust the wrap fit (used by the in-popup tuner). Rebuilds the decal
  // in place without reloading the model. Returns the current fit values.
  Viewer.prototype.setFit = function (partial) {
    if (!this.fit) this.fit = {};
    if (partial) {
      if (partial.arcDeg != null) this.fit.arcDeg = num(partial.arcDeg, this.fit.arcDeg);
      if (partial.radiusScale != null) this.fit.radiusScale = num(partial.radiusScale, this.fit.radiusScale);
      if (partial.heightFrac != null) this.fit.heightFrac = num(partial.heightFrac, this.fit.heightFrac);
      if (partial.yOffset != null) this.fit.yOffset = num(partial.yOffset, this.fit.yOffset);
      if (partial.rotationDeg != null) this.fit.rotationDeg = num(partial.rotationDeg, this.fit.rotationDeg);
      if (partial.flipY != null) this.fit.flipY = !!partial.flipY;
    }
    if (this.THREE && this._model) { this._removeDecal(); this._buildDecal(); }
    return this.fit;
  };

  Viewer.prototype._makeTexture = function () {
    var THREE = this.THREE;
    var cv = document.createElement("canvas"); cv.width = 4; cv.height = 4;
    var tex = new THREE.CanvasTexture(cv);
    var flip = this.fit ? this.fit.flipY : (this.opts.flipY === true);
    tex.flipY = flip ? true : false;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = this.renderer ? this.renderer.capabilities.getMaxAnisotropy() : 1;
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  };

  // Accept a <canvas> or an <img>/Image. Stored and drawn to the decal texture.
  Viewer.prototype.setDesignCanvas = function (src) {
    this._designSource = src || null;
    this._applyDesign();
  };
  Viewer.prototype.refresh = function () { this._applyDesign(); };

  Viewer.prototype._applyDesign = function () {
    if (!this._decalTex || !this._designSource) return;
    var src = this._designSource;
    var sw = src.width || src.naturalWidth || 0, sh = src.height || src.naturalHeight || 0;
    if (!sw || !sh) return;
    var img = this._decalTex.image;
    if (!img || img.width !== sw || img.height !== sh) {
      img = document.createElement("canvas"); img.width = sw; img.height = sh;
      this._decalTex.image = img;
    }
    var ctx = img.getContext("2d");
    ctx.clearRect(0, 0, sw, sh);
    try { ctx.drawImage(src, 0, 0, sw, sh); } catch (e) {}
    this._decalTex.needsUpdate = true;
  };

  Viewer.prototype.resize = function () {
    if (this.disposed || !this.renderer) return;
    var c = this.container, w = Math.max(1, c.clientWidth), h = Math.max(1, c.clientHeight);
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  };

  Viewer.prototype._loop = function () {
    var self = this;
    function tick() {
      if (self.disposed) return;
      self._raf = requestAnimationFrame(tick);
      if (self.controls) self.controls.update();
      try { self.renderer.render(self.scene, self.camera); } catch (e) {}
    }
    tick();
  };

  Viewer.prototype.snapshot = function () {
    var self = this;
    return new Promise(function (resolve) {
      try {
        self.renderer.render(self.scene, self.camera);
        resolve(self.renderer.domElement.toDataURL("image/png"));
      } catch (e) { resolve(null); }
    });
  };

  Viewer.prototype.setAutoRotate = function (on) { if (this.controls) this.controls.autoRotate = !!on; };

  Viewer.prototype.dispose = function () {
    this.disposed = true;
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._ro) { try { this._ro.disconnect(); } catch (e) {} }
    try {
      this.scene && this.scene.traverse(function (o) {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { var mm = Array.isArray(o.material) ? o.material : [o.material]; mm.forEach(function (x) { if (x.map) x.map.dispose(); x.dispose(); }); }
      });
    } catch (e) {}
    try { this.controls && this.controls.dispose(); } catch (e) {}
    try {
      this.renderer && this.renderer.dispose();
      if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode)
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    } catch (e) {}
  };

  window.DynMug3D = {
    create: function (container, opts) {
      var v = new Viewer(container, opts);
      return v.init().catch(function (err) {
        if (opts && typeof opts.onError === "function") { try { opts.onError(err); } catch (e) {} }
        throw err;
      }).then(function () { return v; });
    },
    available: function () { return true; }
  };
})();
