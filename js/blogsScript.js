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

// Function to render a single blog
function renderBlog(doc) {
  const docData = doc.data();
  console.log('Rendering blog:', doc.id, docData);
  
  if (!docData.title || !docData.subline) {
    console.warn('Blog post is missing required fields:', doc.id, docData);
    return; // Skip this document if required fields are missing
  }
  
  const truncatedSubline = truncateText(docData.subline);
  const blogHTML = `
    <a class="blog" id="${doc.id}" href="viewBlog.html?blogId=${docData.blogId}">
      <img class="blogImage" src="./assets/placeholderImage.jpg" alt="${docData.title}">
      <div class="blog-content">
        <h3>${docData.title}</h3>
        <p>${truncatedSubline}</p>
      </div>
    </a>`;
  
  return blogHTML;
}

// Function to truncate text beyond 50 chars and add "Read More" link
function truncateText(text, maxLength = 50) {
  if (text.length <= maxLength) {
    return text;
  }
  return (
    text.substring(0, maxLength) +
    '... <span class="read-more">Read More</span>'
  );
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
      
      // Clear existing blogs
      blogs.innerHTML = '';
      
      if (querySnapshot.empty) {
        console.log('No blogs found in the database');
        blogs.innerHTML = '<p>No blogs found. Be the first to create one!</p>';
        hideLoadingIndicator();
        return;
      }
      
      // Process each document
      querySnapshot.forEach((doc) => {
        const blogHTML = renderBlog(doc);
        if (blogHTML) {
          blogs.innerHTML += blogHTML;
        }
      });
      
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
