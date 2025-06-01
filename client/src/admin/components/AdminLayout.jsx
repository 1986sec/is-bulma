import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AdminLayout = ({ children }) => {
    const { t } = useTranslation();
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const menuItems = [
        { path: '/admin', label: t('admin.dashboard') },
        { path: '/admin/users', label: t('admin.users') },
        { path: '/admin/jobs', label: t('admin.jobs') },
        { path: '/admin/reports', label: t('admin.reports') },
        { path: '/admin/settings', label: t('admin.settings') }
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="flex">
                {/* Sidebar */}
                <div className="w-64 bg-white shadow-lg h-screen fixed">
                    <div className="p-4">
                        <h1 className="text-xl font-bold text-gray-800 mb-8">Admin Panel</h1>
                        <nav>
                            <ul className="space-y-2">
                                {menuItems.map((item) => (
                                    <li key={item.path}>
                                        <Link
                                            to={item.path}
                                            className={`block px-4 py-2 rounded-lg ${
                                                isActive(item.path)
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="ml-64 flex-1 p-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AdminLayout; 