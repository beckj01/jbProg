import {useState, useEffect} from 'react'
import {postAPI, userAPI} from '../services/api'

export default function PostsView() {
    const [posts, setPosts] = useState([])
    const [currentUser, setCurrentUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")

    // track posts IDs the current session has liked to handle toggle cleanly
    const [likedPosts, setLikedPosts] = useState(new Set())

    // form state for creating a new post
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [published, setPublished] = useState(true)

    const [editingPost, setEditingPost] = useState(null)
    const [viewMode, setViewMode] = useState("all") // 'all' or 'me'
    const [skip, setSkip] = useState(0)
    const [hasMore, setsHasMore] = useState(true)
    const LIMIT = 10


    const fetchPosts = async (search = '', reset = false) => {
        try {
            setLoading(true)
            const currentSkip = reset ? 0 : skip

            const [postData, meData] = await Promise.all([
                viewMode === 'me'
                ? postAPI.getMyPosts()
                : postAPI.getAll(search, LIMIT, currentSkip),            
            userAPI.getCurrentUser().catch(() => null)

            ])

            if (reset || viewMode === 'me') {
                setPosts(postData)
                setSkip(LIMIT)
            } else {
                setPosts(prev => {
                    // check to filter out any incoming posts that are already in the state variable
                    const existingIds = new Set(prev.map(item => (item.Post || item).id)) 
                    const uniqueNewPosts = postData.filter(item => !existingIds.has((item.Post ||item).id))
                    return [...prev, ...uniqueNewPosts]
                })
                setSkip(prevSkip => prevSkip + LIMIT)
            }

            setCurrentUser(meData)
            
            // Disable Load more if viewing 'me' (since it returns all at once) or if fewer items return
            if (viewMode === 'me' || postData.length < LIMIT) {
                setsHasMore(false)
            } else {
                setsHasMore(true)
            }            

            // seed liked posts state
            if (postData) {
                setLikedPosts(prev => {
                    const updated = new Set(prev)
                    postData.forEach(item => {
                        if (item.user_voted) updated.add((item.Post || item).id)
                    })
                    return updated
                })
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setsHasMore(viewMode === 'all')
        fetchPosts(searchQuery, true)
    }, [viewMode])

    const handleSearchSubmit = (e) => {
        e.preventDefault()
        setsHasMore(true)
        fetchPosts(searchQuery, true)
    }


    const handleToggleVote = async (postId) => {
        const isCurrentlyLiked = likedPosts.has(postId)
        // if already liked, direction 0 removes the vote. If not liked, direction 1 adds a vote
        const newDirection = isCurrentlyLiked ? 0 : 1
        
        // optimistically update local 'likedPosts' set immediately for snappy UI
        const updatedLikes = new Set(likedPosts)
        if (isCurrentlyLiked) {
            updatedLikes.delete(postId)
        } else {
            updatedLikes.add(postId)
        }
        setLikedPosts(updatedLikes)

        // optimistically update the vote count and user_voted flag in the local posts array
        setPosts(prevPosts =>
            prevPosts.map(item => {
                const post = item.Post || item
                if (post.id === postId) {
                    const currentVotes = item.votes !== undefined ? item.votes : 0
                    const newVotes = isCurrentlyLiked ? Math.max(0, currentVotes - 1) : currentVotes + 1
                    
                    return {
                        ...item,
                        votes: newVotes,
                        user_voted: !isCurrentlyLiked
                    }
                }
            return item
            })
        )

        try {
            await postAPI.vote(postId, newDirection)
        } catch (err) {
            // if backend call fails, revert the local changes back
            if (isCurrentlyLiked) {
                updatedLikes.add(postId)
            } else {
                updatedLikes.delete(postId)
            }
            setLikedPosts(new Set(updatedLikes))

            // revert vote count locally or refetch on error
            fetchPosts(searchQuery, true)
            alert(`Failed to update vote: ${err.message}`)
        }
    }

    const handleCreatePost = async (e) => {
        e.preventDefault()
        try {
            await postAPI.create({title, content, published})
            setTitle('')
            setContent('')
            setShowCreateModal(false)
            fetchPosts(searchQuery, true)
        } catch (err) {
            alert(`Error creating post: ${err.message}`)
        }
    }

    const handleUpdatePost = async (e) => {
        e.preventDefault()
        try {
            await postAPI.update(editingPost.id, {
                title: editingPost.title,
                content: editingPost.content, 
                published: editingPost.published,
            })
            setEditingPost(null)
            fetchPosts(searchQuery, true)
        } catch (err) {
            alert(`Error updating post: ${err.message}`)
        }
    }

    const handleDeletePost = async (postID) => {
        if (!confirm("Are you sure you want to delete this post?")) return
        try {
            await postAPI.delete(postID)
            fetchPosts(searchQuery, true)
        } catch (err) {
            alert (`Error deleting post: ${err.message}`)
        }
    }

    // filter posts by view mode, if view mode 'all' show all published posts and only drafts of the current user
    const filteredPosts = posts


    if (loading && posts.length === 0) return <div className="text-center py-20 text-gray-400">Loading posts...</div>
    if (error) return <div className="text-center py-20 text-red-400">Error: {error}</div>

    return (
    <div className="max-w-5xl mx-auto py-2 px-2">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-3 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-100 tracking-wide">Posts</h2>
                <p className="text-sm text-gray-400 mt-1">A space to share community posts</p>
            </div>
            <div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5
                        py-2 rounded-xl transition-colors shadow-lg shadow-indigo-950/50 cursor-pointer">
                    + Create Post
                </button>
                <div className= "flex items-center gap-2 mt-2 mb-2">
                    <button type="button"
                        onClick={() => setViewMode("all")}
                        className={`p-1 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                            viewMode === 'all'
                            ? `bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-950/50`
                            : `bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800`
                        }`}>
                        All Posts
                    </button>
                    <button type="button"
                        onClick={() => setViewMode("me")}
                        className={`p-1 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                            viewMode === 'me'
                            ? `bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-950/50`
                            : `bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800`
                        }`}>
                        My Posts
                    </button>
                </div>
            </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-8 flex gap-3">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
                className="flex-1 bg-gray-900 border border-gray-800 text-gray-100 rounded-xl
                    px-4 py-3 text-sm focus:outline-non focusLborder-indigo-500 transition-all"
            />
            <button type="submit"
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-6 py-3 rounded-xl
                    text-sm font-medium transition-colors cursor-pointer border border-gray-700"
            >
                Search
            </button>
            {searchQuery && (
                <button type="button"
                    onClick={(() => {
                        setSearchQuery("")
                        setsHasMore(true)
                        fetchPosts("", true)
                    })}
                    className="inline-flex items-center p-2 bg-gray-800 hover:bg-rose-950/40 hover:border-rose-800 hover:text-rose-300 rounded-xl
                        text-gray-200 text-sm font-medium transition-colors cursor-pointer border border-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear Filter
                </button>
            )}
        </form>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPosts.map((item) => {
                const post = item.Post || item
                const votes = item.votes !== undefined ? item.votes : 0
                const isLiked = likedPosts.has(post.id)

                // check if current logged-in user owns this post & only display drafts for the current user
                const isOwner = currentUser && currentUser.id === post.owner_id
                const displayPost = currentUser.id === post.owner_id || post.published

                return (
                    <div key={post.id} 
                    className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl 
                        flex flex-col justify-between hover:border-gray-700 transition-all">
                        <div>
                            <div className="flex justify-between items-start gap-4 mb-3">
                                <h3 className="text-lg font-bold text-gray-100 tracking-tight">{post.title}</h3>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded-full border ${
                                        post.published
                                            ? "bg-emerald-950/50 border-emerald-800 text-emerald-300"
                                            : "bg-amber-950/50 border-amber-800 text-amber-300"
                                    }`}>
                                        {post.published ? "Published" : "Draft"}
                                    </span>

                                    {/* Edit & delete Icons only visible to the owner*/}
                                    {isOwner && (
                                        <div className="flex items-center gap-1 bg-gray-950 border border-gray-800 rounded-lg p-1">
                                            <button 
                                                onClick={() => setEditingPost(post)}
                                                className="p-1 text-gray-400 hover:text-indigo-400 rounded transition-colors cursor-pointer"
                                                title="Edit post">
                                                {/* Pencil Icon */}
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"/>
                                                </svg>
                                            </button>
                                            <button 
                                                onClick={() => handleDeletePost(post.id)}
                                                className="p-1.5 text-gray-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                                                title="Delete post"
                                                >
                                                {/* Red X Icon */}
                                                <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                                </svg>
                                                </button>
                                        </div>
                                    )}
                                </div>
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

        {/* Load More Button */}
        {hasMore && posts.length > 0 && (
            <div className="text-center mt-8">
                <button
                    type="button"
                    onClick={() => fetchPosts(searchQuery, false)}
                    disabled={loading}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 terxt-gray-200 text-sm font-medium rounded-xl
                        transition-colors cursor-pointer border boder-gray-700 disabled:opacity-50">
                    {loading ? "Loading..." : "Load More Posts"}
                </button>
            </div>
        )}

        {!hasMore && posts.length > 0 && (
            <div className="text-center mt-8 text-xs text-gray-500">
                You've reach the end of the posts.
            </div>
        )}

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

        {/* Edit Post Modal */}
        {editingPost && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-100 mb-4">Edit Post</h3>
            <form onSubmit={handleUpdatePost} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Title</label>
                <input 
                  type="text" 
                  value={editingPost.title} 
                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })} 
                  className="w-full bg-gray-950 border border-gray-700 text-gray-100 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500"
                  required 
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Content</label>
                <textarea 
                  value={editingPost.content} 
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })} 
                  rows="4"
                  className="w-full bg-gray-950 border border-gray-700 text-gray-100 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                  required 
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="edit-published"
                  checked={editingPost.published} 
                  onChange={(e) => setEditingPost({ ...editingPost, published: e.target.checked })} 
                  className="rounded bg-gray-950 border-gray-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="edit-published" className="text-sm text-gray-300 font-medium">Published</label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-950/50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
        )}


    </div>
    )
}