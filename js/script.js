import { getAuth, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'
import { getFirestore, collection, addDoc, doc, updateDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'

import app from './firebaseSetup.js'



const auth = getAuth(app)
auth.languageCode = 'en'
const provider = new GoogleAuthProvider()
const db = getFirestore(app)
let currentUser = auth.currentUser
const userIcon = document.querySelector('#userIcon')
const userDropdown = document.querySelector('#userDropdown')
const logoutButton = document.querySelector('#logoutButton')
const viewProfileButton = document.querySelector('#viewProfileButton')

// Profile page variables
let userDocId = null


async function signInWithGoogle() {
	signInWithPopup(auth, provider)
	  .then((result) => {
	    /** @type {firebase.auth.OAuthCredential} */

	    // This gives you a Google Access Token. You can use it to access the Google API.
	    // The signed-in user info.
	    var user = result.user
	    // IdP data available in result.additionalUserInfo.profile.
	      // ...
	    
	    const firestore = getFirestore(app)
	    return addDoc(collection(firestore, "authors"), {
		    displayName: user.displayName,
		    email: user.email,
		    bio: "Hey there! I'm using IITGN blogs",
		    imageUrl: user.photoURL || "https://ui-avatars.io/api/?name=" + encodeURIComponent(user.displayName || user.email) + "&background=dd7a7a&color=fff&size=150"
	    })
	    
	  }).then((doc) => {
		  console.log("User saved at:", doc)
	
	  }).catch((error) => {
	    // Handle Errors here.
	    var errorCode = error.code
	    var errorMessage = error.message
	    // The email of the user's account used.
	    var email = error.email
	    // The firebase.auth.AuthCredential type that was used.
	    console.log(error)
	    // ...
	  })
	     
}

function updateUserInterface(user) {
	if (user) {
		// User is signed in - show profile image and dropdown
		const photoURL = user.photoURL
		const displayName = user.displayName || 'User'
		
		if (photoURL) {
			userIcon.innerHTML = `<img src="${photoURL}" alt="${displayName}" title="${displayName}">`
			userIcon.classList.add('profile-image')
		} else {
			userIcon.innerHTML = displayName.charAt(0).toUpperCase()
			userIcon.classList.remove('profile-image')
		}
		
		// Show the dropdown
		userDropdown.style.display = 'block'
		
	} else {
		// User is signed out - show sign in button
		userIcon.innerHTML = 'Sign In'
		userIcon.classList.remove('profile-image')
		userDropdown.style.display = 'none'
	}
}

auth.onAuthStateChanged((user) => {
	if (user) {
		// User is signed in.
		const uid = user.uid;
		const email = user.email;
		const displayName = user.displayName;

		console.log("User signed in!");
		console.log("User ID:", uid);
		console.log("User Email:", email);
		console.log("User Display Name:", displayName);

		// Update current user reference
		currentUser = user;
		updateUserInterface(user);

		// Update welcome message
		const userEmailElement = document.getElementById("user-email");
		if (userEmailElement) {
			userEmailElement.textContent = `Welcome, ${displayName || email}!`;
		}

		// Remove previous event listeners to avoid duplicates
		userIcon.removeEventListener('click', signInWithGoogle);
		logoutButton.removeEventListener('click', signOutWithGoogle);
		if (viewProfileButton) {
			viewProfileButton.removeEventListener('click', goToProfile);
		}

		// User is signed in - setup logout and profile buttons
		logoutButton.addEventListener('click', signOutWithGoogle);
		if (viewProfileButton) {
			viewProfileButton.addEventListener('click', goToProfile);
		}

		// Load profile data if on profile page
		if (window.location.pathname.includes('profile.html')) {
			loadUserProfile();
		}

	} else {
		// User is signed out.
		console.log("No user signed in.");
		currentUser = null;
		updateUserInterface(null);

		// Update welcome message
		const userEmailElement = document.getElementById("user-email");
		if (userEmailElement) {
			userEmailElement.textContent = "Please sign in to access all features.";
		}

		// Remove previous event listeners to avoid duplicates
		userIcon.removeEventListener('click', signInWithGoogle);
		logoutButton.removeEventListener('click', signOutWithGoogle);
		if (viewProfileButton) {
			viewProfileButton.removeEventListener('click', goToProfile);
		}

		// User is signed out - clicking userIcon triggers signin
		userIcon.addEventListener('click', signInWithGoogle);
	}
});

function signOutWithGoogle() {
	signOut(auth)
}

function goToProfile() {
	window.location.href = 'profile.html'
}

// Load user's blogs for profile page
async function loadUserBlogs() {
	try {
		if (!currentUser || !currentUser.email) {
			console.log("No user found for loading blogs");
			return;
		}

		console.log("Loading blogs for user:", currentUser.email);
		
		const userBlogsContainer = document.getElementById('userBlogs');
		const blogCountElement = document.getElementById('blogCount');
		
		if (!userBlogsContainer || !blogCountElement) {
			console.log("Blog container elements not found on this page");
			return;
		}

		// Show loading state
		userBlogsContainer.innerHTML = `
			<div class="loading-blogs">
				<img src="assets/loadingImage.gif" alt="Loading...">
				<p>Loading your blogs...</p>
			</div>
		`;

		// Query user's blogs from blogsRef collection
		const blogsRef = collection(db, 'blogsRef');
		const q = query(blogsRef, where('authorEmail', '==', currentUser.email));
		const querySnapshot = await getDocs(q);
		
		console.log(`Found ${querySnapshot.size} blogs for user`);

		// Update blog count
		const blogCount = querySnapshot.size;
		blogCountElement.textContent = `${blogCount} blog${blogCount !== 1 ? 's' : ''}`;

		if (querySnapshot.empty) {
			// No blogs found
			userBlogsContainer.innerHTML = `
				<div class="no-blogs-message">
					<h3>No blogs yet</h3>
					<p>You haven't created any blogs yet. Start sharing your thoughts with the world!</p>
					<button onclick="navigateToCreateBlog()" class="create-first-blog-btn">Create Your First Blog</button>
				</div>
			`;
		} else {
			// Display blogs in grid
			let blogsHTML = '<div class="blogs-grid">';
			
			querySnapshot.forEach((doc) => {
				const blogData = doc.data();
				const blogDate = blogData.createdAt ? new Date(blogData.createdAt).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				}) : 'Unknown date';

				blogsHTML += `
					<div class="user-blog-card" onclick="window.open('viewBlog.html?blogId=${blogData.blogId}', '_blank')">
						<div class="blog-card-header">
							<h3 class="blog-card-title">${blogData.title || 'Untitled'}</h3>
							<p class="blog-card-date">${blogDate}</p>
						</div>
						<p class="blog-card-subline">${blogData.subline || 'No description available'}</p>
						<div class="blog-card-footer">
							<span class="blog-card-stats">Published</span>
							<div class="blog-card-actions">
								<a href="viewBlog.html?blogId=${blogData.blogId}" class="view-blog-btn" onclick="event.stopPropagation()">View Blog</a>
							</div>
						</div>
					</div>
				`;
			});
			
			blogsHTML += '</div>';
			userBlogsContainer.innerHTML = blogsHTML;
		}

	} catch (error) {
		console.error('Error loading user blogs:', error);
		const userBlogsContainer = document.getElementById('userBlogs');
		if (userBlogsContainer) {
			userBlogsContainer.innerHTML = `
				<div class="no-blogs-message">
					<h3>Error loading blogs</h3>
					<p>There was an error loading your blogs. Please refresh the page and try again.</p>
				</div>
			`;
		}
	}
}

