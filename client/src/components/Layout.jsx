import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';

const Layout = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        // Sistem temasını kontrol et
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setDarkMode(true);
        }
    }, []);

    useEffect(() => {
        // Tema değişikliğini uygula
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    return (
        <div className="min-h-screen bg-background text-text">
            <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <main className="container mx-auto px-4 py-8">
                <Outlet />
            </main>
            <footer className="bg-primary text-white py-8">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-xl font-bold mb-4">Anlıkeleman.com</h3>
                            <p className="text-primary-100">
                                Türkiye'nin güvenli ve modern iş platformu
                            </p>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Hızlı Bağlantılar</h4>
                            <ul className="space-y-2">
                                <li><a href="/hakkimizda" className="text-primary-100 hover:text-white">Hakkımızda</a></li>
                                <li><a href="/is-ilanlari" className="text-primary-100 hover:text-white">İş İlanları</a></li>
                                <li><a href="/iletisim" className="text-primary-100 hover:text-white">İletişim</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4">İletişim</h4>
                            <ul className="space-y-2 text-primary-100">
                                <li>Email: info@anlik-eleman.com</li>
                                <li>Tel: +90 (212) 123 45 67</li>
                                <li>Adres: İstanbul, Türkiye</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-primary-400 text-center text-primary-100">
                        <p>&copy; {new Date().getFullYear()} Anlıkeleman.com. Tüm hakları saklıdır.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout; 