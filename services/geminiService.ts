import type { CalculationPlan, Mode, Provider } from '../types';

export async function generateCalculationPlan(mode: Mode, provider: Provider, problem: string): Promise<CalculationPlan> {
    const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode, provider, problem }),
    });

    const data = await response.json();

    if (!response.ok) {
        // El servidor devuelve un objeto { error: message } en caso de fallo
        throw new Error(data.error || 'Ocurrió un error en la comunicación con el servidor.');
    }

    // El servidor devuelve el plan de cálculo en caso de éxito
    return data as CalculationPlan;
}
