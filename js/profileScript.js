import { getAuth, signOut } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'
import { getFirestore, doc, getDoc, getDocs, updateDoc, query, collection, where } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js'
import app from './firebaseSetup.js'

const auth = getAuth(app)
const firestore = getFirestore(app)
const storage = getStorage(app)

// DOM elements
const avatarPreview = document.getElementById('avatarPreview')
const avatarInput = document.getElementById('avatarInput')
const displayNameInput = document.getElementById('displayName')
const emailInput = document.getElementById('email')
const bioInput = document.getElementById('bio')
const saveBtn = document.getElementById('saveProfile')
const signOutBtn = document.getElementById('signOutBtn')
const messageDiv = document.getElementById('message')

let currentUser = null
let userProfile = null
let selectedFile = null

// Check authentication state
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user
        await loadUserProfile()
    } else {
        // Redirect to login if not authenticated
        window.location.href = 'index.html'
    }
})

// Load user profile from Firestore
async function loadUserProfile() {
    try {
        showMessage('Loading profile...', 'info')
        
        // Query the authors collection to find the user's profile
        const authorsRef = collection(firestore, "authors")
        const q = query(authorsRef, where("email", "==", currentUser.email))
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0]
            userProfile = doc.data()
            populateForm(userProfile)
        } else {
            // Create a new profile if none exists
            userProfile = {
                displayName: currentUser.displayName || '',
                email: currentUser.email,
                bio: "",
                imageUrl: currentUser.photoURL || "https://placehold.jp/150x150.png"
            }
            populateForm(userProfile)
        }
        
        hideMessage()
    } catch (error) {
        console.error('Error loading profile:', error)
        showMessage('Error loading profile. Please try again.', 'error')
    }
}

// Populate form with user data
function populateForm(profile) {
    displayNameInput.value = profile.displayName || ''
    emailInput.value = profile.email || ''
    bioInput.value = profile.bio || ''
    avatarPreview.src = profile.imageUrl || 'assets/placeholderImage.jpg'
}

// Handle avatar file selection
avatarInput.addEventListener('change', (event) => {
    const file = event.target.files[0]
    if (file) {
        selectedFile = file
        
        // Preview the selected image
        const reader = new FileReader()
        reader.onload = (e) => {
            avatarPreview.src = e.target.result
        }
        reader.readAsDataURL(file)
    }
})

// Handle save profile
saveBtn.addEventListener('click', async () => {
    if (!currentUser) {
        showMessage('Please sign in to update your profile.', 'error')
        return
    }
    
    try {
        saveBtn.disabled = true
        saveBtn.textContent = 'Saving...'
        
        let imageUrl = userProfile?.imageUrl || 'https://placehold.jp/150x150.png'
        
        // Upload new avatar if selected
        if (selectedFile) {
            showMessage('Uploading avatar...', 'info')
            imageUrl = await uploadAvatar(selectedFile)
            showMessage('Avatar uploaded! Saving profile...', 'info')
        } else {
            showMessage('Saving profile...', 'info')
        }
        
        // Update profile data
        const updatedProfile = {
            displayName: displayNameInput.value.trim(),
            email: currentUser.email,
            bio: bioInput.value.trim(),
            imageUrl: imageUrl,
            lastUpdated: new Date()
        }
        
        // Update in Firestore
        await updateUserProfile(updatedProfile)
        
        userProfile = updatedProfile
        selectedFile = null
        
        showMessage('Profile updated successfully!', 'success')
        saveBtn.textContent = 'Save Changes'
        saveBtn.disabled = false
        
        // Clear the file input
        avatarInput.value = ''
        
    } catch (error) {
        console.error('Error saving profile:', error)
        showMessage('Error saving profile. Please try again.', 'error')
        saveBtn.textContent = 'Save Changes'
        saveBtn.disabled = false
    }
})

// Compress image before upload
function compressImage(file) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        img.onload = () => {
            // Set maximum dimensions
            const maxWidth = 300
            const maxHeight = 300
            
            let { width, height } = img
            
            // Calculate new dimensions
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width
                    width = maxWidth
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height
                    height = maxHeight
                }
            }
            
            canvas.width = width
            canvas.height = height
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height)
            canvas.toBlob(resolve, 'image/jpeg', 0.8) // 80% quality
        }
        
        img.src = URL.createObjectURL(file)
    })
}

// Upload avatar to Firebase Storage
async function uploadAvatar(file) {
    try {
        // Compress the image first
        const compressedFile = await compressImage(file)
        
        const fileName = `avatars/${currentUser.uid}_${Date.now()}.jpg`
        const storageRef = ref(storage, fileName)
        
        const snapshot = await uploadBytes(storageRef, compressedFile)
        const downloadURL = await getDownloadURL(snapshot.ref)
        
        return downloadURL
    } catch (error) {
        console.error('Error uploading avatar:', error)
        throw error
    }
}

// Update user profile in Firestore
async function updateUserProfile(profileData) {
    // First, try to find existing profile
    const authorsRef = collection(firestore, "authors")
    const q = query(authorsRef, where("email", "==", currentUser.email))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
        // Update existing profile
        const docRef = doc(firestore, "authors", querySnapshot.docs[0].id)
        await updateDoc(docRef, profileData)
    } else {
        // Create new profile (this should not happen in normal flow)
        const docRef = doc(collection(firestore, "authors"))
        await updateDoc(docRef, profileData)
    }
}


// Show message
function showMessage(text, type) {
    messageDiv.textContent = text
    messageDiv.className = `message ${type}`
    messageDiv.style.display = 'block'
}

// Hide message
function hideMessage() {
    messageDiv.style.display = 'none'
}

// Handle form validation
function validateForm() {
    const displayName = displayNameInput.value.trim()
    const bio = bioInput.value.trim()
    
    if (!displayName) {
        showMessage('Display name is required.', 'error')
        return false
    }
    
    if (displayName.length > 50) {
        showMessage('Display name must be less than 50 characters.', 'error')
        return false
    }
    
    if (bio.length > 500) {
        showMessage('Bio must be less than 500 characters.', 'error')
        return false
    }
    
    return true
}

// Add form validation to save button
saveBtn.addEventListener('click', (e) => {
    if (!validateForm()) {
        e.preventDefault()
        return
    }
})

// Handle sign out
signOutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth)
        window.location.href = 'index.html'
    } catch (error) {
        console.error('Sign out error:', error)
        alert('Error signing out. Please try again.')
    }
}) 