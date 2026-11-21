import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function AuthPage({ mode }) {
    const isRegister = mode === 'register';
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');

    const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        try {
            if(isRegister) await register(form.name, form.email, form.password);
            else await login(form.email, form.password);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div style={{ maxWidth: 360, margin: '4rem auto' }}>
            <h1>{isRegister ? 'Create account' : 'Log in'}</h1>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem'}}>
                {isRegister && (
                    <input name="name" placeholder="Name" value={form.name} onChange={update} required />
                )}
                <input name="email" type="email" placeholder="Email" value={form.email} onChange={update} required />
                <input name="password" type="password" placeholder="Password (8+ characters)" value={form.password} onChange={update} required />
                {error && <p style={{ color: 'crimson', margin: 0 }}>{error}</p>}
                <button type="submit">{isRegister ? 'Sign up' : 'Log in'}</button>
            </form>
            <p>
                {isRegister ? (
                    <>Already have an account? <Link to="/login">Log in</Link></>
                ) : (
                    <>New here? <Link to="/register">Create an account</Link></>
                )}
            </p>
            </div>
    );
}