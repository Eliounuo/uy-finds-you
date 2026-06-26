const FLAG = "yurta_onboarding_done";

export type OnboardingRole = "tenant" | "landlord";

export function isOnboardingDone(): boolean {
  try {
    return !!localStorage.getItem(FLAG);
  } catch {
    return true;
  }
}

export function markOnboardingDone() {
  try {
    localStorage.setItem(FLAG, "1");
  } catch {
    /* ignore */
  }
}

export function shouldShowOnboarding(_role: OnboardingRole): boolean {
  return !isOnboardingDone();
}
