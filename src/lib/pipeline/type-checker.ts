export type TypeCheckResult = {
  compatible: boolean
  warning?: string
}

export type ValidationResult = {
  fromStepIndex: number
  toStepIndex: number
  result: TypeCheckResult
}

/**
 * Check type compatibility between an output type and a receiving node type.
 *
 * Rules:
 * - text -> text: compatible
 * - text -> image: compatible (prompts can drive image generation)
 * - image -> text-only LLM: compatible with warning
 * - mixed -> text: compatible
 * - Everything else: compatible by default
 */
export function checkTypeCompatibility(
  fromType: string,
  toNodeType: string,
): TypeCheckResult {
  // image -> text-based node (no multimodal input)
  const textNodeTypes = new Set(['research', 'analyze', 'generate', 'transform', 'llm'])
  if (fromType === 'image' && textNodeTypes.has(toNodeType)) {
    return {
      compatible: true,
      warning: 'Image output is being passed to a text-based step. The image data may not be usable.',
    }
  }

  // text -> text: ok
  // text -> image: ok (prompt drives image generation)
  // mixed -> text: ok
  // Everything else: compatible
  return { compatible: true }
}

/**
 * Validate all step transitions in a pipeline.
 * Checks each pair of consecutive steps for type compatibility.
 */
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

    // Determine the output type of the current step
    // Use the first thread's responseType, or default to 'text'
    const outputType =
      currentStep.threads.length > 0
        ? (currentStep.threads[0].config.responseType ?? 'text')
        : 'text'

    // Check against each thread in the next step
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
