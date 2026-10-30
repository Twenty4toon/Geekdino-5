// PRELOAD — tablet faces from 360° view using WebP with fallback
(function () {
  var faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
  var pending = faces.map(function (id) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = img.onerror = function () { resolve(); };
      img.src = 'assets/tablet-3d/' + id + '.webp';
    });
  });
  window.TAB5 = window.TAB5 || {};
  window.TAB5.ready = Promise.all(pending);
})();
