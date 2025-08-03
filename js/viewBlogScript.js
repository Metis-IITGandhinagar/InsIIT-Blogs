import app from './firebaseSetup.js'
import { getFirestore, doc, getDoc, deleteDoc, query, collection, where, getDocs } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'

const firestore = getFirestore(app)
const auth = getAuth(app)
const blogTitle = document.querySelector('#title')
const subline = document.querySelector('#subline')
const author = document.querySelector('#author')
const body = document.querySelector('#body')
const deleteButton = document.getElementById('deleteButton')
const deleteDialog = document.getElementById('deleteDialog')
const confirmDeleteBtn = document.getElementById('confirmDelete')
const cancelDeleteBtn = document.getElementById('cancelDelete')
let currentBlogId = ''


// Check if current user is the author of the blog
async function checkIfUserIsAuthor(authorName) {
    const user = auth.currentUser;
    if (!user) return false;
    
    // Get the current user's display name
    const currentUserDisplayName = user.displayName;
    return currentUserDisplayName === authorName;
}

// Delete blog post from both collections
async function deleteBlog() {
    try {
        // Delete from blogs collection
        await deleteDoc(doc(firestore, 'blogs', currentBlogId));
        
        // Find and delete from blogsRef collection
        const blogsRef = collection(firestore, 'blogsRef');
        const q = query(blogsRef, where('blogId', '==', currentBlogId));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
        });
        
        // Redirect to home page after successful deletion
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Error deleting blog:', error);
        alert('Failed to delete the blog post. Please try again.');
    }
}

// Show delete confirmation dialog
function showDeleteDialog() {
    deleteDialog.style.display = 'flex';
}

// Hide delete confirmation dialog
function hideDeleteDialog() {
    deleteDialog.style.display = 'none';
}

async function loadBlog() {
    console.log('loadBlog called');
    const urlParams = new URLSearchParams(window.location.search);
    currentBlogId = urlParams.get('blogId');
    
    console.log('URL Search Params:', window.location.search);
    console.log('Extracted blogId:', currentBlogId);
    
    if (!currentBlogId) {
        console.error('No blog ID provided in URL');
        return;
    }
    
    console.log('Fetching blog with ID:', currentBlogId);
    const blogRef = doc(firestore, 'blogs', currentBlogId);
    console.log('Blog reference created:', blogRef);
    
    try {
        const blogSnap = await getDoc(blogRef);
        console.log('Blog document snapshot:', blogSnap);

    if (blogSnap.exists()) {
        const blogData = blogSnap.data();
        blogTitle.innerText = blogSnap.get('title');
        subline.innerText = blogSnap.get('subline');
        author.innerText = `By: ${blogSnap.get('author')}`;
        body.innerText = blogSnap.get('body');
        
        // Check if current user is the author
        const isAuthor = await checkIfUserIsAuthor(blogSnap.get('author'));
        if (isAuthor) {
            deleteButton.style.display = 'flex';
        }
    } else {
        console.error('Blog post not found in Firestore');
        // Show error message to user
        blogTitle.innerText = 'Blog Post Not Found';
        body.innerText = 'The requested blog post could not be found.';
    }
    } catch (error) {
        console.error('Error fetching blog post:', error);
        blogTitle.innerText = 'Error Loading Blog';
        body.innerText = 'There was an error loading the blog post. Please try again later.';
    }
}

// Initialize the page
async function init() {
    try {
        await loadBlog();
        
        // Set up event listeners
        deleteButton.addEventListener('click', showDeleteDialog);
        confirmDeleteBtn.addEventListener('click', deleteBlog);
        cancelDeleteBtn.addEventListener('click', hideDeleteDialog);
        
        // Close dialog when clicking outside
        deleteDialog.addEventListener('click', (e) => {
            if (e.target === deleteDialog) {
                hideDeleteDialog();
            }
        });
        
        // Close dialog with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideDeleteDialog();
            }
        });
    } catch (error) {
        console.error('Error initializing page:', error);
    }
}

// Start the application
init();




