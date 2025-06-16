import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function Navbar({ darkMode, toggleDarkMode }) {
  const { t, i18n } = useTranslation();
  const token = localStorage.getItem('token');

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-primary dark:text-primary-300">Anlıkeleman.com</span>
            </Link>
            {token && (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  to="/jobs"
                  className="text-primary dark:text-primary-300 hover:text-primary-600 dark:hover:text-primary-200 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('jobs.title')}
                </Link>
                <Link
                  to="/profile"
                  className="text-primary dark:text-primary-300 hover:text-primary-600 dark:hover:text-primary-200 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('profile.title')}
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-primary dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-gray-800"
            >
              {darkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={() => changeLanguage('tr')}
              className={`px-3 py-1 rounded ${
                i18n.language === 'tr'
                  ? 'bg-primary text-white'
                  : 'bg-primary-100 text-primary dark:bg-gray-800 dark:text-primary-300'
              }`}
            >
              TR
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`px-3 py-1 rounded ${
                i18n.language === 'en'
                  ? 'bg-primary text-white'
                  : 'bg-primary-100 text-primary dark:bg-gray-800 dark:text-primary-300'
              }`}
            >
              EN
            </button>

            {token ? (
              <button
                onClick={handleLogout}
                className="text-primary dark:text-primary-300 hover:text-primary-600 dark:hover:text-primary-200"
              >
                {t('auth.logout')}
              </button>
            ) : (
              <Link
                to="/login"
                className="text-primary dark:text-primary-300 hover:text-primary-600 dark:hover:text-primary-200"
              >
                {t('auth.login')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 