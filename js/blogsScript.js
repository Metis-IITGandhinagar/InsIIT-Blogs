import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import app from "./firebaseSetup.js";
const firestore = getFirestore(app);
const blogs = document.querySelector("#blogs");
const loadingIndicator = document.querySelector("#loadingContainer");

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

async function getBlogs() {
  const querySnapshot = await getDocs(collection(firestore, "blogsRef"));
  if (querySnapshot.empty) {
    blogs.innerHTML =
      "<p class='no-blogs'>No blogs found, Be the first to create one!</p>";
  } else {
    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      const truncatedSubline = truncateText(docData.subline);
      blogs.innerHTML += `<a class="blog" id="${doc.id}" href="/viewBlog?blogId=${docData.blogId}"><img class="blogImage" src="./assets/placeholderImage.jpg"><h3>${docData.title}</h3><p>${truncatedSubline}</p></a>`;
    });
  }
  hideLoadingIndicator();
  console.log("hi");
}

try {
  getBlogs();
  hideLoadingIndicator();
} catch (error) {
  console.log(error);
}
function hideLoadingIndicator() {
  loadingIndicator.style.display = "none";
  console.log("l");
  loadingIndicator.style.visibility = "hidden";
}
