// Firebase Auth and Firestore initialization for shared use
// Updated: 2025-03-08 - Removed old authentication code
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
import app from './firebaseSetup.js'

// Initialize Firebase services
const auth = getAuth(app)
const firestore = getFirestore(app)

// Export for use in other modules
export { auth, firestore }
export default auth
