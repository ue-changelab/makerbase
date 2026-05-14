import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { User, Settings, LogOut, Sun, Moon, Tent } from 'lucide-react'

function Layout({ children }) {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [darkMode, setDarkMode] = useState(() => {
        const stored = localStorage.getItem('darkMode')
        if (stored !== null) return stored === 'true'
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    })
    const dropdownRef = useRef(null)

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
            document.body.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
            document.body.classList.remove('dark')
        }
        localStorage.setItem('darkMode', darkMode)
    }, [darkMode])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setUserMenuOpen(false)
            }
        }
        if (userMenuOpen) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [userMenuOpen])

    useEffect(() => { setMobileMenuOpen(false) }, [location.pathname])

    const isAdmin = user?.role === 'Admin'
    const isOfficer = user?.role === 'Admin' || user?.role === 'Officer' || user?.role === 'Leader'

    const navigation = [
        { name: 'Dashboard', path: '/' },
        { name: 'Equipment', path: '/equipment' },
        { name: 'Checkouts', path: '/checkout-history' },
        ...(isOfficer ? [{ name: 'Bulk Checkout', path: '/bulk-checkout' }] : []),
        { name: 'SKU Manager', path: '/sku-manager' },
        { name: 'Vendors', path: '/vendors' },
        ...(isAdmin ? [{ name: 'Users', path: '/users' }] : []),
    ]

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/'
        return location.pathname.startsWith(path)
    }

    const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-200">
            <nav className="bg-gradient-to-r from-primary-dark to-primary shadow-nav sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14">
                        <Link to="/" className="flex items-center flex-shrink-0 gap-2">
                            <Tent className="w-5 h-5 text-white" />
                            <span className="font-bold text-white hidden md:block text-sm">UE Venturing Crew</span>
                            <span className="font-bold text-white md:hidden text-sm">UE Venturing</span>
                        </Link>

                        <div className="hidden lg:flex items-center space-x-0.5">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                                        isActive(item.path)
                                            ? 'bg-white/20 text-white'
                                            : 'text-white/70 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                                title={darkMode ? 'Light mode' : 'Dark mode'}
                            >
                                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>

                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors"
                                >
                                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {initials}
                                    </div>
                                    <span className="hidden sm:block text-white font-medium text-sm max-w-[80px] truncate">
                                        {user?.name?.split(' ')[0]}
                                    </span>
                                    <span className={`hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] text-white font-semibold uppercase tracking-wide ${
                                        user?.role === 'Admin' ? 'bg-red-500/60' :
                                        user?.role === 'Officer' || user?.role === 'Leader' ? 'bg-blue-400/60' : 'bg-green-500/60'
                                    }`}>
                                        {user?.role}
                                    </span>
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 z-50 overflow-hidden">
                                        <div className="sm:hidden px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
                                        </div>
                                        <button onClick={() => { navigate('/profile'); setUserMenuOpen(false) }}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <User className="w-4 h-4" /> Profile
                                        </button>
                                        <button onClick={() => { navigate('/profile'); setUserMenuOpen(false) }}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <Settings className="w-4 h-4" /> Settings
                                        </button>
                                        <div className="border-t border-gray-100 dark:border-gray-700" />
                                        <button onClick={() => { logout(); navigate('/login'); setUserMenuOpen(false) }}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                            <LogOut className="w-4 h-4" /> Log Out
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="lg:hidden p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                {mobileMenuOpen ? (
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="lg:hidden border-t border-white/10 bg-primary-dark/80 backdrop-blur-sm">
                        <div className="px-4 py-3 space-y-1">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                        isActive(item.path)
                                            ? 'bg-white/15 text-white'
                                            : 'text-white/70 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {item.name}
                                    {isActive(item.path) && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </nav>

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </main>

            <footer className="border-t border-gray-200 dark:border-gray-800 mt-auto">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                        © 2026 UE Venturing Crew Inventory · Built by Ezekiel Grant · Wood Badge Goal #1
                    </p>
                </div>
            </footer>
        </div>
    )
}

export default Layout
