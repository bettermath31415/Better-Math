/* =========================================
   Better Math Education - shared site JS
   Used by both P1 (index.html) and P2 (MathematicsP2.html)
========================================= */

// Collapse / expand every <details> matching a selector
function toggleAll(selector, open) {
  document.querySelectorAll(selector).forEach(d => { d.open = open; });
}

// All the classes used across P1 and P2 for answer blocks
const ANSWER_SELECTOR = 'details.answers, details.answer, details.ans, details.answer-block, details.asection, details.sub.answer';

function showAllAnswers() {
  toggleAll(ANSWER_SELECTOR, true);
}
function hideAllAnswers() {
  toggleAll(ANSWER_SELECTOR, false);
}

// Mobile hamburger nav - class based, so it always matches the CSS
// media query and never gets stuck open/closed when the viewport
// crosses back over the breakpoint.
function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('#nav .nav-links');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('mobile-open');
    hamburger.setAttribute(
      'aria-expanded',
      navLinks.classList.contains('mobile-open') ? 'true' : 'false'
    );
  });

  // If the window is resized back to desktop width while the mobile
  // menu is open, drop the mobile-open class so desktop CSS takes over
  // cleanly instead of leaving a stale inline/class state behind.
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      navLinks.classList.remove('mobile-open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
}

// Smooth-scroll "jump to P1" arrow on the homepage
function initJumpLinks() {
  document.querySelectorAll('.jump-arrow[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  initJumpLinks();
});
