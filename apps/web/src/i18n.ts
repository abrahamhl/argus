type Locale = 'en' | 'es' | 'nl';
let currentLocale: Locale = 'en';

const dict: Record<Locale, Record<string, string>> = {
  en: {
    "NEW_FIELD_AUDIT": "NEW FIELD AUDIT",
    "NEAR_ME": "NEAR ME (BETA)",
    "CONFIRM_TARGET": "CONFIRM TARGET & INSPECT",
    "CANCEL": "CANCEL",
    "POLICY_TEXT": "I confirm authorization to perform passive intelligence gathering. Physical proximity implies no network authorization.",
    "ERROR_NETWORK": "NETWORK REQUIRED. Live inspection cannot proceed offline.",
    "ABOUT_ARGUS": "ABOUT ARGUS",
    "NO_FINDINGS": "NO CONFIGURED FINDINGS DETECTED",
    "NO_FINDINGS_DESC": "This does not represent a complete security certification. Zero deterministic findings were matched."
  },
  es: {
    "NEW_FIELD_AUDIT": "NUEVA AUDITORÍA",
    "NEAR_ME": "CERCA DE MÍ (BETA)",
    "CONFIRM_TARGET": "CONFIRMAR OBJETIVO E INSPECCIONAR",
    "CANCEL": "CANCELAR",
    "POLICY_TEXT": "Confirmo autorización para recopilar inteligencia pasiva. La proximidad física no implica autorización de red.",
    "ERROR_NETWORK": "SE REQUIERE RED. La inspección no puede continuar sin conexión.",
    "ABOUT_ARGUS": "ACERCA DE ARGUS",
    "NO_FINDINGS": "NO SE DETECTARON HALLAZGOS",
    "NO_FINDINGS_DESC": "Esto no representa una certificación de seguridad completa. Cero hallazgos deterministas fueron detectados."
  },
  nl: {
    "NEW_FIELD_AUDIT": "NIEUWE AUDIT",
    "NEAR_ME": "IN DE BUURT (BETA)",
    "CONFIRM_TARGET": "DOEL BEVESTIGEN & INSPECTEREN",
    "CANCEL": "ANNULEREN",
    "POLICY_TEXT": "Ik bevestig autorisatie om passieve intelligentie te verzamelen. Fysieke nabijheid impliceert geen netwerkautorisatie.",
    "ERROR_NETWORK": "NETWERK VEREIST. Live inspectie kan niet offline worden uitgevoerd.",
    "ABOUT_ARGUS": "OVER ARGUS",
    "NO_FINDINGS": "GEEN BEVINDINGEN GEDETECTEERD",
    "NO_FINDINGS_DESC": "Dit is geen volledige beveiligingscertificering. Er zijn geen deterministische bevindingen gedetecteerd."
  }
};

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function t(key: string): string {
  return dict[currentLocale][key] || key;
}
