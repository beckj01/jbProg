import { useState } from 'react'
import './index.css'
import UserProfile from './components/UserProfiles'
import NavBar from './components/NavBar'
import Home from './components/Home'
import Login from './components/Login'
import QtyView from './components/Quantities'
import PostsView from './components/Posts'

export default function App() {
  // States - these are similar to a variable, values that can be used in various places/scopes
  const [currentView, setCurrentView] = useState("home");
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  }

  if (!token) {
    return <Login onLoginSuccess={(newToken) => {
      localStorage.setItem('token', newToken);
      setToken(newToken);
    }}/>
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <NavBar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogout={handleLogout}
      />

      <main className="p-6">
        {currentView === "home" && <Home setCurrentView={setCurrentView} />}
        {currentView === "posts" && <PostsView setCurrentView={setCurrentView} />}
        {currentView === "quantities" && <QtyView setCurrentView={setCurrentView}/>}
        {currentView === "user" && <UserProfile setCurrentView={setCurrentView}/>}
      </main>
    </div>
  )
}

