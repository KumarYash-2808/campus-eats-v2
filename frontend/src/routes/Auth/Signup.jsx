import React, { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '../../firebase'
import { doc, setDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'


export default function Signup(){
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('user')
    const [cafeteriaId, setCafeteriaId] = useState('') // only for admin
    const [error, setError] = useState(null)
    const navigate = useNavigate()
    async function handleSubmit(e){
        e.preventDefault()
        setError(null)
        try{
            const cred = await createUserWithEmailAndPassword(auth, email, password)
            const profile = { email, role }
            if(role === 'admin') profile.cafeteriaId = cafeteriaId
            await setDoc(doc(db, 'users', cred.user.uid), profile)
            //navigate('/')
        }catch(err){
            setError(err.message)
        }
    }


    return (
    <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Sign up</h2>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <label className="block mb-2">Email
            <input value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" required /></label>
            <label className="block mb-2">Password
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" required /></label>
            <label className="block mb-2">Role
            <select value={role} onChange={e=>setRole(e.target.value)} className="mt-1 w-full border rounded px-3 py-2">
            <option value="user">User</option>
            <option value="admin">Admin (cafeteria manager)</option>
            </select>
            </label>
            {role === 'admin' && (
            <label className="block mb-2">Cafeteria ID
            <input value={cafeteriaId} onChange={e=>setCafeteriaId(e.target.value)} placeholder="cafeteria-001" className="mt-1 w-full border rounded px-3 py-2" required={role==='admin'} /></label>
            )}
            <button className="mt-3 w-full py-2 rounded bg-sky-600 text-white">Create account</button>
        </form>
    </div>
    )
}