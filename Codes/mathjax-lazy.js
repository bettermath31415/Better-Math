// Lazily typesets MathJax content, section by section, instead of the
// whole page at once. Pairs with `startup: { typeset: false }` in
// mathjax-config.js. Load this AFTER the MathJax CDN script tag.
//
// How it works: every math-bearing block on these pages sits inside a
// <details> element (a year, or a "Show answers" block). We listen for
// the native `toggle` event and typeset just the section that was
// opened, the first time it's opened. Re-opening a section afterwards
// is free — MathJax has already replaced the $...$ / \(...\) text with
// rendered output, so there's nothing left for it to find.
(function () {
  // MathJax v3 shouldn't be asked to typeset a second time before the
  // previous call has resolved, so every request is chained onto one
  // queue rather than fired off in parallel.
  var queue = Promise.resolve();

  function typeset(el) {
    queue = queue
      .then(function () { return MathJax.startup.promise; })
      .then(function () { return MathJax.typesetPromise([el]); })
      .catch(function (err) { console.error('MathJax typeset error:', err); });
  }

  // The `toggle` event on <details> does not bubble, but the capture
  // phase still visits every ancestor on the way down to the element
  // that changed — so a single listener on `document`, added with
  // capture:true, catches every <details> on the page without needing
  // one listener per element.
  document.addEventListener('toggle', function (e) {
    var el = e.target;
    if (el.tagName === 'DETAILS' && el.open) {
      typeset(el);
    }
  }, true);
})();
