/**
 * Smooth scroll functionality for all navigation
 * Handles both anchor links and page transitions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Function to handle smooth scrolling
    function smoothScrollTo(targetId, behavior = 'smooth') {
        // If no target ID is provided, scroll to top
        if (!targetId) {
            window.scrollTo({ top: 0, behavior });
            return;
        }

        // Get the target element
        const targetElement = document.querySelector(targetId);
        if (!targetElement) return;

        // Get navbar height for offset
        const navbarHeight = document.getElementById('navbar')?.offsetHeight || 0;
        
        // Calculate target position with offset
        const targetPosition = targetElement.getBoundingClientRect().top + 
                             window.pageYOffset - 
                             navbarHeight - 20; // 20px extra spacing

        // Check if smooth scrolling is preferred
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const scrollBehavior = prefersReducedMotion ? 'auto' : behavior;

        // Scroll to the target position
        window.scrollTo({
            top: targetPosition,
            behavior: scrollBehavior
        });
    }

    // Handle anchor link clicks
    document.addEventListener('click', function(e) {
        // Check if the clicked element is an anchor link
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        
        // Handle internal anchor links
        if (href && href.startsWith('#')) {
            e.preventDefault();
            smoothScrollTo(href);
            
            // Update URL without adding to history
            if (history.pushState) {
                history.pushState(null, null, href);
            } else {
                location.hash = href;
            }
        }
        // Handle blog post links
        else if (href && (href.includes('viewBlog.html') || href.includes('index.html'))) {
            // Only handle if it's not an external link
            if (!href.startsWith('http') && !href.startsWith('//')) {
                e.preventDefault();
                
                // If there's a hash in the URL, scroll to it after navigation
                const url = new URL(link.href, window.location.origin);
                const targetId = url.hash;
                
                // If navigating to the same page with a different hash
                if (url.pathname === window.location.pathname && targetId) {
                    smoothScrollTo(targetId);
                    
                    // Update URL without adding to history
                    if (history.pushState) {
                        history.pushState(null, null, targetId);
                    } else {
                        location.hash = targetId;
                    }
                } 
                // If navigating to a different page
                else {
                    // Add a class to indicate smooth transition
                    document.documentElement.classList.add('page-transition');
                    
                    // Navigate to the new page
                    setTimeout(() => {
                        window.location.href = href;
                    }, 100);
                }
            }
        }
    });

    // Handle page load with hash in URL
    if (window.location.hash) {
        // Small timeout to ensure the DOM is fully loaded
        setTimeout(() => {
            smoothScrollTo(window.location.hash);
        }, 100);
    }

    // Add smooth transition class when page loads
    window.addEventListener('load', () => {
        document.documentElement.classList.add('page-loaded');
    });
});
