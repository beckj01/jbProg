export default function Home({setCurrentView}) {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 md:p-12 shadow-xl">
                <h2 className="text-3xl font-bold text-gray-100 mb-4 tracking-tight">JB Progress Database</h2>
                <p className="text-gray-400 text-base mb-8 leading-relaxed">
                    Welcome to the JB Progress Database. Use the navigation links above or options below to navigate through the various screens.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div onClick={() => setCurrentView('posts')}
                        className="bg-gray-950 border border-gray-800 hover:border-indigo-500/50 rounded-xl p-6 cursor-pointer transition-all group">
                        <h3 className="text-lg font-semibold text-gray-200 group-hover:text-indigo-400 mb-b">Posts &rarr;</h3>
                        <p className="text-sm text-gray-400">Social Posts with other users on this platform</p>
                    </div>

                    <div onClick={() => setCurrentView("user")}
                        className="bg-gray-950 border border-gray-800 hover:border-indigo-500/50 rounded-xl p-6 cursor-pointer transition-all group">
                        <h3 className="text-lg font-semibold text-gray-200 group-hover:text-indigo-400 mb-b">User Profiles &rarr;</h3>
                        <p className="text-sm text-gray-400">Manage user profiles and system access permissions</p>
                    </div>

                    <div onClick={() => setCurrentView('quantities')}
                        className="bg-gray-950 border border-gray-800 hover:border-indigo-500/50 rounded-xl p-6 cursor-pointer transition-all group">
                        <h3 className="text-lg font-semibold text-gray-200 group-hover:text-indigo-400 mb-b">Quantities &rarr;</h3>
                        <p className="text-sm text-gray-400">Manage quantities measure on this project</p>
                    </div>
                </div>

                
            </div>
        </div>
    )
}