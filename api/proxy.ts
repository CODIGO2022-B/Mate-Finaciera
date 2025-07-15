// /api/proxy.ts
// Esta es una Vercel Serverless Function que actúa como un proxy seguro a las APIs de IA.

import { GoogleGenAI } from "@google/genai";
import type { CalculationPlan, Mode, Provider } from '../types';
import { PRECISE_SYSTEM_PROMPT, EXPERIMENTAL_SYSTEM_PROMPT } from '../constants';

// Vercel convierte automáticamente esta exportación por defecto en un endpoint de API.
export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { mode, provider, problem } = await request.json() as { mode: Mode, provider: Provider, problem: string };

        // Validación de claves de API en el lado del servidor
        if (provider === 'google' && !process.env.GEMINI_API_KEY) {
            throw new Error("Configuración del servidor incompleta: Falta la variable de entorno 'GEMINI_API_KEY'.");
        }
        if (provider === 'kimi' && !process.env.OPENROUTER_KIMI_API_KEY) {
            throw new Error("Configuración del servidor incompleta: Falta la variable de entorno 'OPENROUTER_KIMI_API_KEY'.");
        }
        if (provider === 'mistral' && !process.env.OPENROUTER_MISTRAL_API_KEY) {
            throw new Error("Configuración del servidor incompleta: Falta la variable de entorno 'OPENROUTER_MISTRAL_API_KEY'.");
        }

        const systemPrompt = mode === 'preciso' ? PRECISE_SYSTEM_PROMPT : EXPERIMENTAL_SYSTEM_PROMPT;
        const fullPrompt = `${systemPrompt}\n\nProblema a resolver: "${problem}"`;

        let rawJsonText = '';

        if (provider === 'google') {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
                config: { responseMimeType: "application/json" }
            });
            rawJsonText = response.text.trim();
        } else if (provider === 'kimi' || provider === 'mistral') {
            const apiKey = provider === 'kimi' 
                ? process.env.OPENROUTER_KIMI_API_KEY 
                : process.env.OPENROUTER_MISTRAL_API_KEY;
            
            const model = provider === 'kimi' ? 'moonshot/moonshot-v1-8k' : 'mistralai/mistral-7b-instruct';

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
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

        // Parseo de JSON
        const jsonMatch = rawJsonText.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
        if (!jsonMatch) {
            console.error("Respuesta cruda de la IA:", rawJsonText);
            throw new Error("La respuesta de la IA no contiene un objeto JSON válido.");
        }
        const jsonString = jsonMatch[1] || jsonMatch[2];
        const plan = JSON.parse(jsonString) as CalculationPlan;

        return new Response(JSON.stringify(plan), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Ocurrió un error desconocido en el servidor.";
        console.error("Error en el Proxy de la API:", message);
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
