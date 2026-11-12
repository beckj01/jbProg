const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {...options.headers};

    if (!(options.body instanceof FormData) && !headers['Content-Type'] && options.method && options.method !== 'GET') {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options, 
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "An error occured during the request.");
    }

    // handle 204 No Content responses safely
    if (response.status === 204) return null;

    return response.json();
}   


export const authAPI = {
    login: async (email, password) => {
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);
    
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST", 
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
            body: formData,
        });

        if (!response.ok) throw new Error("Invalid email or password");

        return response.json();
    },
}

export const userAPI = {
    getAll: () => apiRequest("/users/"),
    getCurrentUser: () => apiRequest("/users/me"),
    create: (userData) => apiRequest("/users/", {
        method: "POST", 
        body: JSON.stringify(userData),
    }),
    update: (id, userData) => apiRequest(`/users/${id}`, {
        method:"PUT",
        body: JSON.stringify(userData),
    }),
    delete: (id) => apiRequest(`/users/${id}`, {
        method:"DELETE",
    }),
    addPermission: (userId, permissionName) => apiRequest(`/users/${userId}/permissions/`, {
        method:"POST",
        body: JSON.stringify({name: permissionName}),        
    }),
    removePermission: (userId, permissionName) => apiRequest(`/users/${userId}/permissions/${permissionName}`, {
        method:"DELETE",
    }),
};


export const postAPI = {
    getAll: (search = '', limit = 10, skip = 0) => 
        apiRequest(`/posts/?search=${encodeURIComponent(search)}&limit=${limit}&skip=${skip}`),
    
    getMyPosts: () => apiRequest("/posts/me"),

    create: (postData) => apiRequest("/posts/", {
        method: "POST", 
        body: JSON.stringify(postData),
    }),

    delete: (id) => apiRequest(`/posts/${id}`, {
        method: "DELETE",
    }),

    vote: (postID, direction) => apiRequest("/vote/", {
        method: "POST",
        body: JSON.stringify({post_id: postID, direction: direction}),
    }),
}


export const permissionAPI = {
    getAll: () => apiRequest("/users/permissions/"),
}

export const qtyAPI = {
    getAll: () => apiRequest("/qty/"),
}