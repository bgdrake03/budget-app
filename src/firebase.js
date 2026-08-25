import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
    apiKey: "AIzaSyA9taFsT7_ul6UQXZ_0SnRnjV6qd6cSGHg",
    authDomain: "budget-app-d9495.firebaseapp.com",
    projectId: "budget-app-d9495",
    storeBucket: "budget-app-d9495.firebasestorage.app",
    messagingSenderId: "521529902682",
    appId: "1:521529902682:web:5731b2ab568eca9032fa63",
    measurementId: "G-M2V64X1WZ4"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)