import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const JobCard = ({ job }) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{job.title}</h3>
            <div className="flex items-center text-gray-600 mb-4">
                <span className="mr-4">{job.company}</span>
                <span>{job.location}</span>
            </div>
            <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
                {job.skills?.map((skill, index) => (
                    <span
                        key={index}
                        className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full"
                    >
                        {skill}
                    </span>
                ))}
            </div>
            <div className="flex justify-between items-center">
                <span className="text-indigo-600 font-medium">{job.salary}</span>
                <Link
                    to={`/jobs/${job._id}`}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    {t('common.view')} →
                </Link>
            </div>
        </div>
    );
};

export default JobCard; 