import { getAuth, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'
import { getFirestore, collection, addDoc, doc, getDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
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
const adminPanelButton = document.querySelector('#adminPanelButton');

async function checkUserIsAdmin(user) {
    if (user && adminPanelButton) {
        adminPanelButton.style.display = 'block';
    } else if (adminPanelButton) {
        adminPanelButton.style.display = 'none';
    }
}

async function signInWithGoogle() {
	signInWithPopup(auth, provider)
	  .then((result) => {
	    var user = result.user;
		const firestore = getFirestore(app)
		const authorsRef = collection(firestore, "authors");
		const q = query(authorsRef, where("email", "==", user.email));
		
		return getDocs(q).then((querySnapshot) => {
			if (querySnapshot.empty) {
				return addDoc(collection(firestore, "authors"), {
					displayName: user.displayName,
					email: user.email,
					username: generateUsernameFromEmail(user.email),
					bio: "Hey there! I'm using IITGN blogs",
					imageUrl: user.photoURL || "https://ui-avatars.io/api/?name=" + encodeURIComponent(user.displayName || user.email) + "&background=dd7a7a&color=fff&size=150"
				});
			}
		});
	    
	  }).then((doc) => {
		  if(doc) {
			console.log("User saved at:", doc)
		  }
	  }).catch((error) => {
	    console.log(error)
	  })
	     
}

function updateUserInterface(user) {
	if (user) {
		const photoURL = user.photoURL
		const displayName = user.displayName || 'User'
		
		if (photoURL) {
			userIcon.innerHTML = `<img src="${photoURL}" alt="${displayName}" title="${displayName}">`
			userIcon.classList.add('profile-image')
		} else {
			userIcon.innerHTML = displayName.charAt(0).toUpperCase()
			userIcon.classList.remove('profile-image')
		}
		
		userDropdown.style.display = 'block'
		
	} else {
		userIcon.innerHTML = 'Sign In'
		userIcon.classList.remove('profile-image')
		userDropdown.style.display = 'none'
	}
}

auth.onAuthStateChanged((user) => {
	if (user) {
        if (!user.email || !user.email.endsWith('@iitgn.ac.in')) {
            signOut(auth); 
            alert("Access denied. Please sign in with your IITGN email address.");
            if (window.location.pathname.includes('createBlog.html') || window.location.pathname.includes('profile.html')) {
                window.location.href = '/index.html';
            }
            return;
        }

		currentUser = user;
		updateUserInterface(user);
        checkUserIsAdmin(user);

		const userEmailElement = document.getElementById("user-email");
		if (userEmailElement) {
			userEmailElement.textContent = `Welcome, ${user.displayName || user.email}!`;
		}

		userIcon.removeEventListener('click', signInWithGoogle);
		logoutButton.addEventListener('click', signOutWithGoogle);
		if (viewProfileButton) {
			viewProfileButton.addEventListener('click', goToProfile);
		}
        if (adminPanelButton) {
            adminPanelButton.addEventListener('click', goToAdmin);
        }

	} else {
		currentUser = null;
		updateUserInterface(null);
        checkUserIsAdmin(null);

		const userEmailElement = document.getElementById("user-email");
		if (userEmailElement) {
			userEmailElement.textContent = "Please sign in to access all features.";
		}

		userIcon.addEventListener('click', signInWithGoogle);
	}
});

function signOutWithGoogle() {
	signOut(auth);
}

function goToProfile() {
	window.location.href = 'profile.html';
}

function goToAdmin() {
    window.location.href = 'admin.html';
}

function generateUsernameFromEmail(email) {
	if (!email) return '';
	return email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

export default auth;
