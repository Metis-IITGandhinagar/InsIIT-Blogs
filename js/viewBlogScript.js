import app from './firebaseSetup.js'
import { getFirestore, collection, doc, getDoc, deleteDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'

const firestore = getFirestore(app)
const auth = getAuth(app)

const blogTitle = document.querySelector('#title')
const subline = document.querySelector('#subline')
const author = document.querySelector('#author')
const blogDate = document.querySelector('#blogDate')
const body = document.querySelector('#body')
const blogImage = document.querySelector('#blogImage');
const deleteButton = document.getElementById('deleteButton')
const deleteDialog = document.getElementById('deleteDialog')
const confirmDeleteBtn = document.getElementById('confirmDelete')
const cancelDeleteBtn = document.getElementById('cancelDelete')

let currentBlogId = ''
let currentBlogAuthorEmail = ''

async function isCurrentUserAuthor() {
  const user = auth.currentUser
  if (!user || !user.email) return false
  return user.email === currentBlogAuthorEmail
}

async function updateDeleteButtonVisibility(user) {
  if (user && user.email === currentBlogAuthorEmail) {
    deleteButton.style.display = 'block';
  } else {
    deleteButton.style.display = 'none';
  }
}

function showDeleteDialog() {
  deleteDialog.style.display = 'flex';
  deleteDialog.hidden = false;
  document.body.style.overflow = 'hidden';
}

function hideDeleteDialog() {
  deleteDialog.style.display = 'none';
  deleteDialog.hidden = true;
  document.body.style.overflow = '';
}

async function deleteBlog() {
  try {
    if (!await isCurrentUserAuthor()) {
      alert('You do not have permission to delete this post.')
      return
    }

    await deleteDoc(doc(firestore, 'blogs', currentBlogId))
    
    const blogsRef = collection(firestore, 'blogsRef')
    const q = query(blogsRef, where('blogId', '==', currentBlogId))
    const querySnapshot = await getDocs(q)
    
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref)
    })
    
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
      const blogData = blogSnap.data();
      currentBlogAuthorEmail = blogData.authorEmail || '';

      if (blogData.status !== 'published' && (!auth.currentUser || auth.currentUser.email !== blogData.authorEmail)) {
          throw new Error('This blog post is not available for viewing.');
      }
      
      blogTitle.textContent = blogData.title || 'Untitled'
      subline.textContent = blogData.subtitle || ''
      author.textContent = `By ${blogData.author || 'Unknown Author'}`
      
      if (blogData.imageUrl) {
        blogImage.src = blogData.imageUrl;
        blogImage.alt = blogData.title;
        blogImage.style.display = 'block';
      }
      
      const contentType = blogData.contentType || 'html';
      if (contentType === 'markdown' && window.MarkdownParser) {
        const parser = new MarkdownParser();
        body.innerHTML = parser.parse(blogData.body || '');
      } else {
        body.innerHTML = blogData.body || '';
      }
      
      if (blogData.createdAt) {
        const date = new Date(blogData.createdAt)
        blogDate.textContent = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
      
      updateDeleteButtonVisibility(auth.currentUser);
    } else {
      throw new Error('Blog post not found')
    }
  } catch (error) {
    console.error('Error loading blog:', error)
    blogTitle.textContent = 'Error Loading Blog'
    body.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">${error.message}</p>`;
  }
}

async function init() {
  if (deleteDialog) {
    deleteDialog.style.display = 'none';
    deleteButton.addEventListener('click', showDeleteDialog);
    confirmDeleteBtn.addEventListener('click', deleteBlog);
    cancelDeleteBtn.addEventListener('click', hideDeleteDialog);
    deleteDialog.addEventListener('click', (e) => {
      if (e.target === deleteDialog) {
        hideDeleteDialog()
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideDeleteDialog()
      }
    });
  }
  
  onAuthStateChanged(auth, (user) => {
    loadBlog();
  });
}

init();
