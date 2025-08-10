import {
  getFirestore,
  collection,
  getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import app from "./firebaseSetup.js";

const firestore = getFirestore(app);
const blogs = document.querySelector("#blogs");
const loadingIndicator = document.querySelector("#loadingContainer");
const searchInput = document.querySelector("#searchInput");
const clearSearchBtn = document.querySelector("#clearSearch");

// Global variables to store all blogs and current search term
let allBlogs = [];
let currentSearchTerm = "";

// Function to render a single blog
function renderBlog(doc) {
  const docData = doc.data();
  console.log('Rendering blog:', doc.id, docData);
  
  if (!docData.title || !docData.subline) {
    console.warn('Blog post is missing required fields:', doc.id, docData);
    return; // Skip this document if required fields are missing
  }
  
  let title = docData.title;
  let subline = docData.subline;
  
  // Highlight search terms if there's a search
  if (currentSearchTerm.trim()) {
    title = highlightSearchTerm(title, currentSearchTerm);
    subline = highlightSearchTerm(subline, currentSearchTerm);
  }
  
  const truncatedSubline = truncateText(subline);
  const imageUrl = docData.imageUrl || './assets/placeholderImage.jpg'; // Use uploaded image or placeholder

  const blogHTML = `
    <a class="blog" id="${doc.id}" href="viewBlog.html?blogId=${docData.blogId}">
      <img class="blogImage" src="${imageUrl}" alt="${docData.title}">
      <div class="blog-content">
        <h3>${title}</h3>
        <p>${truncatedSubline}</p>
      </div>
    </a>`;
  
  return blogHTML;
}

// Function to highlight search terms
function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Function to truncate text beyond 50 chars and add "Read More" link
function truncateText(text, maxLength = 50) {
  // First strip HTML tags to get accurate character count
  const strippedText = text.replace(/<[^>]*>/g, '');
  
  if (strippedText.length <= maxLength) {
    return text;
  }
  
  // Find a good truncation point that preserves HTML tags
  let truncated = text;
  let currentLength = 0;
  let inTag = false;
  let result = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '<') {
      inTag = true;
    } else if (char === '>') {
      inTag = false;
    } else if (!inTag) {
      currentLength++;
    }
    
    result += char;
    
    if (currentLength >= maxLength && !inTag) {
      break;
    }
  }
  
  return result + '... <span class="read-more">Read More</span>';
}

// Function to filter blogs based on search term
function filterBlogs(searchTerm) {
  if (!searchTerm.trim()) {
    return allBlogs;
  }
  
  const term = searchTerm.toLowerCase().trim();
  return allBlogs.filter(blog => {
    const title = (blog.data().title || '').toLowerCase();
    const subline = (blog.data().subline || '').toLowerCase();
    const content = (blog.data().content || '').toLowerCase();
    
    return title.includes(term) || 
           subline.includes(term) || 
           content.includes(term);
  });
}

// Function to render blogs based on current search
function renderFilteredBlogs() {
  const filteredBlogs = filterBlogs(currentSearchTerm);
  
  // Clear existing blogs
  blogs.innerHTML = '';
  
  if (filteredBlogs.length === 0) {
    if (currentSearchTerm.trim()) {
      blogs.innerHTML = `<p>No blogs found matching "${currentSearchTerm}". Try a different search term.</p>`;
    } else {
      blogs.innerHTML = '<p>No blogs found. Be the first to create one!</p>';
    }
    return;
  }
  
  // Render filtered blogs
  filteredBlogs.forEach((doc) => {
    const blogHTML = renderBlog(doc);
    if (blogHTML) {
      blogs.innerHTML += blogHTML;
    }
  });
}

// Function to handle search input
function handleSearch() {
  currentSearchTerm = searchInput.value;
  
  // Show/hide clear button
  if (currentSearchTerm.trim()) {
    clearSearchBtn.classList.add('visible');
  } else {
    clearSearchBtn.classList.remove('visible');
  }
  
  renderFilteredBlogs();
}

// Function to clear search
function clearSearch() {
  searchInput.value = '';
  currentSearchTerm = '';
  clearSearchBtn.classList.remove('visible');
  renderFilteredBlogs();
  searchInput.focus();
}

// Add event listeners for search functionality
if (searchInput) {
  searchInput.addEventListener('input', handleSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearSearch();
    }
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', clearSearch);
}

// Set up real-time listener for blogs
function getBlogs() {
  console.log('Setting up real-time blog listener...');
  
  // Clear existing blogs
  blogs.innerHTML = '';
  
  // Set up real-time listener
  const unsubscribe = onSnapshot(
    collection(firestore, "blogsRef"),
    (querySnapshot) => {
      console.log(`Received ${querySnapshot.size} blog(s) from Firestore`);
      
      // Store all blogs in global array
      allBlogs = [];
      
      if (querySnapshot.empty) {
        console.log('No blogs found in the database');
        renderFilteredBlogs();
        hideLoadingIndicator();
        return;
      }
      
      // Store each document in the global array
      querySnapshot.forEach((doc) => {
        allBlogs.push(doc);
      });
      
      // Render blogs based on current search
      renderFilteredBlogs();
      hideLoadingIndicator();
    },
    (error) => {
      console.error('Error listening to blogs:', error);
      hideLoadingIndicator();
      blogs.innerHTML = '<p>Error loading blogs. Please refresh the page.</p>';
    }
  );
  
  // Return the unsubscribe function in case we need to stop listening later
  return unsubscribe;
}

// Initialize the page
try {
  getBlogs();
} catch (error) {
  console.error('Initialization error:', error);
  hideLoadingIndicator();
  blogs.innerHTML = '<p>Error initializing the page. Please refresh.</p>';
}

function hideLoadingIndicator() {
  loadingIndicator.style.display = "none";
  console.log("l");
  loadingIndicator.style.visibility = "hidden";
}