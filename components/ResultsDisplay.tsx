import React from 'react';
import type { CalculationPlan, ExecutedStep } from '../types';

interface ResultsDisplayProps {
    plan: CalculationPlan;
    executedSteps: ExecutedStep[];
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ plan, executedSteps }) => {
    const { interpretation, initial_data, final_target_variable } = plan;

    const finalResult = executedSteps.find(step => step.target_variable === final_target_variable)?.result;

    const formatNumber = (num: number | string) => {
        if (typeof num !== 'number') return num;
        if (num === 0) return '0';
        // Use exponential for very small or very large numbers
        if (Math.abs(num) < 0.00001 || Math.abs(num) > 1e12) {
            return num.toExponential(4);
        }
        // For numbers that are integers or have few decimal places
        if (Number.isInteger(num)) {
            return num.toLocaleString('en-US');
        }
         // Use locale string for general numbers with fractions
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8,
        });
    };

    return (
        <div className="mt-8 space-y-8">
            {/* Interpretation Card */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold text-slate-800 mb-3 border-b pb-2">Interpretación de la IA</h2>
                <p className="text-slate-600 italic">"{interpretation}"</p>
            </div>

            {/* Data & Steps Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Initial Data Card */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Datos Extraídos</h2>
                    <ul className="space-y-3">
                        {Object.entries(initial_data).map(([key, value]) => (
                            <li key={key} className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-slate-700 capitalize">{key.replace(/_/g, ' ')}:</span>
                                <span className="bg-slate-100 text-slate-800 font-mono py-1 px-2 rounded">{value}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Calculation Steps Card */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Resolución Paso a Paso</h2>
                    <div className="space-y-6">
                        {executedSteps.map((step, index) => (
                            <div key={index} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                                <p className="font-bold text-slate-700">Paso {index + 1}: {step.step_name}</p>
                                <div className="mt-3 text-sm space-y-2">
                                    <p><span className="font-semibold">Fórmula:</span> <code className="text-blue-700">{step.formula_name}</code></p>
                                    {step.generated_formula && (
                                        <div className="p-3 bg-yellow-100 border border-yellow-300 rounded font-mono text-xs overflow-x-auto">
                                            <span className="font-sans font-semibold text-yellow-800">[Experimental] Fórmula Generada: </span>{step.generated_formula}
                                        </div>
                                    )}
                                    <div className="p-3 bg-slate-200 rounded font-mono text-xs overflow-x-auto">
                                       <span className="font-sans font-semibold">Cálculo: </span>{step.substituted_formula}
                                    </div>
                                    <p className="font-bold text-right pt-1">{step.target_variable} = <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded">{formatNumber(step.result)}</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Final Result Card */}
            {finalResult !== undefined && (
                 <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-xl shadow-lg text-center">
                    <h2 className="text-2xl font-bold mb-2">Resultado Final</h2>
                    <p className="text-lg mb-4 capitalize">{final_target_variable.replace(/_/g, ' ')}</p>
                    <div className="text-5xl font-extrabold bg-white text-blue-700 rounded-lg py-4 px-6 inline-block">
                        {formatNumber(finalResult)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultsDisplay;