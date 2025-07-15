import React from 'react';

interface ProblemInputProps {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onCalculate: () => void;
    isLoading: boolean;
}

const ProblemInput: React.FC<ProblemInputProps> = ({ value, onChange, onCalculate, isLoading }) => {
    return (
        <div className="mt-6">
            <label htmlFor="problem-textarea" className="block text-lg font-semibold mb-3 text-slate-700">
                3. Describa su problema financiero
            </label>
            <textarea
                id="problem-textarea"
                className="w-full h-36 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 resize-y"
                placeholder="Ej: Calcule el monto a interés compuesto de un capital de $5000 a una TNA del 12% capitalizable mensualmente durante 2 años."
                value={value}
                onChange={onChange}
                disabled={isLoading}
            />
            <button
                onClick={onCalculate}
                disabled={isLoading || !value}
                className="mt-4 w-full flex justify-center items-center gap-x-3 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200"
            >
                {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Procesando...</span>
                    </>
                ) : (
                    'Resolver con IA'
                )}
            </button>
        </div>
    );
};

export default ProblemInput;