// Profile page functionality
async function loadUserProfile() {
	try {
		console.log("Starting to load user profile...");
		showLoading(true);
		
		// Find user document in authors collection
		const authorsRef = collection(db, 'authors');
		const q = query(authorsRef, where('email', '==', currentUser.email));
		console.log("Querying for user with email:", currentUser.email);
		
		const querySnapshot = await getDocs(q);
		console.log("Query completed. Found documents:", querySnapshot.size);
		
		// Get DOM elements
		const profileImage = document.getElementById('profileImage');
		const displayNameInput = document.getElementById('displayName');
		const usernameInput = document.getElementById('username');
		const emailInput = document.getElementById('email');
		const bioInput = document.getElementById('bio');
		
		console.log("Profile DOM elements check:");
		console.log("- profileImage:", profileImage ? "Found" : "NOT FOUND");
		console.log("- displayNameInput:", displayNameInput ? "Found" : "NOT FOUND");
		console.log("- usernameInput:", usernameInput ? "Found" : "NOT FOUND");
		console.log("- emailInput:", emailInput ? "Found" : "NOT FOUND");
		console.log("- bioInput:", bioInput ? "Found" : "NOT FOUND");
		
		if (!querySnapshot.empty) {
			const userDoc = querySnapshot.docs[0];
			userDocId = userDoc.id;
			const userData = userDoc.data();
			console.log("User data found:", userData);
			
			// Populate form fields
			if (profileImage) profileImage.src = userData.imageUrl || currentUser.photoURL || 'assets/placeholderImage.jpg';
			if (displayNameInput) displayNameInput.value = userData.displayName || currentUser.displayName || '';
			if (usernameInput) usernameInput.value = userData.username || currentUser.email;
			if (emailInput) emailInput.value = currentUser.email;
			if (bioInput) bioInput.value = userData.bio || '';
			
			console.log("Form fields populated:");
			console.log("- Profile image src:", profileImage ? profileImage.src : "Element not found");
			console.log("- Display name:", displayNameInput ? displayNameInput.value : "Element not found");
			console.log("- Username:", usernameInput ? usernameInput.value : "Element not found");
			console.log("- Email:", emailInput ? emailInput.value : "Element not found");
			console.log("- Bio:", bioInput ? bioInput.value : "Element not found");
			
			console.log("Profile loaded successfully!");
		} else {
			console.log('User document not found in authors collection');
			console.log('Setting default values...');
			
			// If user document doesn't exist, populate with default values
			if (profileImage) profileImage.src = currentUser.photoURL || 'assets/placeholderImage.jpg';
			if (displayNameInput) displayNameInput.value = currentUser.displayName || '';
			if (usernameInput) usernameInput.value = currentUser.email;
			if (emailInput) emailInput.value = currentUser.email;
			if (bioInput) bioInput.value = "Hey there! I'm using IITGN blogs";
			
			console.log("Default values set for new user");
		}
		
		// Setup profile page event listeners
		setupProfileEventListeners();
		
		// Load user's blogs
		loadUserBlogs();
		
	} catch (error) {
		console.error('Error loading user profile:', error);
		showNotification('Error loading profile data', 'error');
	} finally {
		showLoading(false);
		console.log("Loading completed, hiding loading overlay");
	}
}

