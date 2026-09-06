// Shared MathJax configuration for P1 and P2 (must load before the
// MathJax CDN script tag).
window.MathJax = {
  tex: {
    inlineMath: [['\\(', '\\)'], ['$', '$']],
    displayMath: [['\\[', '\\]'], ['$$', '$$']]
  },
  svg: { fontCache: 'global' }
};
