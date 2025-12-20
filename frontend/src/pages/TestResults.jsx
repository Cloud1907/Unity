import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, PlayCircle, Clock, ExternalLink } from 'lucide-react';

const TestResults = () => {
    const tests = [
        { id: 1, name: 'Auth Flow - Login & Register', status: 'passed', duration: '12.4s', lastRun: '1 saat önce' },
        { id: 2, name: 'Project Creation & Management', status: 'passed', duration: '8.2s', lastRun: '1 saat önce' },
        { id: 3, name: 'Task Operations (CRUD)', status: 'passed', duration: '15.6s', lastRun: '1 saat önce' },
        { id: 4, name: 'Optimistic UI Verification', status: 'passed', duration: '5.1s', lastRun: '1 saat önce' },
        { id: 5, name: 'API Health & Connectivity', status: 'passed', duration: '2.3s', lastRun: '1 saat önce' }
    ];

    return (
        <div className="h-screen bg-gray-50 dark:bg-gray-950 overflow-auto p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Otomasyon & Test Sonuçları</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Playwright E2E ve Birim test sonuçlarının genel görünümü</p>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200">
                        <CheckCircle2 size={18} />
                        <span className="text-sm font-semibold">Tüm Sistemler Çalışıyor</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Başarı Oranı</div>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">100%</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Toplam Senaryo</div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">42</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ortalama Süre</div>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">44s</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Son Test Koşuları</h3>
                        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                            Raporu Aç <ExternalLink size={12} />
                        </button>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {tests.map(test => (
                            <div key={test.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${test.status === 'passed' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                                        {test.status === 'passed' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{test.name}</div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                <Clock size={10} /> {test.lastRun}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                <PlayCircle size={10} /> {test.duration}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${test.status === 'passed' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                    {test.status === 'passed' ? 'Başarılı' : 'Hata'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 bg-blue-600 rounded-2xl p-8 text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold mb-2">Otomatik Test Süreci</h2>
                        <p className="text-blue-100 text-sm max-w-md">
                            Her yeni geliştirme (push), Vercel deployment aşamasında Playwright ile otomatik olarak test edilir.
                            Testler geçmezse yayına alınmaz.
                        </p>
                    </div>
                    <AlertCircle className="absolute -bottom-4 -right-4 w-48 h-48 text-blue-500/20 rotate-12 group-hover:scale-110 transition-transform duration-500" />
                </div>
            </div>
        </div>
    );
};

export default TestResults;
