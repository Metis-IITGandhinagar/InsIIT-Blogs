import { doc, getDoc, updateDoc, setDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
import { auth, db } from './firebaseSetup.js'

// DOM elements
const profileAvatar = document.getElementById('profileAvatar')
const avatarInput = document.getElementById('avatarInput')
const avatarOverlay = document.getElementById('avatarOverlay')
const displayNameInput = document.getElementById('displayName')
const emailInput = document.getElementById('email')
const bioInput = document.getElementById('bio')
const editButton = document.getElementById('editButton')
const saveButton = document.getElementById('saveButton')
const cancelButton = document.getElementById('cancelButton')
const backButton = document.getElementById('backButton')
const blogsCountElement = document.getElementById('blogsCount')
const memberSinceElement = document.getElementById('memberSince')
const loadingOverlay = document.getElementById('loadingOverlay')

// State variables
let originalData = {}
let isEditing = false

// Initialize profile page
async function initializeProfile() {
    console.log('Initializing profile page...')
    // Check if user is authenticated
    const user = auth.currentUser
    console.log('Current user:', user)
    
    if (user) {
        console.log('User is authenticated, loading profile...')
        await loadUserProfile(user.uid)
    } else {
        console.log('No current user, waiting for auth state...')
        // Wait for auth state to be determined
        auth.onAuthStateChanged(async (user) => {
            console.log('Auth state changed:', user)
            if (user) {
                console.log('User authenticated, loading profile...')
                await loadUserProfile(user.uid)
            } else {
                console.log('No user found, redirecting to home...')
                // Redirect to home if not authenticated
                window.location.href = 'index.html'
            }
        })
    }
}

// Load user profile data
async function loadUserProfile(userId) {
    console.log('Loading profile for user:', userId)
    try {
        const userDocRef = doc(db, "authors", userId)
        const userDoc = await getDoc(userDocRef)
        
        if (userDoc.exists()) {
            const userData = userDoc.data()
            console.log('User data loaded:', userData)
            originalData = { ...userData }
            
            // Populate form fields
            displayNameInput.value = userData.displayName || ''
            emailInput.value = userData.email || ''
            bioInput.value = userData.bio || ''
            
            // Set avatar
            if (userData.imageUrl) {
                profileAvatar.src = userData.imageUrl
            }
            
            // Set member since date
            if (userData.createdAt) {
                const date = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt)
                memberSinceElement.textContent = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            }
            
            // TODO: Load blogs count (you can implement this when you have blogs collection)
            blogsCountElement.textContent = '0'
            
        } else {
            console.error('User profile not found for ID:', userId)
            // Try to create the profile if it doesn't exist
            try {
                await setDoc(doc(db, "authors", userId), {
                    displayName: auth.currentUser.displayName,
                    email: auth.currentUser.email,
                    bio: "Hey there! I'm using IITGN blogs",
                    imageUrl: auth.currentUser.photoURL || "https://placehold.jp/150x150.png",
                    uid: userId,
                    createdAt: new Date()
                })
                console.log('Profile created, reloading...')
                window.location.reload()
            } catch (createError) {
                console.error('Error creating profile:', createError)
                alert('Profile not found. Please sign in again.')
                window.location.href = 'index.html'
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error)
        alert('Error loading profile. Please try again.')
    }
}

// Enable edit mode
function enableEditMode() {
    isEditing = true
    
    // Make fields editable
    displayNameInput.readOnly = false
    bioInput.readOnly = false
    
    // Show/hide buttons
    editButton.style.display = 'none'
    saveButton.style.display = 'inline-block'
    cancelButton.style.display = 'inline-block'
    
    // Enable avatar upload
    avatarOverlay.style.display = 'flex'
    
    // Add visual feedback
    displayNameInput.classList.add('editing')
    bioInput.classList.add('editing')
}

// Disable edit mode
function disableEditMode() {
    isEditing = false
    
    // Make fields read-only
    displayNameInput.readOnly = true
    bioInput.readOnly = true
    
    // Show/hide buttons
    editButton.style.display = 'inline-block'
    saveButton.style.display = 'none'
    cancelButton.style.display = 'none'
    
    // Disable avatar upload
    avatarOverlay.style.display = 'none'
    
    // Remove visual feedback
    displayNameInput.classList.remove('editing')
    bioInput.classList.remove('editing')
    
    // Reset to original values
    displayNameInput.value = originalData.displayName || ''
    bioInput.value = originalData.bio || ''
    if (originalData.imageUrl) {
        profileAvatar.src = originalData.imageUrl
    }
}

// Save profile changes
async function saveProfileChanges() {
    const user = auth.currentUser
    if (!user) return
    
    try {
        showLoading(true)
        
        const userDocRef = doc(db, "authors", user.uid)
        const updates = {
            displayName: displayNameInput.value.trim(),
            bio: bioInput.value.trim(),
            updatedAt: new Date()
        }
        
        // Update Firestore
        await updateDoc(userDocRef, updates)
        
        // Update original data
        originalData = { ...originalData, ...updates }
        
        // Disable edit mode
        disableEditMode()
        
        showLoading(false)
        alert('Profile updated successfully!')
        
    } catch (error) {
        console.error('Error saving profile:', error)
        showLoading(false)
        alert('Error saving profile. Please try again.')
    }
}

// Handle avatar upload
function handleAvatarUpload(event) {
    const file = event.target.files[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.')
        return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB.')
        return
    }
    
    // Create preview
    const reader = new FileReader()
    reader.onload = function(e) {
        profileAvatar.src = e.target.result
        // Store the new image URL temporarily
        originalData.imageUrl = e.target.result
    }
    reader.readAsDataURL(file)
}

// Show/hide loading overlay
function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none'
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure Firebase is fully initialized
    setTimeout(() => {
        initializeProfile()
    }, 100)
    
    // Edit button
    editButton.addEventListener('click', enableEditMode)
    
    // Save button
    saveButton.addEventListener('click', saveProfileChanges)
    
    // Cancel button
    cancelButton.addEventListener('click', disableEditMode)
    
    // Back button
    backButton.addEventListener('click', () => {
        window.location.href = 'index.html'
    })
    
    // Avatar upload
    avatarOverlay.addEventListener('click', () => {
        if (isEditing) {
            avatarInput.click()
        }
    })
    
    avatarInput.addEventListener('change', handleAvatarUpload)
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isEditing) {
            disableEditMode()
        }
        
        if (event.ctrlKey && event.key === 's' && isEditing) {
            event.preventDefault()
            saveProfileChanges()
        }
    })
})

// Add CSS for editing state
const style = document.createElement('style')
style.textContent = `
    .profile-input.editing,
    .profile-textarea.editing {
        background: white !important;
        color: #333 !important;
        cursor: text !important;
        border-color: #007bff !important;
    }
    
    .avatar-overlay {
        display: none;
    }
    
    .editing .avatar-overlay {
        display: flex !important;
    }
`
document.head.appendChild(style) 