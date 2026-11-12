import {useState, useEffect} from 'react'
import {userAPI, permissionAPI} from '../services/api'

export default function UserProfile() {
    const [users, setUsers] = useState([])
    const [permissions, setPermissions] = useState([])
    const [currentUser, setCurrentUser] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    
    // modal states
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingUser, setEditingUser] = useState(null)

    // form states for creating a new user
    const [newEmail, setNewEmail] = useState("")
    const [newPassword, setNewPassword] = useState("")

    // get user data and permissions on mount
    const loadData = async () => {
        try{
            setLoading(true)
            const [usersData, permsData, meData] = await Promise.all([
                userAPI.getAll(),
                permissionAPI.getAll().catch(() => []), 
                userAPI.getCurrentUser().catch(() => null)
            ])
            setUsers(usersData)
            setPermissions(permsData)
            setCurrentUser(meData)

        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    // check if current user has global edit permissions
    const currentUserPerms = currentUser?.permissions ? currentUser.permissions.map(p => p.name): []
    const canEditAnyUser = currentUserPerms.includes('admin') || currentUserPerms.includes('user_profiles')


    const handlePermissionChange = async (userId, permName, assigned) => {
        try{
            if (assigned) {
                await userAPI.addPermission(userId, permName)
            } else {
                await userAPI.removePermission(userId, permName)
            }
            loadData();
        } catch (err) {
            alert(`Error updating permission: ${err.message}`)
        }
    }

    const handleDeleteUser = async (id) => {
        if (!confirm("Are you sure you want to delete this user?")) return
        try {
            await userAPI.delete(id)
            loadData()
        } catch (err) {
            alert(`Error deleting user: ${err.message}`)
        }
    }

    const handleCreateUser = async (e) => {
        e.preventDefault()
        try {
            await userAPI.create({email: newEmail, password: newPassword})
            setNewEmail("")
            setNewPassword("")
            setShowCreateModal(false)
            loadData()
        } catch (err) {
            alert(`Error creating user: ${err.message}`)
        }
    }

    const handleUpdateUser = async (e) => {
        e.preventDefault()
        try {
            await userAPI.update(editingUser.id, {
                email: editingUser.email,
                username: editingUser.username ?? "", 
                display_name: editingUser.display_name ?? "", 
                short_name: editingUser.short_name ?? "",
            })
            setEditingUser(null)
            loadData()
        } catch (err) {
            alert(`Error updating user: ${err.message}`)
        }
    }



    if (loading) return <div className="text-center py-20 text-gray-400">Loading user profiles...</div>
    if (error) return <div className="text-center py-20 text-red-400">Error: {error}</div>

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-100 tracking-wide">User Profiles</h2>
                    <p className = "text-sm text-gray-400 mt-1">Manage Users accounts & permissions</p>
                </div>
                {canEditAnyUser && (
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium
                                px-4 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-950/50 cursor-pointer">
                            + Add New User
                    </button>
                )}
            </div>

            {/*} Users Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-gray-950">
                        <tr>
                            <th className="p-4 text-left text-xs font-semibold text-gray-400 tracking-wider">Email / ID</th>
                            <th className="p-4 text-left text-xs font-semibold text-gray-400 tracking-wider">User Name</th>
                            <th className="p-4 text-left text-xs font-semibold text-gray-400 tracking-wider">Display Name</th>
                            <th className="p-4 text-left text-xs font-semibold text-gray-400 tracking-wider">Short Name</th>
                            <th className="p-4 text-left text-xs font-semibold text-gray-400 tracking-wider">Permissions</th>
                            <th className="p-4 text-left text-xs font-semibold text-gray-400 tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 bg-gray-900">
                        {users.map(u => {
                            const userPermNames = u.permissions ? u.permissions.map(p => p.name) : [];
                            const isSelf = currentUser && currentUser.id === u.id
                            const allowedToEdit = canEditAnyUser || isSelf

                            return (
                                <tr key={u.id} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="p-2 whitespace-nowrap text-sm font-medium text-gray-200">
                                        {u.email} <span className="text-xs text-gray-500 block">ID: {u.id}</span>
                                    </td>
                                    <td className="p-2 whitespace-nowrap text-sm text-gray-300">{u.username}</td>
                                    <td className="p-2 whitespace-nowrap text-sm text-gray-300">{u.display_name}</td>
                                    <td className="p-2 whitespace-nowrap text-sm text-gray-300">{u.short_name}</td>
                                    <td className="p-2 whitespace-nowrap text-sm text-gray-300">
                                        <div className="flex flex-wrap gap-1.5 items-center">
                                            {userPermNames.map(p => (
                                                <span key={p} className="inline-flex items-center bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded text-xs">
                                                    {p}
                                                    {canEditAnyUser && (
                                                        <button
                                                            onClick={() => handlePermissionChange(u.id, p, false)}
                                                            className="ml-1.5 text-indigo-400 hover:text-red-400 font-bold"
                                                            title="Remove permission">
                                                            &times;
                                                        </button>
                                                    )}
                                                </span>
                                            ))}
                                            {/* Assign Permission Dropdown */}
                                            {canEditAnyUser && (
                                                <select
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            handlePermissionChange(u.id, e.target.value, true)
                                                            e.target.value = ""
                                                        }
                                                    }}
                                                    defaultValue=""
                                                    className="bg-gray-950 border border-gray-700 text-gray-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500">
                                                    <option value="" disabled>+ Assign Permission...</option>
                                                    {permissions
                                                        .filter(p => !userPermNames.includes(p.name))
                                                        .map(p => (
                                                            <option key={p.id || p.name} value={p.name}>{p.name}</option>
                                                        ))}
                                                </select>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        {allowedToEdit ? (
                                            <button
                                                onClick={() => setEditingUser(u)}
                                                className="text-indigo-400 hover:text-indigo-300 cursor-pointer">
                                                Edit
                                            </button>
                                        ) : (
                                            <span className="text-gray-600 text-xs">Restricted</span>
                                        )}
                                        {canEditAnyUser && !isSelf && (
                                            <button
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="text-red-400 hover:text-red-300 cursor-pointer">
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/*} Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-100 mb-4">Create New User</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-1">Email</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-700 text-gray-100 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                                    placeholder="user@example.com"
                                    required/>
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-1">Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-700 text-gray-100 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                                    placeholder="••••••••"
                                    required/>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewEmail("")
                                        setNewPassword("")
                                        setShowCreateModal(false)}}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors cursor-pointer">
                                        Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors cursor-pointer"
                                    >Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-100 mb-4">Edit User Profile</h3>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-1">Email</label>
                                <input 
                                    type="email"
                                    value={editingUser.email}
                                    disabled
                                    className="w-full bg-gray-950/50 border border-gray-800 text-gray-500 rounded-lg p-2 text-sm cursor-not-allowed"/>
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-1">Display Name</label>
                                <input 
                                    type="text"
                                    value={editingUser.display_name || ""}
                                    onChange={(e) => setEditingUser({ ...editingUser, display_name: e.target.value})}
                                    className="w-full bg-gray-950 border border-gray-700 text-gray-100 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"/>
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-1">Username</label>
                                <input 
                                    type="text"
                                    value={editingUser.username || ""}
                                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value})}
                                    className="w-full bg-gray-950 border border-gray-700 text-gray-100 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"/>
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-1">Short Name</label>
                                <input 
                                    type="text"
                                    value={editingUser.short_name || ""}
                                    onChange={(e) => setEditingUser({ ...editingUser, short_name: e.target.value})}
                                    className="w-full bg-gray-950 border border-gray-700 text-gray-100 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"/>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors cursor-pointer"
                                    >Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors cursor-pointer"
                                        >Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}