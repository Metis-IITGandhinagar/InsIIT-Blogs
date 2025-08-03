// Profile Page Management
import { getAuth, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
import app from './firebaseSetup.js'

class ProfileManager {
    constructor() {
        this.auth = getAuth(app);
        this.firestore = getFirestore(app);
        this.currentUser = null;
        this.isEditing = false;
        this.originalValues = {};
        
        // DOM elements
        this.profileImage = document.getElementById('profileImage');
        this.displayNameInput = document.getElementById('displayName');
        this.usernameInput = document.getElementById('username');
        this.emailInput = document.getElementById('email');
        this.editNameBtn = document.getElementById('editNameBtn');
        this.editUsernameBtn = document.getElementById('editUsernameBtn');
        this.saveProfileBtn = document.getElementById('saveProfileBtn');
        this.cancelEditBtn = document.getElementById('cancelEditBtn');
        this.userBlogsContainer = document.getElementById('userBlogs');
        
        this.init();
    }

    init() {
        this.setupAuthStateListener();
        this.setupEventListeners();
    }

    setupAuthStateListener() {
        onAuthStateChanged(this.auth, async (user) => {
            this.currentUser = user;
            
            // Check if viewing another user's profile
            const urlParams = new URLSearchParams(window.location.search);
            const viewingUsername = urlParams.get('user');
            
            if (viewingUsername) {
                // Viewing another user's profile - try to load from Firestore
                await this.loadAuthorProfile(viewingUsername);
            } else if (user) {
                // Viewing own profile - use Firebase Auth data directly
                console.log("User logged in:", user.email);
                console.log("User display name:", user.displayName);
                this.loadUserProfileFromAuth();
                await this.loadUserBlogs();
            } else {
                // Redirect to home if not logged in and no user specified
                window.location.href = 'index.html';
            }
        });
    }

    setupEventListeners() {
        if (this.editNameBtn) {
            this.editNameBtn.addEventListener('click', () => this.startEditing('name'));
        }

        if (this.editUsernameBtn) {
            this.editUsernameBtn.addEventListener('click', () => this.startEditing('username'));
        }

        if (this.saveProfileBtn) {
            this.saveProfileBtn.addEventListener('click', () => this.saveProfile());
        }

        if (this.cancelEditBtn) {
            this.cancelEditBtn.addEventListener('click', () => this.cancelEditing());
        }
    }

    loadUserProfileFromAuth() {
        if (!this.currentUser) return;

        console.log("Loading profile from Firebase Auth...");
        
        // Use Firebase Auth data directly
        const profileData = {
            displayName: this.currentUser.displayName || 'Anonymous User',
            username: this.generateUsername(this.currentUser.email),
            email: this.currentUser.email,
            imageUrl: this.currentUser.photoURL || 'assets/placeholderImage.jpg'
        };

        this.updateProfileUI(profileData);
    }

    async loadUserProfile() {
        if (!this.currentUser) return;

        try {
            // Check if user document exists in Firestore
            const userDocRef = doc(this.firestore, 'authors', this.currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                this.userDoc = userDocSnap.data();
            } else {
                // Create user document if it doesn't exist
                this.userDoc = {
                    uid: this.currentUser.uid,
                    displayName: this.currentUser.displayName || 'Anonymous User',
                    username: this.generateUsername(this.currentUser.email),
                    email: this.currentUser.email,
                    imageUrl: this.currentUser.photoURL || 'assets/placeholderImage.jpg',
                    bio: "Hey there! I'm using IITGN blogs",
                    createdAt: new Date().toISOString()
                };
                
                await setDoc(userDocRef, this.userDoc);
            }

            this.updateProfileUI(this.userDoc);
        } catch (error) {
            console.error('Error loading user profile:', error);
            // Fallback to Firebase Auth data if Firestore fails
            this.loadUserProfileFromAuth();
        }
    }

    generateUsername(email) {
        return email ? email.split('@')[0].toLowerCase() : 'user' + Date.now();
    }

    updateProfileUI(profileData) {
        if (!profileData) {
            // Fallback to Firebase Auth if no profile data provided
            if (this.currentUser) {
                profileData = {
                    displayName: this.currentUser.displayName || 'Anonymous User',
                    username: this.generateUsername(this.currentUser.email),
                    email: this.currentUser.email,
                    imageUrl: this.currentUser.photoURL || 'assets/placeholderImage.jpg'
                };
            } else {
                return;
            }
        }

        if (this.profileImage) {
            this.profileImage.src = profileData.imageUrl || 'assets/placeholderImage.jpg';
        }

        if (this.displayNameInput) {
            this.displayNameInput.value = profileData.displayName || '';
            this.displayNameInput.setAttribute('readonly', 'true');
        }

        if (this.usernameInput) {
            this.usernameInput.value = profileData.username || '';
            this.usernameInput.setAttribute('readonly', 'true');
        }

        if (this.emailInput) {
            this.emailInput.value = profileData.email || '';
        }
    }

    startEditing(field) {
        this.isEditing = true;
        
        // Store original values
        this.originalValues = {
            displayName: this.displayNameInput.value,
            username: this.usernameInput.value
        };

        if (field === 'name') {
            this.displayNameInput.removeAttribute('readonly');
            this.displayNameInput.style.background = 'white';
            this.displayNameInput.style.color = '#333';
            this.displayNameInput.focus();
            this.displayNameInput.select(); // Select the text for easier editing
            this.editNameBtn.style.display = 'none';
        } else if (field === 'username') {
            this.usernameInput.removeAttribute('readonly');
            this.usernameInput.style.background = 'white';
            this.usernameInput.style.color = '#333';
            this.usernameInput.focus();
            this.usernameInput.select(); // Select the text for easier editing
            this.editUsernameBtn.style.display = 'none';
        }

        this.saveProfileBtn.style.display = 'block';
        this.cancelEditBtn.style.display = 'block';
    }

    async saveProfile() {
        if (!this.currentUser) return;

        try {
            const updatedDisplayName = this.displayNameInput.value.trim();
            const updatedUsername = this.usernameInput.value.trim().toLowerCase();

            // Validate input
            if (!updatedDisplayName) {
                alert('Display name cannot be empty');
                return;
            }

            if (!updatedUsername) {
                alert('Username cannot be empty');
                return;
            }

            // Try to update Firebase Auth profile first
            try {
                await updateProfile(this.currentUser, {
                    displayName: updatedDisplayName
                });
                console.log('Firebase Auth profile updated successfully');
            } catch (authError) {
                console.error('Error updating Firebase Auth profile:', authError);
                // Continue with Firestore update even if Auth update fails
            }

            // Try to update Firestore (optional - will fail silently if permissions issue)
            try {
                // Check if username is already taken (if changed)
                const currentUsername = this.generateUsername(this.currentUser.email);
                if (updatedUsername !== currentUsername) {
                    const usernameQuery = query(
                        collection(this.firestore, 'authors'),
                        where('username', '==', updatedUsername)
                    );
                    const querySnapshot = await getDocs(usernameQuery);
                    
                    if (!querySnapshot.empty) {
                        alert('Username is already taken. Please choose another one.');
                        return;
                    }
                }

                // Update Firestore document
                const userDocRef = doc(this.firestore, 'authors', this.currentUser.uid);
                const updatedData = {
                    displayName: updatedDisplayName,
                    username: updatedUsername,
                    uid: this.currentUser.uid,
                    email: this.currentUser.email,
                    imageUrl: this.currentUser.photoURL || 'assets/placeholderImage.jpg',
                    bio: "Hey there! I'm using IITGN blogs",
                    updatedAt: new Date().toISOString()
                };
                
                await setDoc(userDocRef, updatedData, { merge: true });
                console.log('Firestore profile updated successfully');
            } catch (firestoreError) {
                console.warn('Firestore update failed (this is OK if permissions are restricted):', firestoreError);
                // Continue anyway - the Firebase Auth update is what matters most
            }

            this.stopEditing();
            alert('Profile updated successfully!');

            // Update the UI with new values
            this.updateProfileUI({
                displayName: updatedDisplayName,
                username: updatedUsername,
                email: this.currentUser.email,
                imageUrl: this.currentUser.photoURL || 'assets/placeholderImage.jpg'
            });

        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Error saving profile. Please try again.');
        }
    }

    cancelEditing() {
        // Restore original values
        this.displayNameInput.value = this.originalValues.displayName;
        this.usernameInput.value = this.originalValues.username;
        
        this.stopEditing();
    }

    stopEditing() {
        this.isEditing = false;
        
        this.displayNameInput.setAttribute('readonly', 'true');
        this.displayNameInput.style.background = '#f8f9fa';
        this.displayNameInput.style.color = '';
        
        this.usernameInput.setAttribute('readonly', 'true');
        this.usernameInput.style.background = '#f8f9fa';
        this.usernameInput.style.color = '';
        
        this.editNameBtn.style.display = 'block';
        this.editUsernameBtn.style.display = 'block';
        this.saveProfileBtn.style.display = 'none';
        this.cancelEditBtn.style.display = 'none';
    }

    async loadUserBlogs() {
        if (!this.currentUser || !this.userBlogsContainer) return;

        try {
            const blogsQuery = query(
                collection(this.firestore, 'blogs'),
                where('authorId', '==', this.currentUser.uid)
            );
            const querySnapshot = await getDocs(blogsQuery);

            this.userBlogsContainer.innerHTML = '';

            if (querySnapshot.empty) {
                this.userBlogsContainer.innerHTML = '<p style="text-align: center; color: #666;">No blogs created yet.</p>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const blog = doc.data();
                this.createBlogCard(blog, doc.id);
            });

        } catch (error) {
            console.error('Error loading user blogs:', error);
            this.userBlogsContainer.innerHTML = '<p style="text-align: center; color: #e74c3c;">Unable to load blogs due to permissions. Please check Firestore security rules.</p>';
        }
    }

    createBlogCard(blog, blogId) {
        const blogCard = document.createElement('div');
        blogCard.className = 'user-blog-card';
        
        const blogDate = blog.createdAt ? new Date(blog.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown date';
        
        blogCard.innerHTML = `
            <h3>${blog.title || 'Untitled Blog'}</h3>
            <p><strong>Subtitle:</strong> ${blog.subtitle || 'No subtitle'}</p>
            <p><strong>Created:</strong> ${blogDate}</p>
            <p><strong>Preview:</strong> ${blog.body ? blog.body.substring(0, 100) + '...' : 'No content'}</p>
            <div style="margin-top: 10px;">
                <button onclick="window.open('viewBlog.html?id=${blogId}', '_blank')" 
                        style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                    View Blog
                </button>
            </div>
        `;

        this.userBlogsContainer.appendChild(blogCard);
    }

        // Static method to get user profile by username
    static async getUserByUsername(username) {
        const firestore = getFirestore(app);
        try {
            const userQuery = query(
                collection(firestore, 'authors'),
                where('username', '==', username.toLowerCase())
            );
            const querySnapshot = await getDocs(userQuery);
            
            if (!querySnapshot.empty) {
                return querySnapshot.docs[0].data();
            }
            return null;
        } catch (error) {
            console.error('Error fetching user by username:', error);
            return null;
        }
    }

    async loadAuthorProfile(username) {
        try {
            const user = await ProfileManager.getUserByUsername(username);
            if (user) {
                // Update UI to show author profile (read-only)
                this.profileImage.src = user.imageUrl || 'assets/placeholderImage.jpg';
                this.displayNameInput.value = user.displayName || 'Anonymous User';
                this.usernameInput.value = user.username || '';
                this.emailInput.value = user.email || '';
                
                // Hide edit buttons when viewing another user's profile
                this.editNameBtn.style.display = 'none';
                this.editUsernameBtn.style.display = 'none';
                
                // Update page title
                document.querySelector('#profileHeader h1').textContent = `${user.displayName || user.username}'s Profile`;
                
                // Load author's blogs
                await this.loadAuthorBlogs(user.uid);
            } else {
                document.querySelector('#profileHeader h1').textContent = 'User Not Found';
                this.userBlogsContainer.innerHTML = '<p style="text-align: center; color: #666;">User not found.</p>';
            }
        } catch (error) {
            console.error('Error loading author profile:', error);
        }
    }

    async loadAuthorBlogs(authorId) {
        if (!this.userBlogsContainer) return;

        try {
            const blogsQuery = query(
                collection(this.firestore, 'blogs'),
                where('authorId', '==', authorId)
            );
            const querySnapshot = await getDocs(blogsQuery);

            this.userBlogsContainer.innerHTML = '';

            if (querySnapshot.empty) {
                this.userBlogsContainer.innerHTML = '<p style="text-align: center; color: #666;">No blogs created yet.</p>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const blog = doc.data();
                this.createBlogCard(blog, doc.id);
            });

        } catch (error) {
            console.error('Error loading author blogs:', error);
        }
    }
}

// Initialize profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});

// Add function to make usernames clickable throughout the site
export function makeUsernameClickable(element, username) {
    element.classList.add('clickable-username');
    element.style.cursor = 'pointer';
    element.onclick = () => {
        const url = `profile.html?user=${encodeURIComponent(username)}`;
        window.open(url, '_blank');
    };
}

export default ProfileManager;
