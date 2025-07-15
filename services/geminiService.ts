
import { GoogleGenAI } from "@google/genai";
import type { CalculationPlan, Mode, Provider } from '../types';
import { PRECISE_SYSTEM_PROMPT, EXPERIMENTAL_SYSTEM_PROMPT } from '../constants';

// This function now handles a single, specific provider.
// The logic to call multiple providers lives in App.tsx.
export async function generateCalculationPlan(mode: Mode, provider: Provider, problem: string): Promise<CalculationPlan> {
    const systemPrompt = mode === 'preciso' ? PRECISE_SYSTEM_PROMPT : EXPERIMENTAL_SYSTEM_PROMPT;
    const fullPrompt = `${systemPrompt}\n\nProblema a resolver: "${problem}"`;

    let rawJsonText = '';

    if (provider === 'google') {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("La variable de entorno 'GEMINI_API_KEY' no está configurada.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        rawJsonText = response.text.trim();
    } else if (provider === 'kimi' || provider === 'mistral') {
        const apiKey = provider === 'kimi' 
            ? process.env.OPENROUTER_KIMI_API_KEY 
            : process.env.OPENROUTER_MISTRAL_API_KEY;

        if (!apiKey) {
            throw new Error(`La variable de entorno para ${provider.toUpperCase()} no está configurada.`);
        }
        
        const model = provider === 'kimi' ? 'moonshot/moonshot-v1-8k' : 'mistralai/mistral-7b-instruct';

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': location.href, 
                'X-Title': 'FinanCalc AI',
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: fullPrompt }],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Error de OpenRouter API (${provider}, ${response.status}): ${errorBody}`);
        }

        const data = await response.json();
        if (!data.choices?.[0]?.message?.content) {
            throw new Error("Respuesta inválida de la API de OpenRouter.");
        }
        rawJsonText = data.choices[0].message.content;
    } else {
        throw new Error(`Proveedor '${provider}' no soportado.`);
    }

    // Common JSON parsing logic
    try {
        const jsonMatch = rawJsonText.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
        if (!jsonMatch) {
            console.error("Respuesta cruda de la IA:", rawJsonText);
            throw new Error("La respuesta de la IA no contiene un objeto JSON válido.");
        }
        const jsonString = jsonMatch[1] || jsonMatch[2];
        return JSON.parse(jsonString) as CalculationPlan;
    } catch (parseError) {
        console.error("Error al parsear JSON, respuesta cruda:", rawJsonText);
        throw new Error("La IA devolvió un JSON con formato incorrecto.");
    }
}
