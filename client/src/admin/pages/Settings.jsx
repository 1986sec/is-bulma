import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

const Settings = () => {
    const { t } = useTranslation();
    const [settings, setSettings] = useState({
        siteName: '',
        siteDescription: '',
        contactEmail: '',
        maxJobPostings: 0,
        allowUserRegistration: true,
        requireEmailVerification: true,
        defaultLanguage: 'en',
        maintenanceMode: false
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/settings');
            setSettings(response.data);
            setError('');
        } catch (err) {
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put('/admin/settings', settings);
            setSuccess(t('common.success'));
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(t('common.error'));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-xl text-gray-600">{t('common.loading')}</div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">{t('admin.systemSettings')}</h1>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                    {success}
                </div>
            )}

            <div className="bg-white rounded-lg shadow">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Site Settings */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {t('admin.siteSettings')}
                        </h3>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t('admin.siteName')}
                                </label>
                                <input
                                    type="text"
                                    name="siteName"
                                    value={settings.siteName}
                                    onChange={handleSettingChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t('admin.siteDescription')}
                                </label>
                                <textarea
                                    name="siteDescription"
                                    value={settings.siteDescription}
                                    onChange={handleSettingChange}
                                    rows="3"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t('admin.contactEmail')}
                                </label>
                                <input
                                    type="email"
                                    name="contactEmail"
                                    value={settings.contactEmail}
                                    onChange={handleSettingChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Job Settings */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {t('admin.jobSettings')}
                        </h3>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t('admin.maxJobPostings')}
                                </label>
                                <input
                                    type="number"
                                    name="maxJobPostings"
                                    value={settings.maxJobPostings}
                                    onChange={handleSettingChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* User Settings */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {t('admin.userSettings')}
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="allowUserRegistration"
                                    checked={settings.allowUserRegistration}
                                    onChange={handleSettingChange}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-900">
                                    {t('admin.allowUserRegistration')}
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="requireEmailVerification"
                                    checked={settings.requireEmailVerification}
                                    onChange={handleSettingChange}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-900">
                                    {t('admin.requireEmailVerification')}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* System Settings */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {t('admin.systemSettings')}
                        </h3>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t('admin.defaultLanguage')}
                                </label>
                                <select
                                    name="defaultLanguage"
                                    value={settings.defaultLanguage}
                                    onChange={handleSettingChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                    <option value="en">English</option>
                                    <option value="tr">Türkçe</option>
                                </select>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="maintenanceMode"
                                    checked={settings.maintenanceMode}
                                    onChange={handleSettingChange}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-900">
                                    {t('admin.maintenanceMode')}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                        >
                            {t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings; 