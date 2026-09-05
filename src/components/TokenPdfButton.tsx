import { useState } from 'react';
import { Alert } from 'react-native';

import { APP_ICONS } from './AppIcon';
import { PrimaryButton } from './PrimaryButton';
import type { Booking, ProcurementCentre } from '../data/mockData';
import { useI18n } from '../i18n';
import { canDownloadPdf, downloadTokenPdf } from '../services/pdfService';

type Props = {
  booking: Booking;
  farmer?: {
    id?: string;
    name?: string;
    mobile?: string;
    aadhaar?: string;
  } | null;
  centre?: ProcurementCentre | null;
  variant?: 'primary' | 'secondary' | 'success';
  small?: boolean;
};

/**
 * "Download Token PDF" button. Generates the official procurement-token PDF
 * in the browser and downloads it. On native builds it explains that the
 * download is available in the web version.
 */
export default function TokenPdfButton({ booking, farmer, centre, variant = 'secondary', small = false }: Props) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    if (!canDownloadPdf()) {
      Alert.alert(t('token.pdfBtn'), t('token.unavailable'));
      return;
    }
    setBusy(true);
    try {
      const result = await downloadTokenPdf({
        booking,
        farmer,
        centre,
      });
      if (result.ok) {
        Alert.alert(t('book.confirmed'), t('token.downloaded'));
      } else {
        Alert.alert(t('token.pdfBtn'), t('token.downloadError'));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <PrimaryButton
      label={t('token.pdfBtn')}
      onPress={handleDownload}
      variant={variant}
      small={small}
      loading={busy}
      icon={APP_ICONS.download}
      accessibilityHint={t('token.downloaded')}
    />
  );
}