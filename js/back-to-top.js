/**
 * Back to Top Button Functionality
 * Adds a smooth scroll-to-top button that appears when scrolling down
 */

document.addEventListener('DOMContentLoaded', function() {
    // Create the back-to-top button
    const backToTopButton = document.createElement('button');
    backToTopButton.className = 'back-to-top';
    backToTopButton.setAttribute('aria-label', 'Back to top');
    backToTopButton.innerHTML = '↑';
    document.body.appendChild(backToTopButton);

    // Show/hide button based on scroll position
    function toggleBackToTop() {
        if (window.scrollY > 300) { // Show after scrolling 300px
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    }

    // Smooth scroll to top
    function scrollToTop() {
        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            window.scrollTo({
                top: 0,
                behavior: 'auto'
            });
        } else {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }

    // Event listeners
    window.addEventListener('scroll', toggleBackToTop);
    backToTopButton.addEventListener('click', scrollToTop);

    // Initial check in case the page is loaded with scroll position
    toggleBackToTop();
});
