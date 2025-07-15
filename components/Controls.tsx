
import React from 'react';
import type { Mode, Provider } from '../types';

interface ControlsProps {
    mode: Mode;
    onModeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    provider: Provider;
    onProviderChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    isLoading: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ mode, onModeChange, provider, onProviderChange, isLoading }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
                <label htmlFor="provider-select" className="block text-lg font-semibold mb-3 text-slate-700">1. Seleccione el proveedor de IA</label>
                <select 
                    id="provider-select"
                    value={provider}
                    onChange={onProviderChange}
                    disabled={isLoading}
                    className="w-full h-[42px] px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 bg-white"
                >
                    <option value="google">Google Gemini</option>
                    <option value="kimi">OpenRouter - Kimi</option>
                    <option value="mistral">OpenRouter - Mistral</option>
                    <option value="todas">Todas las IAs (Paralelo)</option>
                </select>
            </div>
            <div>
                <h2 className="text-lg font-semibold mb-3 text-slate-700">2. Seleccione el modo</h2>
                <div className="flex items-center space-x-4 p-2 border border-slate-300 rounded-lg h-[42px]">
                    <label className="flex items-center cursor-pointer w-full h-full justify-center">
                        <input
                            type="radio"
                            name="mode"
                            value="preciso"
                            checked={mode === 'preciso'}
                            onChange={onModeChange}
                            disabled={isLoading}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-slate-700">Modo Preciso</span>
                    </label>
                    <div className="border-l h-full border-slate-300"></div>
                    <label className="flex items-center cursor-pointer w-full h-full justify-center">
                        <input
                            type="radio"
                            name="mode"
                            value="experimental"
                            checked={mode === 'experimental'}
                            onChange={onModeChange}
                            disabled={isLoading}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-slate-700">Modo Experimental</span>
                    </label>
                </div>
            </div>
        </div>
    );
};
