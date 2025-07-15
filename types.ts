
export interface InitialData {
  [key: string]: number | string;
}

export interface CalculationStep {
  step_name: string;
  target_variable: string;
  formula_name: string;
  inputs: { [key: string]: number | string };
  generated_formula?: string; // For experimental mode
}

export interface CalculationPlan {
  interpretation: string;
  initial_data: InitialData;
  final_target_variable: string;
  calculation_steps: CalculationStep[];
}

export interface ExecutedStep extends CalculationStep {
  result: number | string;
  substituted_formula: string;
}

export type Mode = 'preciso' | 'experimental';

export type Provider = 'google' | 'kimi' | 'mistral' | 'todas';

export interface AppResult {
  provider: Provider;
  plan: CalculationPlan | null;
  executedSteps: ExecutedStep[] | null;
  error: string | null;
}
