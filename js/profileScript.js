import { getAuth, updateProfile } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'
import { getFirestore, collection, addDoc, doc, updateDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'

import app from './firebaseSetup.js'

const auth = getAuth(app)
const db = getFirestore(app)
let userDocId = null

// Profile page functionality
async function loadUserProfile() {
	try {
		console.log("Starting to load user profile...");
		showLoading(true);
		
		const currentUser = auth.currentUser;
		if (!currentUser) {
			console.log("No user is currently signed in");
			return;
		}
		
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
			if (usernameInput) {
				// Use stored username, or generate one from email if not available
				const username = userData.username || generateUsernameFromEmail(currentUser.email);
				usernameInput.value = username;
			}
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
			if (usernameInput) usernameInput.value = generateUsernameFromEmail(currentUser.email);
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
	console.log("Setting up profile event listeners...");
	
	// Setup edit/save/cancel functionality for editable fields
	setupEditableFields();
}

function setupEditableFields() {
	const editButtons = document.querySelectorAll('.edit-btn');
	const saveButtons = document.querySelectorAll('.save-btn');
	const cancelButtons = document.querySelectorAll('.cancel-btn');
	
	// Store original values for cancel functionality
	const originalValues = {};
	
	editButtons.forEach(button => {
		button.addEventListener('click', (e) => {
			const fieldName = e.target.dataset.field;
			const input = document.getElementById(fieldName);
			const editBtn = document.querySelector(`[data-field="${fieldName}"].edit-btn`);
			const saveBtn = document.querySelector(`[data-field="${fieldName}"].save-btn`);
			const cancelBtn = document.querySelector(`[data-field="${fieldName}"].cancel-btn`);
			
			if (input && editBtn && saveBtn && cancelBtn) {
				// Store original value
				originalValues[fieldName] = input.value;
				
				// Enable input and change styling
				input.readOnly = false;
				input.classList.add('editing');
				input.focus();
				
				// Add keyboard event listeners
				const handleKeydown = (e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						saveField(fieldName);
					} else if (e.key === 'Escape') {
						e.preventDefault();
						cancelEdit(fieldName, originalValues[fieldName]);
					}
				};
				
				input.addEventListener('keydown', handleKeydown);
				
				// Store the event listener for cleanup
				input._handleKeydown = handleKeydown;
				
				// Toggle button visibility
				editBtn.style.display = 'none';
				saveBtn.style.display = 'block';
				cancelBtn.style.display = 'block';
			}
		});
	});
	
	saveButtons.forEach(button => {
		button.addEventListener('click', async (e) => {
			const fieldName = e.target.dataset.field;
			await saveField(fieldName);
		});
	});
	
	cancelButtons.forEach(button => {
		button.addEventListener('click', (e) => {
			const fieldName = e.target.dataset.field;
			cancelEdit(fieldName, originalValues[fieldName]);
		});
	});
}

async function saveField(fieldName) {
	try {
		const input = document.getElementById(fieldName);
		const editBtn = document.querySelector(`[data-field="${fieldName}"].edit-btn`);
		const saveBtn = document.querySelector(`[data-field="${fieldName}"].save-btn`);
		const cancelBtn = document.querySelector(`[data-field="${fieldName}"].cancel-btn`);
		
		if (!input) {
			throw new Error('Input field not found');
		}
		
		// Disable buttons during save
		if (saveBtn) saveBtn.disabled = true;
		if (cancelBtn) cancelBtn.disabled = true;
		
		showLoading(true);
		
		const newValue = input.value.trim();
		if (!newValue) {
			throw new Error('Field cannot be empty');
		}
		
		// Additional validation for username
		if (fieldName === 'username') {
			// Check if username contains only allowed characters
			if (!/^[a-zA-Z0-9_-]+$/.test(newValue)) {
				throw new Error('Username can only contain letters, numbers, hyphens, and underscores');
			}
			
			// Check if username is too short
			if (newValue.length < 3) {
				throw new Error('Username must be at least 3 characters long');
			}
			
			// Check if username already exists (excluding current user)
			const usernameQuery = query(collection(db, 'authors'), where('username', '==', newValue));
			const usernameSnapshot = await getDocs(usernameQuery);
			
			if (!usernameSnapshot.empty) {
				// Check if the existing username belongs to the current user
				const existingUser = usernameSnapshot.docs[0];
				if (existingUser.id !== userDocId) {
					throw new Error('This username is already taken. Please choose another one.');
				}
			}
		}
		
		// Prepare update data
		const updateData = {};
		updateData[fieldName] = newValue;
		
		console.log(`Saving ${fieldName} with value:`, newValue);
		console.log("User doc ID:", userDocId);
		
		const currentUser = auth.currentUser;
		
		if (userDocId) {
			// Update existing document
			await updateDoc(doc(db, 'authors', userDocId), updateData);

			
			// If displayName was updated, sync it across all blogs
			if (fieldName === 'displayName') {
				console.log("Syncing displayName across all blogs...");
				await syncDisplayNameInBlogs(currentUser.email, newValue);
			}

		} else {
			// Create new document if it doesn't exist
			const displayNameInput = document.getElementById('displayName');
			const usernameInput = document.getElementById('username');
			const profileImage = document.getElementById('profileImage');
			
			const newUserData = {
				email: currentUser.email,
				displayName: displayNameInput ? displayNameInput.value : currentUser.displayName || '',
				username: usernameInput ? usernameInput.value : generateUsernameFromEmail(currentUser.email),
				imageUrl: profileImage ? profileImage.src : currentUser.photoURL || '',
				bio: "Hey there! I'm using IITGN blogs",
				...updateData
			};
			
			const docRef = await addDoc(collection(db, 'authors'), newUserData);
			userDocId = docRef.id;
			console.log("New document created with ID:", userDocId);
		}
		
		// Update UI back to read-only state
		input.readOnly = true;
		input.classList.remove('editing');
		
		// Clean up keyboard event listener
		if (input._handleKeydown) {
			input.removeEventListener('keydown', input._handleKeydown);
			delete input._handleKeydown;
		}
		
		// Toggle button visibility and re-enable them
		if (editBtn && saveBtn && cancelBtn) {
			editBtn.style.display = 'block';
			saveBtn.style.display = 'none';
			cancelBtn.style.display = 'none';
			saveBtn.disabled = false;
			cancelBtn.disabled = false;
		}
		
		showNotification(`${fieldName === 'displayName' ? 'Name' : 'Username'} updated successfully!`, 'success');
		console.log(`${fieldName} saved successfully!`);
		
	} catch (error) {
		console.error(`Error saving ${fieldName}:`, error);
		showNotification(`Error updating ${fieldName === 'displayName' ? 'name' : 'username'}: ${error.message}`, 'error');
		
		// Re-enable buttons on error
		const saveBtn = document.querySelector(`[data-field="${fieldName}"].save-btn`);
		const cancelBtn = document.querySelector(`[data-field="${fieldName}"].cancel-btn`);
		if (saveBtn) saveBtn.disabled = false;
		if (cancelBtn) cancelBtn.disabled = false;
		
	} finally {
		showLoading(false);
	}
}

function cancelEdit(fieldName, originalValue) {
	const input = document.getElementById(fieldName);
	const editBtn = document.querySelector(`[data-field="${fieldName}"].edit-btn`);
	const saveBtn = document.querySelector(`[data-field="${fieldName}"].save-btn`);
	const cancelBtn = document.querySelector(`[data-field="${fieldName}"].cancel-btn`);
	
	if (input && editBtn && saveBtn && cancelBtn) {
		// Restore original value
		input.value = originalValue || '';
		
		// Disable input and remove styling
		input.readOnly = true;
		input.classList.remove('editing');
		
		// Clean up keyboard event listener
		if (input._handleKeydown) {
			input.removeEventListener('keydown', input._handleKeydown);
			delete input._handleKeydown;
		}
		
		// Toggle button visibility
		editBtn.style.display = 'block';
		saveBtn.style.display = 'none';
		cancelBtn.style.display = 'none';
	}
}

// Load user's blogs for profile page
async function loadUserBlogs() {
	try {
		const currentUser = auth.currentUser;
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
					<a href="createBlog.html" class="create-first-blog-btn">Create Your First Blog</a>
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

// Helper function to generate username from email
function generateUsernameFromEmail(email) {
	if (!email) return '';
	// Extract the part before @ and remove dots and special characters
	return email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
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

		case 'warning':
			notification.style.background = '#ffc107';
			notification.style.color = '#212529';
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


// Author profile page functionality
async function loadAuthorProfile() {
	try {
		console.log("Loading author profile...");
		showLoading(true);
		
		// Get author email from URL parameters
		const urlParams = new URLSearchParams(window.location.search);
		const authorEmail = urlParams.get('email');
		
		if (!authorEmail) {
			showNotification('No author email provided', 'error');
			window.location.href = 'index.html';
			return;
		}
		
		console.log("Loading author profile for email:", authorEmail);
		
		// Find author document
		const authorsRef = collection(db, 'authors');
		const q = query(authorsRef, where('email', '==', authorEmail));
		const querySnapshot = await getDocs(q);
		
		if (querySnapshot.empty) {
			console.log('Author not found');
			showNotification('Author profile not found', 'error');
			window.location.href = 'index.html';
			return;
		}
		
		const authorDoc = querySnapshot.docs[0];
		const authorData = authorDoc.data();
		console.log("Author data found:", authorData);
		
		// Update page elements
		const authorProfileTitle = document.getElementById('authorProfileTitle');
		const authorEmailElement = document.getElementById('author-email');
		const authorProfileImage = document.getElementById('authorProfileImage');
		const authorDisplayName = document.getElementById('authorDisplayName');
		const authorUsername = document.getElementById('authorUsername');
		const authorBio = document.getElementById('authorBio');
		const authorBlogsTitle = document.getElementById('authorBlogsTitle');
		
		// Set profile information
		if (authorProfileTitle) authorProfileTitle.textContent = `${authorData.displayName || authorData.username || 'Author'}'s Profile`;
		if (authorEmailElement) authorEmailElement.textContent = `Author: ${authorData.displayName || authorData.username || authorEmail}`;
		if (authorProfileImage) authorProfileImage.src = authorData.imageUrl || 'assets/placeholderImage.jpg';
		if (authorDisplayName) authorDisplayName.textContent = authorData.displayName || 'Not provided';
		if (authorUsername) authorUsername.textContent = authorData.username || generateUsernameFromEmail(authorEmail);
		if (authorBio) authorBio.textContent = authorData.bio || 'No bio provided';
		if (authorBlogsTitle) authorBlogsTitle.textContent = `${authorData.displayName || authorData.username || 'Author'}'s Blogs`;
		
		// Load author's blogs
		await loadAuthorBlogs(authorEmail);
		
	} catch (error) {
		console.error('Error loading author profile:', error);
		showNotification('Error loading author profile', 'error');
	} finally {
		showLoading(false);
	}
}

// Load author's blogs for author profile page
async function loadAuthorBlogs(authorEmail) {
	try {
		console.log("Loading blogs for author:", authorEmail);
		
		const authorBlogsContainer = document.getElementById('authorBlogs');
		const authorBlogCountElement = document.getElementById('authorBlogCount');
		
		if (!authorBlogsContainer || !authorBlogCountElement) {
			console.log("Author blog container elements not found");
			return;
		}

		// Show loading state
		authorBlogsContainer.innerHTML = `
			<div class="loading-blogs">
				<img src="assets/loadingImage.gif" alt="Loading...">
				<p>Loading author's blogs...</p>
			</div>
		`;

		// Query author's blogs from blogsRef collection
		const blogsRef = collection(db, 'blogsRef');
		const q = query(blogsRef, where('authorEmail', '==', authorEmail));
		const querySnapshot = await getDocs(q);
		
		console.log(`Found ${querySnapshot.size} blogs for author`);

		// Update blog count
		const blogCount = querySnapshot.size;
		authorBlogCountElement.textContent = `${blogCount} blog${blogCount !== 1 ? 's' : ''}`;

		if (querySnapshot.empty) {
			// No blogs found
			authorBlogsContainer.innerHTML = `
				<div class="no-blogs-message">
					<h3>No blogs yet</h3>
					<p>This author hasn't published any blogs yet.</p>
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
						<p class="blog-card-subline">${blogData.subtitle || 'No description available'}</p>
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
			authorBlogsContainer.innerHTML = blogsHTML;
		}

	} catch (error) {
		console.error('Error loading author blogs:', error);
		const authorBlogsContainer = document.getElementById('authorBlogs');
		if (authorBlogsContainer) {
			authorBlogsContainer.innerHTML = `
				<div class="no-blogs-message">
					<h3>Error loading blogs</h3>
					<p>There was an error loading the author's blogs. Please refresh the page and try again.</p>
				</div>
			`;
		}
	}
}

// Function to sync displayName across all blogs when user updates their name
async function syncDisplayNameInBlogs(authorEmail, newDisplayName) {
	try {
		console.log(`Syncing displayName "${newDisplayName}" for all blogs by ${authorEmail}`);
		
		// Update blogs collection
		const blogsRef = collection(db, 'blogs');
		const blogQuery = query(blogsRef, where('authorEmail', '==', authorEmail));
		const blogSnapshot = await getDocs(blogQuery);
		
		const blogUpdatePromises = [];
		blogSnapshot.forEach((blogDoc) => {
			blogUpdatePromises.push(
				updateDoc(doc(db, 'blogs', blogDoc.id), { 
					author: newDisplayName 
				})
			);
		});
		
		// Update blogsRef collection  
		const blogsRefCollection = collection(db, 'blogsRef');
		const blogsRefQuery = query(blogsRefCollection, where('authorEmail', '==', authorEmail));
		const blogsRefSnapshot = await getDocs(blogsRefQuery);
		
		const blogsRefUpdatePromises = [];
		blogsRefSnapshot.forEach((blogRefDoc) => {
			blogsRefUpdatePromises.push(
				updateDoc(doc(db, 'blogsRef', blogRefDoc.id), { 
					author: newDisplayName 
				})
			);
		});
		
		// Execute all updates
		await Promise.all([...blogUpdatePromises, ...blogsRefUpdatePromises]);
		
		console.log(`Successfully synced displayName across ${blogUpdatePromises.length} blogs and ${blogsRefUpdatePromises.length} blog references`);
		
	} catch (error) {
		console.error('Error syncing displayName in blogs:', error);
		// Don't throw the error as the profile update was successful
		showNotification('Profile updated, but there was an issue syncing with blogs. Some blogs may show the old name until refreshed.', 'warning');
	}
}

// Initialize profile page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	// Check if we're on the profile page
	if (window.location.pathname.includes('profile.html')) {
		// Wait for auth state to be determined
		auth.onAuthStateChanged((user) => {
			if (user) {
				loadUserProfile();
			} else {
				console.log("No user signed in, redirecting...");
				window.location.href = 'index.html';
			}
		});
	}

	// Check if we're on the author page
	else if (window.location.pathname.includes('author.html')) {
		// Load author profile directly (doesn't require authentication)
		loadAuthorProfile();
	}
});

// Export functions that might be needed by other scripts
export { loadUserProfile, loadUserBlogs, loadAuthorProfile, loadAuthorBlogs, showLoading, showNotification };

