import {useState} from 'react';
import {authAPI, userAPI} from "../services/api"

export default function Login({onLoginSuccess}) {
    const [isRegistering, setIsRegistering] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isError, setIsError] = useState(false)
    const [message, setMessage] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setIsError(false);
        setLoading(true);

        try {
            if (isRegistering) {
                // public new user creation
                await userAPI.create ({email, password});
                setMessage("Account created successfully! Please sign in.");
                setIsRegistering(false);
                setPassword('');
            } else {
                // login
                const data = await authAPI.login(email, password);
                onLoginSuccess(data.access_token);
            }
        } catch (err) {
            setIsError(true);
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };


    return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-gray-100 text-center tracking-wide">
            {isRegistering ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="text-sm text-gray-400 mb-6 text-center">
            {isRegistering ? "Register a new account to get started." : "Sign in to JB Progress Database."}
        </p>
        
        {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm border ${
                isError
                    ? "bg-red-950/50 border-red-800 text-red-300"
                    : "bg-emerald-950/50 border-emerald-800 text-emerald-300"
            }`}>
                {message}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full bg-gray-950 border border-gray-800 text-gray-100 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              placeholder="user@example.com"
              required 
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full bg-gray-950 border border-gray-800 text-gray-100 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              placeholder="••••••••"
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-lg shadow-indigo-950/50 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Please Wait...' : (isRegistering ? "Register Account" : "Sign In")}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-gray-700 pt-4">
            <button
                onClick={() => {
                    setIsRegistering(!isRegistering);
                    setMessage(null);
                }}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">
                {isRegistering ? "Already have an account? Sign In" : "Don't have an account? Register"}
            </button>
        </div>

      </div>
    </div>
    )


}