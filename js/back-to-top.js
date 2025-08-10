// Back to Top Button Functionality
document.addEventListener('DOMContentLoaded', () => {
  const backToTopButton = document.getElementById('backToTop');
  
  if (!backToTopButton) return;
  
  // Show/hide button based on scroll position
  const toggleBackToTopButton = () => {
    if (window.pageYOffset > 200) {
      backToTopButton.classList.add('visible');
    } else {
      backToTopButton.classList.remove('visible');
    }
  };
  
  // Smooth scroll to top
  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Add event listeners
  window.addEventListener('scroll', toggleBackToTopButton);
  backToTopButton.addEventListener('click', scrollToTop);
  
  // Initial check in case page loads with scroll
  toggleBackToTopButton();
  
  // Cleanup function (in case this script is loaded multiple times)
  return () => {
    window.removeEventListener('scroll', toggleBackToTopButton);
    backToTopButton.removeEventListener('click', scrollToTop);
  };
});
