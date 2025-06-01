import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Layout = ({ children }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between h-16">
                        <div className="flex space-x-8">
                            <Link to="/" className="flex items-center">
                                <span className="text-xl font-bold text-gray-800">İş Platformu</span>
                            </Link>
                            {token && (
                                <div className="hidden md:flex items-center space-x-4">
                                    <Link
                                        to="/jobs"
                                        className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        {t('jobs.title')}
                                    </Link>
                                    <Link
                                        to="/profile"
                                        className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        {t('profile.title')}
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => changeLanguage('tr')}
                                className={`px-3 py-1 rounded ${i18n.language === 'tr' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                            >
                                TR
                            </button>
                            <button
                                onClick={() => changeLanguage('en')}
                                className={`px-3 py-1 rounded ${i18n.language === 'en' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                            >
                                EN
                            </button>

                            {token ? (
                                <button
                                    onClick={handleLogout}
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    {t('auth.logout')}
                                </button>
                            ) : (
                                <Link
                                    to="/login"
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    {t('auth.login')}
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
};

export default Layout; 