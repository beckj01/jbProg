import { useState } from 'react';
import {userAPI} from "../services/api";

export default function AddUser({onUserAdded}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState(null);
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);


    const handleCreateUser = async (e) => {
        e.preventDefault()
        setMessage(null)
        setIsError(false)
        setLoading(true)

        try{
            await userAPI.create({email, password})

            setMessage("User created successfully! Redirecting...")
            setEmail("")
            setPassword("")
        
            setTimeout(() => {
                if (onUserAdded) onUserAdded();
            }, 1200)
        
        } catch (err) {
            setIsError(true)
            setMessage(`Error: ${err.message}`);
        } finally {
            setLoading(false)
        }
    };

    return (
        <div className="px-4 items-center justify-center min-h-[75vh] flex">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-2 text-gray-100 tracking-wide">Add New User</h2>
                <p className="text-sm text-gray-400 mb-6">Add a new account to access this system</p>
                {message && (<div className={`mb-6 p-3 rounded-lg text-sm border ${
                    isError
                    ? `bg-red-950/50 border-red-800 text-red-300`
                    : `bg-emerald-950/50 border-emerald-800 text-emerald-300`
                    }`}>
                    {message}</div>)
                }

                <form onSubmit={handleCreateUser} className="space-y-5">
                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded text-gray-100
                                        rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 
                                        focus:ring-1 focus:ring-indigo-500 transition-all"
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
                            className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-lg p-3 text-sm 
                                    focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button type="submit" 
                            className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 
                                    text-white font-medium p-3 rounded-lg transition-colors shadow-lg
                                    shadow-indigo-950/50 cursor-pointer mt-2">
                            {loading ? "Creating... " : "Create User"}</button>
                </form>
            </div>
        </div>
    );
}
