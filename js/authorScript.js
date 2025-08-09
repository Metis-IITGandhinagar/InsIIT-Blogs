import app from './firebaseSetup.js'
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'

const firestore = getFirestore(app)

// DOM Elements
const authorProfileTitle = document.getElementById('authorProfileTitle')
const authorEmail = document.getElementById('author-email')
const authorProfileImage = document.getElementById('authorProfileImage')
const loadingDiv = document.querySelector('.loading-message')
const profileContent = document.querySelector('.profile-content')

let currentAuthorEmail = ''

async function loadAuthorProfile() {
  try {
    const urlParams = new URLSearchParams(window.location.search)
    currentAuthorEmail = urlParams.get('email')
    
    if (!currentAuthorEmail) {
      throw new Error('No author email provided')
    }

    // Update page title and email display
    authorProfileTitle.textContent = `${currentAuthorEmail.split('@')[0]}'s Profile`
    authorEmail.textContent = currentAuthorEmail

    // Load author's blogs
    await loadAuthorBlogs()

    // Hide loading message and show content
    if (loadingDiv) loadingDiv.style.display = 'none'
    if (profileContent) profileContent.style.display = 'block'

  } catch (error) {
    console.error('Error loading author profile:', error)
    if (loadingDiv) {
      loadingDiv.innerHTML = `
        <div class="error-message">
          <h3>Error Loading Profile</h3>
          <p>Unable to load the author's profile. Please try again later.</p>
          <a href="index.html" class="btn">Back to Home</a>
        </div>
      `
    }
  }
}

async function loadAuthorBlogs() {
  try {
    // Query for blogs by this author
    const blogsQuery = query(
      collection(firestore, 'blogs'),
      where('authorEmail', '==', currentAuthorEmail),
      orderBy('createdAt', 'desc'),
      limit(50)
    )

    const querySnapshot = await getDocs(blogsQuery)
    const blogs = []
    
    querySnapshot.forEach((doc) => {
      const blogData = doc.data()
      blogs.push({
        id: doc.id,
        ...blogData
      })
    })

    // Display author's blogs
    displayAuthorBlogs(blogs)

  } catch (error) {
    console.error('Error loading author blogs:', error)
  }
}

function displayAuthorBlogs(blogs) {
  const authorBlogsContainer = document.getElementById('author-blogs')
  
  if (!authorBlogsContainer) {
    // Create the blogs container if it doesn't exist
    const blogsSection = document.createElement('div')
    blogsSection.className = 'author-blogs-section'
    blogsSection.innerHTML = `
      <h3>Published Blogs (${blogs.length})</h3>
      <div id="author-blogs" class="author-blogs-container"></div>
    `
    profileContent.appendChild(blogsSection)
  }

  const blogsContainer = document.getElementById('author-blogs')
  
  if (blogs.length === 0) {
    blogsContainer.innerHTML = '<p class="no-blogs">This author hasn\'t published any blogs yet.</p>'
    return
  }

  blogsContainer.innerHTML = blogs.map(blog => `
    <div class="blog-card">
      <div class="blog-header">
        <h4><a href="viewBlog.html?blogId=${blog.id}">${blog.title || 'Untitled'}</a></h4>
        ${blog.subtitle ? `<p class="blog-subtitle">${blog.subtitle}</p>` : ''}
      </div>
      <div class="blog-meta">
        <span class="blog-date">${formatDate(blog.createdAt)}</span>
      </div>
      <div class="blog-preview">
        ${getPreviewText(blog.body)}
      </div>
    </div>
  `).join('')
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown date'
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getPreviewText(htmlContent) {
  if (!htmlContent) return ''
  
  // Remove HTML tags and get first 150 characters
  const textContent = htmlContent.replace(/<[^>]*>/g, '')
  return textContent.length > 150 
    ? textContent.substring(0, 150) + '...' 
    : textContent
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', loadAuthorProfile)
