import type { CalculationPlan, ExecutedStep, CalculationStep } from '../types';
import { evaluate } from 'mathjs';

export function executePlan(plan: CalculationPlan): ExecutedStep[] {
    const calculatedVariables: { [key: string]: number | string } = { ...plan.initial_data };
    const executedSteps: ExecutedStep[] = [];

    plan.calculation_steps.forEach((step: CalculationStep) => {
        // Resolve inputs from previously calculated variables
        const resolvedInputs = { ...step.inputs };
        for (const key in resolvedInputs) {
            const value = resolvedInputs[key];
            if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
                const varName = value.slice(2, -2);
                if (varName in calculatedVariables) {
                    resolvedInputs[key] = calculatedVariables[varName] as number;
                } else {
                    throw new Error(`Variable '${varName}' del paso anterior no encontrada.`);
                }
            }
        }
        
        const { result, substituted_formula } = calculateStep(step, resolvedInputs);

        calculatedVariables[step.target_variable] = result;
        executedSteps.push({
            ...step,
            inputs: resolvedInputs,
            result,
            substituted_formula,
        });
    });

    return executedSteps;
}

function calculateStep(step: CalculationStep, inputs: { [key: string]: any }): { result: number, substituted_formula: string } {
    let result: number;
    let substituted_formula = '';
    
    const { formula_name, generated_formula } = step;
    
    // Alias common variables for easier use in formulas
    const { P, S, j, n, i, R, m, k, G, g, de, N, i_conocida, n_conocida, n_deseada } = inputs;

    switch (formula_name) {
        // Interés Simple
        case 'formula_is_I_from_Pjn':
            result = P * j * n;
            substituted_formula = `${P} * ${j} * ${n} = ${result}`;
            break;
        case 'formula_is_S_from_Pjn':
            result = P * (1 + j * n);
            substituted_formula = `${P} * (1 + ${j} * ${n}) = ${result}`;
            break;
        case 'formula_is_P_from_Sjn':
            result = S / (1 + j * n);
            substituted_formula = `${S} / (1 + ${j} * ${n}) = ${result}`;
            break;

        // Interés Compuesto
        case 'formula_ic_S_from_Pin':
            result = P * Math.pow(1 + i, n);
            substituted_formula = `${P} * (1 + ${i})^${n} = ${result}`;
            break;
        case 'formula_ic_P_from_Sin':
            result = S * Math.pow(1 + i, -n);
            substituted_formula = `${S} * (1 + ${i})^-${n} = ${result}`;
            break;
        case 'formula_ic_n_from_SPi':
            result = Math.log(S / P) / Math.log(1 + i);
            substituted_formula = `log(${S} / ${P}) / log(1 + ${i}) = ${result}`;
            break;
        case 'formula_ic_i_from_SPn':
            result = Math.pow(S / P, 1 / n) - 1;
            substituted_formula = `(${S} / ${P})^(1/${n}) - 1 = ${result}`;
            break;

        // Tasas
        case 'formula_tasa_efectiva_from_nominal':
            const t = inputs.t || 1; // t in years
            result = Math.pow(1 + j / m, m * t) - 1;
            substituted_formula = `(1 + ${j} / ${m})^(${m}*${t}) - 1 = ${result}`;
            break;
        case 'formula_tasa_equivalente':
             result = Math.pow(1 + i_conocida, n_deseada / n_conocida) - 1;
             substituted_formula = `(1 + ${i_conocida})^(${n_deseada}/${n_conocida}) - 1 = ${result}`;
             break;

        // Descuento
        case 'formula_dr_D_from_Sin':
            result = S * (1 - Math.pow(1 + i, -n));
            substituted_formula = `${S} * (1 - (1 + ${i})^-${n}) = ${result}`;
            break;
        case 'formula_db_de_from_Psn':
            result = 1 - Math.pow(P / S, 1 / n);
            substituted_formula = `1 - (${P}/${S})^(1/${n}) = ${result}`;
            break;
        case 'formula_db_P_from_Sden':
            result = S * Math.pow(1 - de, n);
            substituted_formula = `${S} * (1 - ${de})^${n} = ${result}`;
            break;

        // Anualidades Vencidas
        case 'formula_av_S_from_Rin':
            result = R * ((Math.pow(1 + i, n) - 1) / i);
            substituted_formula = `${R} * ((1 + ${i})^${n} - 1) / ${i} = ${result}`;
            break;
        case 'formula_av_P_from_Rin':
            result = R * ((1 - Math.pow(1 + i, -n)) / i);
            substituted_formula = `${R} * (1 - (1 + ${i})^-${n}) / ${i} = ${result}`;
            break;
        case 'formula_av_R_from_Sin':
            result = S * (i / (Math.pow(1 + i, n) - 1));
            substituted_formula = `${S} * (${i} / ((1 + ${i})^${n} - 1)) = ${result}`;
            break;
        case 'formula_av_R_from_Pin':
            result = P * (i / (1 - Math.pow(1 + i, -n)));
            substituted_formula = `${P} * (${i} / (1 - (1 + ${i})^-${n})) = ${result}`;
            break;
        case 'formula_av_n_from_SRi':
            result = Math.log((S * i / R) + 1) / Math.log(1 + i);
            substituted_formula = `log((${S} * ${i} / ${R}) + 1) / log(1 + ${i}) = ${result}`;
            break;
        case 'formula_av_n_from_PRi':
            result = -Math.log(1 - (P * i / R)) / Math.log(1 + i);
            substituted_formula = `-log(1 - (${P} * ${i} / ${R})) / log(1 + ${i}) = ${result}`;
            break;
            
        // Anualidades Anticipadas
        case 'formula_aa_S_from_Rin':
            result = R * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
            substituted_formula = `${R} * (((1 + ${i})^${n} - 1) / ${i}) * (1 + ${i}) = ${result}`;
            break;
        case 'formula_aa_P_from_Rin':
            result = R * ((1 - Math.pow(1 + i, -n)) / i) * (1 + i);
            substituted_formula = `${R} * ((1 - (1 + ${i})^-${n}) / ${i}) * (1 + ${i}) = ${result}`;
            break;

        // Anualidades Diferidas
        case 'formula_adv_P_from_Rink':
            result = R * ((1 - Math.pow(1 + i, -n)) / i) * Math.pow(1 + i, -k);
            substituted_formula = `${R} * ((1 - (1 + ${i})^-${n}) / ${i}) * (1 + ${i})^-${k} = ${result}`;
            break;

        // Experimental
        case 'formula_experimental':
            if (!generated_formula) {
                 throw new Error(`Fórmula experimental seleccionada pero no se encontró 'generated_formula'.`);
            }
            // Create a scope for evaluation with the resolved inputs
            const scope = { ...inputs };
            result = evaluate(generated_formula, scope);
            
            // Create a readable substitution string
            let temp_sub = generated_formula;
            for(const [key, value] of Object.entries(inputs)){
                 temp_sub = temp_sub.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value));
            }
            substituted_formula = `${temp_sub} = ${result}`;
            break;

        default:
            throw new Error(`Fórmula '${formula_name}' no implementada en el motor de cálculo.`);
    }

    if (isNaN(result) || !isFinite(result)) {
        throw new Error(`El cálculo para '${formula_name}' resultó en un valor no válido. Verifique las entradas.`);
    }

    return { result, substituted_formula };
}