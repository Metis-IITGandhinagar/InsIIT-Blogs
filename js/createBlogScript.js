import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'
import auth from './script.js'
import app from './firebaseSetup.js'

// Additional authentication check
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // User is not authenticated, redirect to home page
        alert('Authentication required. Redirecting to home page.');
        window.location.href = 'index.html';
        return;
    }
});

// Toast notification function
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');
    
    // Set message and type
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    
    // Show toast
    toast.classList.add('show');
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

const firestore = getFirestore(app)

// Blog data storage
let blogData = {
    title: '',
    subtitle: '',
    authorName: '',
    username: '',
    publishDate: '',
    category: '',
    body: ''
};

// DOM Elements
const blogDetailsStep = document.getElementById('blogDetailsStep');
const blogBodyStep = document.getElementById('blogBodyStep');
const blogDetailsForm = document.getElementById('blogDetailsForm');
const nextToBodyBtn = document.getElementById('nextToBodyStep');
const backToDetailsBtn = document.getElementById('backToDetails');
const blogEditor = document.getElementById('blogEditor');
const editorTitle = document.getElementById('editorTitle');
const publishBtn = document.getElementById('publishBlog');

// Auto-populate user data when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Set today's date as default publish date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('publishDate').value = today;
    
    // Wait for auth state and populate user data
    setTimeout(() => {
        if (auth.currentUser) {
            populateUserData();
        }
    }, 1000);
});

function populateUserData() {
    const authorNameInput = document.getElementById('authorName');
    const usernameInput = document.getElementById('username');
    
    if (auth.currentUser) {
        authorNameInput.value = auth.currentUser.displayName || 'Anonymous User';
        usernameInput.value = auth.currentUser.email?.split('@')[0] || 'anonymous';
    }
}

// Step navigation
nextToBodyBtn.addEventListener('click', () => {
    if (!auth.currentUser) {
        alert('Authentication required. Redirecting to home page.');
        window.location.href = 'index.html';
        return;
    }
    
    if (validateDetailsForm()) {
        saveDetailsData();
        showBodyStep();
    }
});

backToDetailsBtn.addEventListener('click', () => {
    if (!auth.currentUser) {
        alert('Authentication required. Redirecting to home page.');
        window.location.href = 'index.html';
        return;
    }
    
    showDetailsStep();
});

function validateDetailsForm() {
    const form = blogDetailsForm;
    const title = form.title.value.trim();
    const subtitle = form.subtitle.value.trim();
    const publishDate = form.publishDate.value;
    const category = form.category.value;
    
    if (!title) {
        showToast('Please enter a blog title', 'error');
        return false;
    }
    
    if (!subtitle) {
        showToast('Please enter a blog subtitle', 'error');
        return false;
    }
    
    if (!publishDate) {
        showToast('Please select a publish date', 'error');
        return false;
    }
    
    if (!category) {
        showToast('Please select a category', 'error');
        return false;
    }
    
    return true;
}

function saveDetailsData() {
    const form = blogDetailsForm;
    blogData.title = form.title.value.trim();
    blogData.subtitle = form.subtitle.value.trim();
    blogData.authorName = form.authorName.value;
    blogData.username = form.username.value;
    blogData.publishDate = form.publishDate.value;
    blogData.category = form.category.value;
}

function showDetailsStep() {
    blogDetailsStep.classList.add('active');
    blogBodyStep.classList.remove('active');
}

function showBodyStep() {
    blogDetailsStep.classList.remove('active');
    blogBodyStep.classList.add('active');
    editorTitle.textContent = blogData.title;
    blogEditor.focus();
}

// Editor toolbar functionality
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('toolbar-btn')) {
        const command = e.target.dataset.command;
        const value = e.target.dataset.value;
        
        if (command) {
            document.execCommand(command, false, value || null);
            blogEditor.focus();
        }
    }
});

// Publish blog
publishBtn.addEventListener('click', async () => {
    if (!auth.currentUser) {
        showToast('Please log in to publish your blog', 'error');
        return;
    }
    
    const editorContent = blogEditor.innerHTML.trim();
    if (!editorContent || editorContent === '<br>' || editorContent === '<div><br></div>') {
        showToast('Please write some content for your blog', 'error');
        return;
    }
    
    blogData.body = editorContent;
    
    try {
        publishBtn.disabled = true;
        publishBtn.textContent = 'Publishing...';
        
        const docRef = await addDoc(collection(firestore, "blogs"), {
            title: blogData.title,
            subtitle: blogData.subtitle,
            body: blogData.body,
            author: blogData.authorName,
            username: blogData.username,
            publishDate: blogData.publishDate,
            category: blogData.category,
            authorEmail: auth.currentUser.email,
            createdAt: new Date().toISOString(),
            status: 'published'
        });

        const indexRef = await addDoc(collection(firestore, "blogsRef"), {
            title: blogData.title,
            subtitle: blogData.subtitle,
            author: blogData.authorName,
            username: blogData.username,
            publishDate: blogData.publishDate,
            category: blogData.category,
            authorEmail: auth.currentUser.email,
            blogId: docRef.id,
            createdAt: new Date().toISOString(),
            status: 'published'
        });

        showToast('Blog published successfully!');
        
        // Reset form and redirect after a delay
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 2000);

    } catch (error) {
        console.error('Error publishing blog:', error);
        showToast('Error publishing blog. Please try again.', 'error');
    } finally {
        publishBtn.disabled = false;
        publishBtn.textContent = 'Publish Blog';
    }
});

// Handle auth state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        populateUserData();
    } else {
        // Redirect to login if not authenticated
        window.location.href = '/index.html';
    }
});

