import { Colors } from '../constants/theme';

export type Tone = 'success' | 'info' | 'warning' | 'error' | 'neutral';

export type AlertBannerProps = {
  tone?: Tone;
  title?: string;
  message: string;
  icon?: string;
};

export const TONES: Record<Tone, { bg: string; fg: string; border: string; icon: string }> = {
  success: { bg: Colors.greenLight, fg: Colors.green, border: Colors.green, icon: 'checkmark-circle' },
  info: { bg: Colors.infoLight, fg: Colors.info, border: Colors.info, icon: 'information-circle' },
  warning: { bg: Colors.warningLight, fg: Colors.warning, border: Colors.warning, icon: 'warning' },
  error: { bg: Colors.dangerLight, fg: Colors.danger, border: Colors.danger, icon: 'alert-circle' },
  neutral: { bg: Colors.surfaceAlt, fg: Colors.textSecondary, border: Colors.border, icon: 'information-circle' },
};

/** Bootstrap `alert-*` class per tone (web only). */
export const BOOTSTRAP_TONE: Record<Tone, string> = {
  success: 'alert alert-success',
  info: 'alert alert-primary',
  warning: 'alert alert-warning',
  error: 'alert alert-danger',
  neutral: 'alert alert-secondary',
};