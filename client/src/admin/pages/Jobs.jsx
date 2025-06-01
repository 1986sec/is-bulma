import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

const Jobs = () => {
    const { t } = useTranslation();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/jobs');
            setJobs(response.data);
            setError('');
        } catch (err) {
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleEditJob = (job) => {
        setSelectedJob(job);
        setShowEditModal(true);
    };

    const handleDeleteJob = async (jobId) => {
        if (window.confirm(t('common.confirm'))) {
            try {
                await api.delete(`/admin/jobs/${jobId}`);
                fetchJobs();
            } catch (err) {
                setError(t('common.error'));
            }
        }
    };

    const handleUpdateJob = async (jobData) => {
        try {
            await api.put(`/admin/jobs/${selectedJob.id}`, jobData);
            setShowEditModal(false);
            fetchJobs();
        } catch (err) {
            setError(t('common.error'));
        }
    };

    const handleCreateJob = async (jobData) => {
        try {
            await api.post('/admin/jobs', jobData);
            setShowCreateModal(false);
            fetchJobs();
        } catch (err) {
            setError(t('common.error'));
        }
    };

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <h1 className="text-2xl font-bold text-gray-800">{t('admin.jobManagement')}</h1>
                <div className="flex space-x-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={t('common.search')}
                            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg
                            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                        {t('jobs.createJob')}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('jobs.jobTitle')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('jobs.jobCategory')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('jobs.jobLocation')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('jobs.jobType')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('jobs.jobStatus')}
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('common.edit')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredJobs.map((job) => (
                            <tr key={job.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{job.title}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{job.category}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{job.location}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{job.type}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {job.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleEditJob(job)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        {t('common.edit')}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteJob(job.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        {t('common.delete')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {showEditModal && selectedJob && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {t('common.edit')} {t('jobs.jobTitle')}
                            </h3>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdateJob({
                                    title: e.target.title.value,
                                    category: e.target.category.value,
                                    location: e.target.location.value,
                                    type: e.target.type.value,
                                    status: e.target.status.value,
                                    description: e.target.description.value,
                                    requirements: e.target.requirements.value,
                                    benefits: e.target.benefits.value
                                });
                            }}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        {t('jobs.jobTitle')}
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        defaultValue={selectedJob.title}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        {t('jobs.jobCategory')}
                                    </label>
                                    <input
                                        type="text"
                                        name="category"
                                        defaultValue={selectedJob.category}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        {t('jobs.jobLocation')}
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        defaultValue={selectedJob.location}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        {t('jobs.jobType')}
                                    </label>
                                    <select
                                        name="type"
                                        defaultValue={selectedJob.type}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    >
                                        <option value="full-time">{t('jobs.fullTime')}</option>
                                        <option value="part-time">{t('jobs.partTime')}</option>
                                        <option value="contract">{t('jobs.contract')}</option>
                                        <option value="remote">{t('jobs.remote')}</option>
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        {t('jobs.jobStatus')}
                                    </label>
                                    <select
                                        name="status"
                                        defaultValue={selectedJob.status}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        {t('jobs.jobDescription')}
                                    </label>
                                    <textarea
                                        name="description"
                                        defaultValue={selectedJob.description}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        rows="3"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        {t('jobs.jobRequirements')}
                                    </label>
                                    <textarea
                                        name="requirements"
                                        defaultValue={selectedJob.requirements}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        rows="3"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        {t('jobs.jobBenefits')}
                                    </label>
                                    <textarea
                                        name="benefits"
                                        defaultValue={selectedJob.benefits}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        rows="3"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-indigo-600 text-white px-4 py-2 rounded"
                                    >
                                        {t('common.save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {t('jobs.createJob')}
                            </h3>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleCreateJob({
                                    title: e.target.title.value,
                                    category: e.target.category.value,
                                    location: e.target.location.value,
                                    type: e.target.type.value,
                                    status: e.target.status.value,
                                    description: e.target.description.value,
                                    requirements: e.target.requirements.value,
                                    benefits: e.target.benefits.value
                                });
                            }}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        {t('jobs.jobTitle')}
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        {t('jobs.jobCategory')}
                                    </label>
                                    <input
                                        type="text"
                                        name="category"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        {t('jobs.jobLocation')}
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        {t('jobs.jobType')}
                                    </label>
                                    <select
                                        name="type"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    >
                                        <option value="full-time">{t('jobs.fullTime')}</option>
                                        <option value="part-time">{t('jobs.partTime')}</option>
                                        <option value="contract">{t('jobs.contract')}</option>
                                        <option value="remote">{t('jobs.remote')}</option>
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        {t('jobs.jobStatus')}
                                    </label>
                                    <select
                                        name="status"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        {t('jobs.jobDescription')}
                                    </label>
                                    <textarea
                                        name="description"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        rows="3"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        {t('jobs.jobRequirements')}
                                    </label>
                                    <textarea
                                        name="requirements"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        rows="3"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        {t('jobs.jobBenefits')}
                                    </label>
                                    <textarea
                                        name="benefits"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        rows="3"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-indigo-600 text-white px-4 py-2 rounded"
                                    >
                                        {t('common.save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Jobs; 