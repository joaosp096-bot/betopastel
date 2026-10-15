/** Keep server validation messages; give transport failures a useful next step. */
export function accessError(error: unknown) {
  if (error instanceof TypeError || error instanceof SyntaxError) {
    return "Não conseguimos confirmar o acesso. Confira sua conexão e tente novamente.";
  }
  return error instanceof Error && error.message
    ? error.message
    : "Não conseguimos confirmar o acesso. Tente novamente.";
}
