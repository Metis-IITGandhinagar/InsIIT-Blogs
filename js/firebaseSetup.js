import firebaseConfig from './firebaseConfig.js'
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js'
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export { app, auth, db }
