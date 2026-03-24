export type TypeCheckResult = {
  compatible: boolean
  warning?: string
}

export type ValidationResult = {
  fromStepIndex: number
  toStepIndex: number
  result: TypeCheckResult
}

export function checkTypeCompatibility(
  fromType: string,
  toNodeType: string,
): TypeCheckResult {
  const textNodeTypes = new Set(['research', 'analyze', 'generate', 'transform', 'llm'])
  if (fromType === 'image' && textNodeTypes.has(toNodeType)) {
    return {
      compatible: true,
      warning: 'Image output is being passed to a text-based step. The image data may not be usable.',
    }
  }
  return { compatible: true }
}

export function validatePipeline(
  steps: Array<{
    stepIndex: number
    threads: Array<{ nodeType: string; config: { responseType?: string } }>
  }>,
): ValidationResult[] {
  const results: ValidationResult[] = []

  for (let i = 0; i < steps.length - 1; i++) {
    const currentStep = steps[i]
    const nextStep = steps[i + 1]
    const outputType =
      currentStep.threads.length > 0
        ? (currentStep.threads[0].config.responseType ?? 'text')
        : 'text'

    for (const thread of nextStep.threads) {
      const result = checkTypeCompatibility(outputType, thread.nodeType)
      if (result.warning) {
        results.push({
          fromStepIndex: currentStep.stepIndex,
          toStepIndex: nextStep.stepIndex,
          result,
        })
      }
    }
  }

  return results
}