function setupProfileEventListeners() {
	const saveAllBtn = document.getElementById('saveAllBtn');

	// Save all changes at once
	if (saveAllBtn) {
		saveAllBtn.addEventListener('click', async () => {
			try {
				console.log("Save All button clicked!");
				showLoading(true);
				
				const bioInput = document.getElementById('bio');
				
				const updateData = {
					bio: bioInput ? bioInput.value : '',
					email: currentUser.email
				};
				
				console.log("Update data:", updateData);
				console.log("User doc ID:", userDocId);
				
				if (userDocId) {
					// Update existing document
					console.log("Updating existing user document...");
					await updateDoc(doc(db, 'authors', userDocId), updateData);
				} else {
					// Create new document - include current user's displayName, username, and imageUrl from auth
					console.log("Creating new user document...");
					const displayNameInput = document.getElementById('displayName');
					const usernameInput = document.getElementById('username');
					const profileImage = document.getElementById('profileImage');
					
					const newUserData = {
						...updateData,
						displayName: displayNameInput ? displayNameInput.value : '',
						username: usernameInput ? usernameInput.value : '',
						imageUrl: profileImage ? profileImage.src : ''
					};
					
					const docRef = await addDoc(collection(db, 'authors'), newUserData);
					userDocId = docRef.id;
					console.log("New document created with ID:", userDocId);
				}
				
				// No need to update Firebase Auth profile since no changes are allowed
				console.log("Profile save completed - only bio updated!");
				
				showNotification('Profile updated successfully!', 'success');
				
				console.log("Profile save completed successfully!");
				
			} catch (error) {
				console.error('Error updating profile:', error);
				showNotification('Error updating profile: ' + error.message, 'error');
			} finally {
				showLoading(false);
			}
		});
		console.log("Save All button event listener attached successfully!");
	} else {
		console.log("Save All button not found!");
	}
}

// Utility functions
function showLoading(show) {
	const loadingOverlay = document.getElementById('loadingOverlay');
	console.log("showLoading called with:", show);
	if (loadingOverlay) {
		loadingOverlay.style.display = show ? 'flex' : 'none';
		console.log("Loading overlay display set to:", loadingOverlay.style.display);
	} else {
		console.log("Loading overlay element not found!");
	}
}

function showNotification(message, type = 'info') {
	// Create notification element
	const notification = document.createElement('div');
	notification.className = `notification ${type}`;
	notification.textContent = message;
	
	// Add styles
	notification.style.cssText = `
		position: fixed;
		top: 20px;
		right: 20px;
		padding: 1rem 1.5rem;
		border-radius: 8px;
		color: white;
		font-weight: 600;
		z-index: 10000;
		opacity: 0;
		transform: translateX(100%);
		transition: all 0.3s ease;
	`;
	
	// Set background color based on type
	switch (type) {
		case 'success':
			notification.style.background = '#28a745';
			break;
		case 'error':
			notification.style.background = '#dc3545';
			break;
		default:
			notification.style.background = '#007bff';
	}
	
	document.body.appendChild(notification);
	
	// Animate in
	setTimeout(() => {
		notification.style.opacity = '1';
		notification.style.transform = 'translateX(0)';
	}, 100);
	
	// Remove after 3 seconds
	setTimeout(() => {
		notification.style.opacity = '0';
		notification.style.transform = 'translateX(100%)';
		setTimeout(() => {
			document.body.removeChild(notification);
		}, 300);
	}, 3000);
}

// Function to navigate to create blog with authentication check
window.navigateToCreateBlog = function() {
	if (currentUser) {
		// User is authenticated, allow navigation
		window.location.href = 'createBlog.html';
	} else {
		// Optionally trigger sign-in
		signInWithGoogle();
	}
}

export default auth
