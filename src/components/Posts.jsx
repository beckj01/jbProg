import {useState, useEffect} from 'react'
import {postAPI} from '../services/api'

export default function PostsView() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")

    // track posts IDs the current session has liked to handle toggle cleanly
    const [likedPosts, setLikedPosts] = useState(new Set())

    // form state for creating a new post
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [published, setPublished] = useState(true)


    const fetchPosts = async (search = '') => {
        try {
            setLoading(true)
            const data = await postAPI.getAll(search)
            setPosts(data)
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPosts()
    }, [])

    const handleSearchSubmit = (e) => {
        e.preventDefault()
        fetchPosts(searchQuery)
    }


    const handleToggleVote = async (postId) => {
        const isCurrentlyLiked = likedPosts.has(postId)
        // if already liked, direction 0 removes the vote. If not liked, direction 1 adds a vote
        const newDirection = isCurrentlyLiked ? 0 : 1
        try {
            await postAPI.vote(postId, newDirection)

            // update local tracking set for UI feedback
            const updatedLikes = new Set(likedPosts)
            if (isCurrentlyLiked) {
                updatedLikes.delete(postId)
            } else {
                updatedLikes.add(postId)
            }
            setLikedPosts(updatedLikes)

            // refresh post list to pull updated vote counts aggregated from the DB
            fetchPosts(searchQuery)

        } catch (err) {
            // if backend returns a 409 conflict (already voted), sync local state
            if (err.message.includes("already voted")) {
                const updatedLikes = new Set(likedPosts)
                updatedLikes.add(postId)
                setLikedPosts(updatedLikes)
            }
            alert(`${err.message}`)
        }
    }

    const handleCreatePost = async (e) => {
        e.preventDefault()
        try {
            await postAPI.create({title, content, published})
            setTitle('')
            setContent('')
            setShowCreateModal(false)
            fetchPosts(searchQuery)
        } catch (err) {
            alert(`Error creating post: ${err.message}`)
        }
    }



    if (loading && posts.length === 0) return <div className="text-center py-20 text-gray-400">Loading posts...</div>
    if (error) return <div className="text-center py-20 text-red-400">Error: {error}</div>

    return (
    <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-100 tracking-wide">Posts</h2>
                <p className="text-sm text-gray-400 mt-1">A space to share comnmunity posts</p>
            </div>
            <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5
                    py-2 rounded-xl transition-colors shadow-lg shadow-indigo-950/50 cursor-pointer">
                + Create Post
            </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-8 flex gap-3">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts by title..."
                className="flex-1 bg-gray-900 border border-gray-800 text-gray-100 rounded-xl
                    px-4 py-3 text-sm focus:outline-non focusLborder-indigo-500 transition-all"
            />
            <button type="submit"
                className="bg-gray-800 hover:bg-gray-700 test-gray-200 px-6 py-3 rounded-xl
                    text-sm font-medium transition-colors cursor-pointer border border-gray-700"
            >
                Search
            </button>
        </form>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((item) => {
                const post = item.Post || item
                const votes = item.votes !== undefined ? item.votes : 0
                const isLiked = likedPosts.has(post.id)

                return (
                    <div key={post.id} 
                    className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl 
                        flex flex-col justify-between hover:border-gray-700 transition-all">
                        <div>
                            <div className="flex justify-between items-start gap-4 mb-3">
                                <h3 className="text-lg font-bold text-gray-100 tracking-tight">{post.title}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full border ${
                                    post.published
                                        ? "bg-emerald-950/50 border-emerald-800 text-emerald-300"
                                        : "bg-amber-950/50 border-amber-800 text-amber-300"
                                }`}>
                                    {post.published ? "Published" : "Draft"}
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm mb-6 leading-relaxed line-clamp-3">{post.content}</p>
                        </div>

                        {/* Card Footer with Like / Vote Button */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-800/80">
                            <div className="text-xs flex flex-col">
                                <span className="text-gray-400 font-medium">
                                    {post.owner?.display_name || post.owner?.email}
                                </span>
                                <span className="text-gray-500 text-[11px]">
                                    {post.created_at
                                    ? new Date(post.created_at).toLocaleDateString('en-GB', {
                                        day: "2-digit",
                                        month: "short",
                                        year: "2-digit"
                                    }).replace(/ /g, "-"): ""}
                                </span>
                            </div>
                            <button
                                onClick={() => handleToggleVote(post.id)}
                                className={`flex items-center gap-2 border px-3 py-2 rounded-xl text-xs font-medium 
                                    transition-all cursor-pointer shadow-sm ${
                                        isLiked
                                        ? "bg-rose-950/40 border-rose-800 text-rose-300"
                                        : "bg-gray-950 hover:bg-gray-800 border-gray-800 text-gray-300"
                                    }`}
                            >
                                <svg className={`w-4 h-4 ${isLiked ? "text-rose-500 fill-rose-500": "text-gray-400 fill-none"}`} 
                                    stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                </svg>
                                <span>{votes} {votes === 1 ? "Like" : "Likes"}</span>
                            </button>

                        </div>
                    </div>
                )
            })}
        </div>

        {posts.length === 0 && !loading && (
            <div className="text-center py-16 bg-gray-900 border bodrer-gray-800 rounded-2xl text-gray-400 text-sm">
                No posts found matching your search
            </div>
        )}


        {/* Create post Modal */}
        {showCreateModal && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl w-full max-w-md">
                    <h3 className="text-xl font-bold text-gray-100 mb-4">Create new Post</h3>
                    <form onSubmit={handleCreatePost} className="space-y-4">
                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-1">Title</label>
                            <input 
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-700 text-gray-100 rounded-lg
                                    p-3 text-sm focus:outline-none focus:border-indigo-500"
                                placeholder="Post title..."
                                required
                                />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-1">Content</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows="4"
                                className="w-full bg-gray-950 border border-gray-700 text-gray-100 rounded-lg 
                                    p-3 text-sm focus:outline-none focus:border-indigo-500"
                                placeholer="Write your post content here..."
                                required
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="published"
                                checked={published}
                                onChange={(e) => setPublished(e.target.checked)}
                                className="rounded bg-gray-950 border-gray-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            />
                            <label htmlFor="published" className="text-sm text-gray-300 font-medium">Publish</label>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button type="submit"
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-950/50"
                            >Post</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

    </div>
    )
}