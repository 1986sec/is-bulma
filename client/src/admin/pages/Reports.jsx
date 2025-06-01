import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

const Reports = () => {
    const { t } = useTranslation();
    const [reports, setReports] = useState({
        jobApplications: [],
        userRegistrations: [],
        jobPostings: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchReports();
    }, [dateRange]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/reports', {
                params: dateRange
            });
            setReports(response.data);
            setError('');
        } catch (err) {
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleDateRangeChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({
            ...prev,
            [name]: value
        }));
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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">{t('admin.reports')}</h1>
                <div className="flex space-x-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('common.startDate')}
                        </label>
                        <input
                            type="date"
                            name="startDate"
                            value={dateRange.startDate}
                            onChange={handleDateRangeChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('common.endDate')}
                        </label>
                        <input
                            type="date"
                            name="endDate"
                            value={dateRange.endDate}
                            onChange={handleDateRangeChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Job Applications Report */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {t('admin.jobApplications')}
                    </h3>
                    <div className="space-y-4">
                        {reports.jobApplications.map((application, index) => (
                            <div key={index} className="border-b pb-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {application.jobTitle}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {application.applicantName}
                                        </p>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {new Date(application.date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* User Registrations Report */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {t('admin.userRegistrations')}
                    </h3>
                    <div className="space-y-4">
                        {reports.userRegistrations.map((registration, index) => (
                            <div key={index} className="border-b pb-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {registration.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {registration.email}
                                        </p>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {new Date(registration.date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Job Postings Report */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {t('admin.jobPostings')}
                    </h3>
                    <div className="space-y-4">
                        {reports.jobPostings.map((posting, index) => (
                            <div key={index} className="border-b pb-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {posting.title}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {posting.company}
                                        </p>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {new Date(posting.date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports; 