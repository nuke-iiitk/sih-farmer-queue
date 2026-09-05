import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import ScreenShell from '../components/ScreenShell';
import SectionHeading from '../components/SectionHeading';
import { Colors, Radius, Spacing } from '../constants/theme';
import { canDownloadPdf, downloadNoticePdf } from '../services/pdfService';
import { useI18n } from '../i18n';

const NOTICES = [
  {
    title: 'Procurement schedule updated for the current cycle',
    date: '29 Aug 2026',
    dept: 'Department of Consumer Affairs',
    tag: 'NEW',
  },
  {
    title: 'Slot booking opened for Kottayam procurement centre',
    date: '28 Aug 2026',
    dept: 'Department of Consumer Affairs',
    tag: null,
  },
  {
    title: 'Guidelines for bringing produce to procurement centres',
    date: '25 Aug 2026',
    dept: 'Department of Consumer Affairs',
    tag: null,
  },
  {
    title: 'Registration portal scheduled maintenance notice',
    date: '20 Aug 2026',
    dept: 'Department of Consumer Affairs',
    tag: null,
  },
  {
    title: 'Revised daily capacity for major procurement centres',
    date: '15 Aug 2026',
    dept: 'Department of Consumer Affairs',
    tag: null,
  },
  {
    title: 'Advisory: Carry booking token (print or mobile) to the centre',
    date: '10 Aug 2026',
    dept: 'Department of Consumer Affairs',
    tag: null,
  },
];

export default function NoticesScreen() {
  const { t, fs } = useI18n();
  const { width } = useWindowDimensions();
  const wide = width >= 768;

  function handlePdf(notice: (typeof NOTICES)[number]) {
    if (!canDownloadPdf()) {
      Alert.alert(t('token.pdfBtn'), t('token.unavailable'));
      return;
    }
    downloadNoticePdf({ title: notice.title, dept: notice.dept, date: notice.date }).then((result) => {
      if (!result.ok) Alert.alert(t('token.pdfBtn'), t('token.downloadError'));
    });
  }

  return (
    <ScreenShell breadcrumbs={[{ label: t('nav.notices') }]}>
      <SectionHeading title={t('notice.title')} subtitle={t('common.gov')} />

      {wide ? (
        <View style={styles.table}>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.thSubject, { fontSize: fs(12) }]}>{t('notice.subject')}</Text>
            <Text style={[styles.th, styles.thDate, { fontSize: fs(12) }]}>{t('notice.date')}</Text>
            <Text style={[styles.th, styles.thPdf, { fontSize: fs(12) }]}>{t('notice.pdf')}</Text>
          </View>

          {NOTICES.map((notice, idx) => (
            <View key={idx} style={styles.row}>
              <View style={styles.subjectCell}>
                {notice.tag ? (
                  <View style={styles.newTag}>
                    <Text style={styles.newTagText}>{notice.tag}</Text>
                  </View>
                ) : null}
                <Text style={[styles.noticeTitle, { fontSize: fs(14) }]}>{notice.title}</Text>
                <Text style={[styles.noticeDept, { fontSize: fs(11) }]}>{notice.dept}</Text>
              </View>
              <Text style={[styles.dateCell, { fontSize: fs(12) }]}>{notice.date}</Text>
              <Pressable
                style={styles.pdfCell}
                accessibilityRole="link"
                accessibilityLabel={`${t('notice.pdf')}: ${notice.title}`}
                onPress={() => handlePdf(notice)}
              >
                <Ionicons name="download" size={16} color={Colors.danger} />
                <Text style={[styles.pdfText, { fontSize: fs(11) }]}>{t('notice.pdf')}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.cardList}>
          {NOTICES.map((notice, idx) => (
            <View key={idx} style={styles.card}>
              {notice.tag ? (
                <View style={styles.cardTag}>
                  <Text style={styles.newTagText}>{notice.tag}</Text>
                </View>
              ) : null}
              <Text style={[styles.noticeTitle, { fontSize: fs(15) }]}>{notice.title}</Text>
              <Text style={[styles.noticeDept, { fontSize: fs(11) }]}>{notice.dept}</Text>
              <View style={styles.cardMeta}>
                <Text style={[styles.dateCell, { fontSize: fs(12) }]}>{notice.date}</Text>
                <Pressable
                  style={styles.pdfCell}
                  accessibilityRole="link"
                  accessibilityLabel={`${t('notice.pdf')}: ${notice.title}`}
                  onPress={() => handlePdf(notice)}
                >
                  <Ionicons name="download" size={14} color={Colors.danger} />
                  <Text style={[styles.pdfText, { fontSize: fs(11) }]}>{t('notice.pdf')}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

            <View style={styles.note}>
        <Ionicons name="download" size={14} color={Colors.info} />
        <Text style={[styles.noteText, { fontSize: fs(12) }]}>
          PDF documents are generated and downloaded locally in your browser — no server required.
        </Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  table: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryDark,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  th: {
    color: Colors.white,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  thSubject: {
    flex: 1,
  },
  thDate: {
    width: 110,
  },
  thPdf: {
    width: 90,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  subjectCell: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  newTag: {
    backgroundColor: Colors.saffron,
    alignSelf: 'flex-start',
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginBottom: 4,
  },
  newTagText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  noticeTitle: {
    color: Colors.info,
    fontWeight: '600',
    lineHeight: 20,
  },
  noticeDept: {
    color: Colors.textMuted,
    marginTop: 2,
  },
  dateCell: {
    width: 110,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  pdfCell: {
    width: 90,
    alignItems: 'center',
    gap: 2,
  },
  pdfText: {
    color: Colors.info,
    fontWeight: '700',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
  },
  noteText: {
    color: Colors.textMuted,
    flex: 1,
  },
  cardList: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  cardTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.saffron,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
