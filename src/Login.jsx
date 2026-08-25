import { useState } from "react"
import { auth } from "./firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"

function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isSignUp, setIsSignUp] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password)
            } else {
                await signInWithEmailAndPassword(auth, email, password)
            }
            onLoginSuccess()
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div>
            <h1>Budget App</h1>
            <form onSubmit = {handleSubmit}>
                <input
                    type = "email"
                    placeholder = "Email"
                    value = {email}
                    onChange = {(e) => setEmail(e.target.value)}
                />
                <input
                    type = "password"
                    placeholder = "Password"
                    value = {password}
                    onChange = {(e) => setPassword(e.target.value)}
                />
                <button type = "submit">
                    {isSignUp ? "Sign Up" : "Log In"}
                </button>
            </form>

            <button onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
            </button>

            {error && <p style = {{ color: "red" }}>{error}</p>}
        </div>
    )
}

export default Login