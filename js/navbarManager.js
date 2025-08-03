// Navigation Bar Authentication and Search Functionality
import { getAuth, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
import app from './firebaseSetup.js'

class NavbarManager {
    constructor() {
        this.auth = getAuth(app);
        this.provider = new GoogleAuthProvider();
        this.firestore = getFirestore(app);
        this.currentUser = null;
        
        // DOM elements
        this.loginButton = document.getElementById('loginButton');
        this.userProfile = document.getElementById('userProfile');
        this.userAvatar = document.getElementById('userAvatar');
        this.searchBar = document.getElementById('searchBar');
        this.searchButton = document.getElementById('searchButton');
        
        this.init();
    }

    init() {
        this.setupAuthStateListener();
        this.setupEventListeners();
        this.setupSearch();
    }

    setupAuthStateListener() {
        onAuthStateChanged(this.auth, (user) => {
            this.currentUser = user;
            this.updateUI();
        });
    }

    setupEventListeners() {
        // Login button click
        if (this.loginButton) {
            this.loginButton.addEventListener('click', () => this.signInWithGoogle());
        }

        // User profile click (logout)
        if (this.userProfile) {
            this.userProfile.addEventListener('click', () => this.signOut());
        }

        // Logo click - go to home
        const logo = document.getElementById('logo');
        if (logo) {
            logo.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
    }

    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(this.auth, this.provider);
            const user = result.user;
            
            // Save user to Firestore
            await addDoc(collection(this.firestore, "authors"), {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                bio: "Hey there! I'm using IITGN blogs",
                imageUrl: user.photoURL || "assets/placeholderImage.jpg"
            });
            
            console.log("User signed in successfully");
        } catch (error) {
            console.error("Error signing in:", error);
        }
    }

    async signOut() {
        try {
            await signOut(this.auth);
            console.log("User signed out successfully");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    }

    updateUI() {
        if (this.currentUser) {
            // User is logged in
            if (this.loginButton) this.loginButton.style.display = 'none';
            if (this.userProfile) this.userProfile.style.display = 'flex';
            if (this.userAvatar) {
                this.userAvatar.src = this.currentUser.photoURL || 'assets/placeholderImage.jpg';
                this.userAvatar.alt = this.currentUser.displayName || 'User';
                this.userAvatar.title = `Signed in as ${this.currentUser.displayName || this.currentUser.email}`;
            }
        } else {
            // User is not logged in
            if (this.loginButton) this.loginButton.style.display = 'block';
            if (this.userProfile) this.userProfile.style.display = 'none';
        }
    }

    setupSearch() {
        if (!this.searchBar || !this.searchButton) return;

        // Search functionality
        const performSearch = () => {
            const searchTerm = this.searchBar.value.trim().toLowerCase();
            if (!searchTerm) return;

            this.clearHighlights();

            const currentPage = window.location.pathname;
            
            if (currentPage.includes('viewBlog.html')) {
                this.searchInBlogPage(searchTerm);
            } else if (currentPage.includes('index.html') || currentPage === '/') {
                this.searchInMainPage(searchTerm);
            }
        };

        // Search button click
        this.searchButton.addEventListener('click', performSearch);

        // Enter key in search bar
        this.searchBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // Real-time search as user types (debounced)
        let searchTimeout;
        this.searchBar.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = this.searchBar.value.trim().toLowerCase();
                if (searchTerm.length > 2) {
                    this.clearHighlights();
                    const currentPage = window.location.pathname;
                    if (currentPage.includes('viewBlog.html')) {
                        this.searchInBlogPage(searchTerm);
                    } else if (currentPage.includes('index.html') || currentPage === '/') {
                        this.searchInMainPage(searchTerm);
                    }
                } else {
                    this.clearHighlights();
                }
            }, 300);
        });
    }

    searchInMainPage(searchTerm) {
        // Search in blog cards on the main page
        const blogCards = document.querySelectorAll('#blogs .blog-card, [class*="blog"]');
        let hasResults = false;

        blogCards.forEach(card => {
            const title = card.querySelector('h2, h3, .title, [class*="title"]');
            const subtitle = card.querySelector('p, .subtitle, [class*="subtitle"]');
            const content = card.querySelector('.content, [class*="content"]');
            
            let cardText = '';
            if (title) cardText += title.textContent.toLowerCase() + ' ';
            if (subtitle) cardText += subtitle.textContent.toLowerCase() + ' ';
            if (content) cardText += content.textContent.toLowerCase() + ' ';

            if (cardText.includes(searchTerm)) {
                hasResults = true;
                card.style.display = 'block';
                card.style.border = '2px solid #4CAF50';
                card.style.borderRadius = '8px';
                
                // Highlight matching text
                [title, subtitle, content].forEach(element => {
                    if (element) {
                        this.highlightText(element, searchTerm);
                    }
                });
            } else {
                card.style.display = 'none';
            }
        });

        if (!hasResults) {
            this.showNoResultsMessage('main');
        }
    }

    searchInBlogPage(searchTerm) {
        // Search in the current blog content
        const blogContent = document.querySelector('#blog, .blog-content, main');
        if (!blogContent) return;

        const searchableElements = blogContent.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, span');
        let hasResults = false;

        searchableElements.forEach(element => {
            if (element.textContent.toLowerCase().includes(searchTerm)) {
                hasResults = true;
                this.highlightText(element, searchTerm);
                
                // Scroll to first match
                if (!hasResults) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });

        if (!hasResults) {
            this.showNoResultsMessage('blog');
        }
    }

    highlightText(element, searchTerm) {
        const text = element.textContent;
        const regex = new RegExp(`(${this.escapeRegExp(searchTerm)})`, 'gi');
        const highlightedText = text.replace(regex, '<span class="search-highlight">$1</span>');
        
        if (highlightedText !== text) {
            element.innerHTML = highlightedText;
        }
    }

    clearHighlights() {
        // Remove all existing highlights
        const highlights = document.querySelectorAll('.search-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize();
        });

        // Reset blog card styles
        const blogCards = document.querySelectorAll('#blogs .blog-card, [class*="blog"]');
        blogCards.forEach(card => {
            card.style.display = '';
            card.style.border = '';
            card.style.borderRadius = '';
        });

        // Remove no results message
        const noResultsMsg = document.querySelector('.no-results-message');
        if (noResultsMsg) {
            noResultsMsg.remove();
        }
    }

    showNoResultsMessage(context) {
        const message = document.createElement('div');
        message.className = 'no-results-message';
        message.style.cssText = `
            text-align: center;
            padding: 20px;
            color: #666;
            font-style: italic;
            background: #f9f9f9;
            border-radius: 8px;
            margin: 20px;
        `;
        
        if (context === 'main') {
            message.textContent = 'No blogs found matching your search.';
            const blogsContainer = document.querySelector('#blogs');
            if (blogsContainer) {
                blogsContainer.appendChild(message);
            }
        } else {
            message.textContent = 'No content found matching your search in this blog.';
            const blogContainer = document.querySelector('#blog, .blog-content, main');
            if (blogContainer) {
                blogContainer.appendChild(message);
            }
        }
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Initialize navbar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NavbarManager();
});

export default NavbarManager;
