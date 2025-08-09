import app from './firebaseSetup.js'
import { getFirestore, collection, doc, getDoc, deleteDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'

const firestore = getFirestore(app)
const auth = getAuth(app)

// DOM Elements
const blogTitle = document.querySelector('#title')
const subline = document.querySelector('#subline')
const author = document.querySelector('#author')
const blogDate = document.querySelector('#blogDate')
const body = document.querySelector('#body')
const deleteButton = document.getElementById('deleteButton')
const deleteDialog = document.getElementById('deleteDialog')
const confirmDeleteBtn = document.getElementById('confirmDelete')
const cancelDeleteBtn = document.getElementById('cancelDelete')

let currentBlogId = ''
let currentBlogAuthorEmail = ''


// Check if current user is the author of the blog
async function isCurrentUserAuthor() {
  const user = auth.currentUser
  if (!user || !user.email) return false
  return user.email === currentBlogAuthorEmail
}

// Show/hide delete button based on user permissions
async function updateDeleteButtonVisibility(user) {
  if (user) {
    console.log("User signed in on view blog page!");
    console.log("User ID:", user.uid);
    console.log("User Email:", user.email);
    console.log("User Display Name:", user.displayName);
    
    const isAuthor = user.email === currentBlogAuthorEmail
    console.log('Current user is author:', isAuthor)
    console.log('Current user email:', user.email)
    console.log('Blog author email:', currentBlogAuthorEmail)
    deleteButton.style.display = isAuthor ? 'block' : 'none'
    console.log('Delete button display set to:', deleteButton.style.display)
  } else {
    console.log("No user signed in on view blog page.")
    deleteButton.style.display = 'none'
  }
}

// Show delete confirmation dialog
function showDeleteDialog() {
  deleteDialog.style.display = 'flex';
  deleteDialog.hidden = false;
  document.body.style.overflow = 'hidden'; // Prevent scrolling when dialog is open
}

// Hide delete confirmation dialog
function hideDeleteDialog() {
  deleteDialog.style.display = 'none';
  deleteDialog.hidden = true;
  document.body.style.overflow = ''; // Re-enable scrolling
}

// Delete the blog post
async function deleteBlog() {
  try {
    // Double-check permissions before deleting
    if (!await isCurrentUserAuthor()) {
      alert('You do not have permission to delete this post.')
      return
    }

    // Delete from blogs collection
    await deleteDoc(doc(firestore, 'blogs', currentBlogId))
    
    // Delete from blogsRef collection
    const blogsRef = collection(firestore, 'blogsRef')
    const q = query(blogsRef, where('blogId', '==', currentBlogId))
    const querySnapshot = await getDocs(q)
    
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref)
    })
    
    // Redirect to home page after successful deletion
    window.location.href = '/index.html'
  } catch (error) {
    console.error('Error deleting blog:', error)
    alert('Failed to delete the blog post. Please try again.')
  }
}

async function loadBlog() {
  try {
    const urlParams = new URLSearchParams(window.location.search)
    currentBlogId = urlParams.get('blogId')
    
    if (!currentBlogId) {
      throw new Error('No blog ID provided')
    }
    
    const blogRef = doc(firestore, 'blogs', currentBlogId)
    const blogSnap = await getDoc(blogRef)

    if (blogSnap.exists()) {
      const blogData = blogSnap.data()
      
      // Update blog content
      blogTitle.textContent = blogData.title || 'Untitled'
      subline.textContent = blogData.subtitle || ''
      
      // Create clickable author link
      const authorEmail = blogData.authorEmail;
      const authorName = blogData.author || 'Unknown Author';
      
      if (authorEmail) {
        author.innerHTML = `By <a href="author.html?email=${encodeURIComponent(authorEmail)}" class="author-link" title="View ${authorName}'s profile">${authorName}</a>`;
      } else {
        author.textContent = `By ${authorName}`;
      }
      
      // Parse and display blog content
      const contentType = blogData.contentType || 'html';
      if (contentType === 'markdown' && window.MarkdownParser) {
        const parser = new MarkdownParser();
        body.innerHTML = parser.parse(blogData.body || '');
      } else {
        // Fallback for older HTML content or if parser fails
        body.innerHTML = blogData.body || '';
      }
      
      // Format and display date
      if (blogData.createdAt) {
        const date = new Date(blogData.createdAt)
        blogDate.textContent = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
      
      // Store author email for permission checks
      currentBlogAuthorEmail = blogData.authorEmail || ''
      
      // Update UI based on user permissions
      await updateDeleteButtonVisibility()
    } else {
      throw new Error('Blog post not found')
    }
  } catch (error) {
    console.error('Error loading blog:', error)
    blogTitle.textContent = 'Error Loading Blog'
    body.textContent = 'Sorry, we could not load the requested blog post.'
  }
}


// Initialize the page
async function init() {
  // Ensure dialog is hidden on page load
  deleteDialog.style.display = 'none';
  // Set up event listeners
  deleteButton.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent any default action
    e.stopPropagation(); // Stop event from bubbling up
    showDeleteDialog();
  });
  
  confirmDeleteBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    deleteBlog();
  });
  
  cancelDeleteBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    hideDeleteDialog();
  })
  
  // Close dialog when clicking outside
  deleteDialog.addEventListener('click', (e) => {
    if (e.target === deleteDialog) {
      hideDeleteDialog()
    }
  })
  
  // Close dialog with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideDeleteDialog()
    }
  })
  
  // Load the blog post
  await loadBlog()
  
  // Update UI when auth state changes
  onAuthStateChanged(auth, updateDeleteButtonVisibility)
}

// Start the application
init()
