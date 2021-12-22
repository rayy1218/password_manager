import {
    HashRouter as Router, Routes, Route
} from 'react-router-dom'
import {useState} from 'react'

import Homepage from './pages/Homepage.js'
import Vault from "./pages/Vault.js"

function App(props) {
    //Following two function is solution for refresh of page after query
    const setUserSession = (user) => {
        sessionStorage.setItem('username', user.username)
        sessionStorage.setItem('user_id', user.user_id)
        setUser({username: user.username, user_id: user.user_id})
    }
    
    const getUserSession = () => {
        return {
            username: sessionStorage.getItem('username'),
            user_id: sessionStorage.getItem('user_id')
        }
    }

    const logout = () => {
        setUserSession({username: null, user_id: null})
    }

    const [user, setUser] = useState(getUserSession())

    return ( 
        <> 
            <Router>
                <Routes>
                    <Route exact path='/' element={<Homepage setUser={setUserSession} logout={logout} />} />
                    <Route path='/vault' element={<Vault user={user} setUser={setUserSession} logout={logout} />} />
                </Routes>
            </Router>
        </>
    )
}

export default App
