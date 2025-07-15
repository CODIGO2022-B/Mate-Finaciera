
import React, { useState, useCallback } from 'react';
import type { AppResult, Provider, Mode } from './types';
import { generateCalculationPlan } from './services/geminiService';
import { executePlan } from './services/calculationEngine';
import ProblemInput from './components/ProblemInput';
import ResultsDisplay from './components/ResultsDisplay';
import Header from './components/Header';
import { ErrorAlert } from './components/Alerts';
import { Controls } from './components/Controls';

const PROVIDER_NAMES: Record<Provider, string> = {
    google: 'Google Gemini',
    kimi: 'OpenRouter Kimi',
    mistral: 'OpenRouter Mistral',
    todas: 'Todas las IAs',
};

const App: React.FC = () => {
    const [problemDescription, setProblemDescription] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<AppResult[] | null>(null);
    const [provider, setProvider] = useState<Provider>('google');
    const [mode, setMode] = useState<Mode>('preciso');

    const handleCalculate = useCallback(async () => {
        if (!problemDescription.trim()) {
            setError("Por favor, describe el problema financiero.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResults(null);

        const providersToRun: Provider[] = provider === 'todas'
            ? ['google', 'kimi', 'mistral']
            : [provider];

        try {
            const promises = providersToRun.map(async (p): Promise<AppResult> => {
                try {
                    const plan = await generateCalculationPlan(mode, p, problemDescription);
                    const executedSteps = executePlan(plan);
                    return { provider: p, plan, executedSteps, error: null };
                } catch (e: unknown) {
                    console.error(`Error with provider ${p}:`, e);
                    const message = e instanceof Error ? e.message : "Ocurrió un error desconocido.";
                    return { provider: p, plan: null, executedSteps: null, error: message };
                }
            });

            const settledResults = await Promise.all(promises);
            
            // Check if there's a general error that applies to all, like a network issue before starting.
            if (settledResults.every(res => res.error)) {
                 setError(settledResults[0].error); // Show the first error as a general message
            } else {
                 setResults(settledResults);
            }

        } catch (e: unknown) {
            console.error(e);
            const message = e instanceof Error ? `Ocurrió un error general: ${e.message}` : "Ocurrió un error desconocido.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [problemDescription, provider, mode]);
    
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-6xl mx-auto">
                <Header />
                <main className="mt-8">
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md">
                        {error && !isLoading && (
                            <div className="mb-6">
                                <ErrorAlert message={error} />
                            </div>
                        )}
                        <Controls 
                            provider={provider}
                            onProviderChange={(e) => setProvider(e.target.value as Provider)}
                            mode={mode}
                            onModeChange={(e) => setMode(e.target.value as Mode)}
                            isLoading={isLoading}
                        />
                        <ProblemInput
                            value={problemDescription}
                            onChange={(e) => setProblemDescription(e.target.value)}
                            onCalculate={handleCalculate}
                            isLoading={isLoading}
                        />
                    </div>
                    
                    {isLoading && (
                       <div className="flex justify-center items-center mt-8 p-8 bg-white rounded-xl shadow-md">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="ml-4 text-lg font-semibold text-slate-600">Analizando y calculando...</p>
                        </div>
                    )}
                    
                    {!isLoading && results && (
                        <div className={`mt-8 ${provider === 'todas' ? 'space-y-8' : ''}`}>
                           {results.map(res => (
                               <div key={res.provider} className={provider === 'todas' ? 'bg-white rounded-xl shadow-md p-6 border' : ''}>
                                   {provider === 'todas' && (
                                       <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b-2 border-slate-200 pb-2">
                                          Resultados de: <span className="text-blue-600">{PROVIDER_NAMES[res.provider as keyof typeof PROVIDER_NAMES]}</span>
                                       </h2>
                                   )}
                                   {res.error && <ErrorAlert message={res.error} />}
                                   {res.plan && res.executedSteps && (
                                       <ResultsDisplay plan={res.plan} executedSteps={res.executedSteps} />
                                   )}
                               </div>
                           ))}
                       </div>
                   )}
                </main>
            </div>
        </div>
    );
};

export default App;
