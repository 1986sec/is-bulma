import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

const Dashboard = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalJobs: 0,
        activeJobs: 0,
        totalApplications: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/stats');
            setStats(response.data);
            setError('');
        } catch (err) {
            setError(t('common.error'));
        } finally {
            setLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('admin.dashboard')}</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* İstatistik Kartları */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-gray-500 text-sm font-medium mb-2">{t('admin.totalUsers')}</h3>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalUsers}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-gray-500 text-sm font-medium mb-2">{t('admin.totalJobs')}</h3>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalJobs}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-gray-500 text-sm font-medium mb-2">{t('admin.activeJobs')}</h3>
                    <p className="text-3xl font-bold text-gray-800">{stats.activeJobs}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-gray-500 text-sm font-medium mb-2">{t('admin.totalApplications')}</h3>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalApplications}</p>
                </div>
            </div>

            {/* Son Aktiviteler */}
            <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{t('admin.recentActivity')}</h2>
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <p className="text-gray-600">{t('admin.noRecentActivity')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 