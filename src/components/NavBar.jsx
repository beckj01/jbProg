 export default function NavBar({currentView, setCurrentView, onLogout}) {

    return(
        <nav className="bg-gray-900 border-b border_gray-800 p-4 flex justify-between items-center, text-gray-200">
            <h1 onClick={() => setCurrentView("home")} 
                className="font-bold text-lg tracking-wide text-indigo-400 cursor-pointer">
                    JB Progress Database
            </h1>
            <div className="flex items-center space-x-6">
                <button onClick={() => setCurrentView("home")} 
                    className={`text-sm font-medium transition-colors hover:text-indigo-400 cursor-pointer ${currentView === "home" ? "text-indigo-400" : "text-gray-400"}`}>
                    Home
                </button>
                <button onClick={() => setCurrentView("posts")} 
                    className={`text-sm font-medium transition-colors hover:text-indigo-400 cursor-pointer ${currentView === "posts" ? "text-indigo-400" : "text-gray-400"}`}>
                    Posts
                </button>
                <button onClick={() => setCurrentView("quantities")} 
                    className={`text-sm font-medium transition-colors hover:text-indigo-400 cursor-pointer ${currentView === "quantities" ? "text-indigo-400" : "text-gray-400"}`}>
                    Quantities
                </button>
                <button onClick={() => setCurrentView("user")} 
                    className={`text-sm font-medium transition-colors hover:text-indigo-400 cursor-pointer ${currentView === "user" ? "text-indigo-400" : "text-gray-400"}`}>
                    User Profiles
                </button>
                <button onClick={onLogout} 
                    className="bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium px-3 py-1 rounded-lg 
                        transition-colors shadow-lg shadow-red-950/30 cursor-pointer">
                    Logout
                </button>
            </div>
        </nav>
    )
}