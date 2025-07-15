import type { CalculationPlan, Mode, Provider } from '../types';

export async function generateCalculationPlan(mode: Mode, provider: Provider, problem: string): Promise<CalculationPlan> {
    const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode, provider, problem }),
    });

    // Si la respuesta es exitosa y es JSON, la procesamos
    if (response.ok) {
        const data = await response.json();
        return data as CalculationPlan;
    }

    // Si la respuesta no es exitosa, intentamos obtener un mensaje de error claro
    let errorMessage: string;
    try {
        // Primero, intentamos leer el cuerpo como texto
        const errorText = await response.text();
        // Luego, intentamos parsearlo como JSON (por si el backend envió un error JSON)
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || `Error del servidor (${response.status})`;
    } catch (e) {
        // Si el parsing falla, es porque la respuesta no era JSON (probablemente una página de error HTML)
        errorMessage = `El servidor falló (código ${response.status}). Esto puede deberse a un tiempo de espera excedido o un error interno en el servidor.`;
    }

    throw new Error(errorMessage);
}
