export const getErrorMsgMissingParams = (vars: { [key: string]: unknown }): null | string => {
  const falsyVars = Object.entries(vars)
    .filter(([_, value]) => !value || value === ' ')
    .map(([key]) => key)

  if (falsyVars.length === 0) {
    return null
  }

  return `Invalid or missing params: ${falsyVars.join(', ')}`
}
