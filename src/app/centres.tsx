import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import CentreCard from '../components/CentreCard';
import EmptyState from '../components/EmptyState';
import FormField from '../components/FormField';
import { PrimaryButton, SecondaryButton } from '../components/PrimaryButton';
import ScreenShell from '../components/ScreenShell';
import SearchableSelect from '../components/SearchableSelect';
import SectionHeading from '../components/SectionHeading';
import { Colors, Radius, Spacing } from '../constants/theme';
import { getDistrictOptions, getStateOptions } from '../data/indiaLocations';
import { crops, type CentreStatus } from '../data/mockData';
import { useI18n } from '../i18n';
import { path } from '../navigation';
import { useStore } from '../store/AppStore';

const STATUS_FILTERS: ('All' | CentreStatus)[] = ['All', 'Open', 'Closed'];

/** Values that actually drive the results list (set by the Search button). */
type AppliedFilters = {
  state: string | null;
  district: string | null;
  centreId: string | null;
  query: string;
  crop: string;
  status: string;
};

export default function CentresScreen() {
  const { t, fs } = useI18n();
  const { centres, slots } = useStore();
  const { width } = useWindowDimensions();
  const wide = width >= 768;

  // ---- draft selectors (what the user is picking) ----
  const [draftState, setDraftState] = useState<string | null>(null);
  const [draftDistrict, setDraftDistrict] = useState<string | null>(null);
  const [draftCentre, setDraftCentre] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [cropFilter, setCropFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // ---- applied filters (what the results actually use) ----
  const [applied, setApplied] = useState<AppliedFilters>({
    state: null,
    district: null,
    centreId: null,
    query: '',
    crop: 'All',
    status: 'All',
  });

  // ---- cascading option lists (single source of truth: indiaLocations) ----
  const stateOptions = useMemo(() => getStateOptions(), []);
  const districtOptions = useMemo(
    () => (draftState ? getDistrictOptions(draftState) : []),
    [draftState]
  );

  const centreOptions = useMemo(() => {
    if (!draftState || !draftDistrict) return [];
    return centres
      .filter((centre) => centre.state === draftState && centre.district === draftDistrict)
      .map((centre) => ({ value: centre.id, label: centre.name }));
  }, [centres, draftState, draftDistrict]);

  // ---- cascade reset rules ----
  const handleState = (value: string) => {
    setDraftState(value || null);
    setDraftDistrict(null);
    setDraftCentre(null);
  };

  const handleDistrict = (value: string) => {
    setDraftDistrict(value || null);
    setDraftCentre(null);
  };

  const applySearch = () => {
    setApplied({
      state: draftState,
      district: draftDistrict,
      centreId: draftCentre,
      query: query.trim(),
      crop: cropFilter,
      status: statusFilter,
    });
  };

  const resetAll = () => {
    setDraftState(null);
    setDraftDistrict(null);
    setDraftCentre(null);
    setQuery('');
    setCropFilter('All');
    setStatusFilter('All');
    setApplied({
      state: null,
      district: null,
      centreId: null,
      query: '',
      crop: 'All',
      status: 'All',
    });
  };

  const filtered = useMemo(() => {
    return centres.filter((centre) => {
      if (applied.state && centre.state !== applied.state) return false;
      if (applied.district && centre.district !== applied.district) return false;
      if (applied.centreId && centre.id !== applied.centreId) return false;
      if (applied.crop !== 'All' && !centre.crops.includes(applied.crop)) return false;
      if (applied.status !== 'All') {
        const isOpen =
          centre.status === 'Open' || centre.status === 'Busy' || centre.status === 'Full';
        if (applied.status === 'Open' && !isOpen) return false;
        if (applied.status === 'Closed' && isOpen) return false;
      }
      if (applied.query) {
        const q = applied.query.toLowerCase();
        return (
          centre.name.toLowerCase().includes(q) ||
          centre.district.toLowerCase().includes(q) ||
          centre.state.toLowerCase().includes(q) ||
          centre.address.toLowerCase().includes(q) ||
          centre.crops.some((crop) => crop.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [centres, applied]);

  const slotsOpenToday = useMemo(
    () => slots.filter((s) => !s.closed && s.booked < s.capacity).length,
    [slots]
  );

  const appliedCentre = applied.centreId
    ? centres.find((centre) => centre.id === applied.centreId)
    : undefined;

  const locationSummary = applied.state
    ? `${applied.state}${applied.district ? ` › ${applied.district}` : ''}${
        appliedCentre ? ` › ${appliedCentre.name}` : ''
      }`
    : t('centres.allIndia');

  return (
    <ScreenShell breadcrumbs={[{ label: t('nav.centres') }]}>
      <SectionHeading
        title={t('centres.title')}
        subtitle={t('centres.subtitle')}
        right={
          <View style={styles.liveNotice}>
            <View style={styles.liveDot} />
            <Ionicons name="time" size={14} color={Colors.green} />
            <Text style={[styles.liveText, { fontSize: fs(11) }]}>
              {slotsOpenToday} {t('book.availableSlots')}
            </Text>
          </View>
        }
      />

      {/* Location search panel */}
      <View style={styles.panel}>
        <View style={styles.panelTitleRow}>
          <Ionicons name="location" size={15} color={Colors.primary} />
          <Text style={[styles.panelTitle, { fontSize: fs(14) }]}>{t('centres.findTitle')}</Text>
          <Text style={[styles.panelStep, { fontSize: fs(12) }]}>{t('centres.stepGuide')}</Text>
        </View>

        <View style={[styles.selectRow, !wide && styles.stack]}>
          <SearchableSelect
            label={t('centres.labelState')}
            placeholder={t('centres.selectState')}
            searchPlaceholder={t('centres.searchState')}
            icon="flag"
            value={draftState}
            options={stateOptions}
            onSelect={handleState}
            onClear={() => handleState('')}
            required
          />
          <SearchableSelect
            label={t('centres.labelDistrict')}
            placeholder={t('centres.selectDistrict')}
            searchPlaceholder={t('centres.searchDistrict')}
            icon="location"
            value={draftDistrict}
            options={districtOptions}
            onSelect={handleDistrict}
            onClear={() => handleDistrict('')}
            disabled={!draftState}
            hint={draftState ? undefined : t('centres.pickStateFirst')}
            emptyMessage={t('centres.noDistricts')}
            required
          />
          <SearchableSelect
            label={t('centres.labelCentre')}
            placeholder={t('centres.selectCentre')}
            searchPlaceholder={t('centres.searchCentre')}
            icon="business"
            value={draftCentre}
            options={centreOptions}
            onSelect={(value) => setDraftCentre(value || null)}
            onClear={() => setDraftCentre(null)}
            disabled={!draftDistrict}
            hint={draftDistrict ? undefined : t('centres.pickDistrictFirst')}
            emptyMessage={t('centres.noCentresInDistrict')}
          />
        </View>

        <View style={styles.panelDivider} />

        <View style={styles.searchFieldWrap}>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
            <FormField
              label={t('centres.searchBy')}
              value={query}
              onChangeText={setQuery}
              placeholder={t('centres.searchBy')}
            />
          </View>
        </View>

        <View style={[styles.chipRow, !wide && styles.stack]}>
          <FilterChips
            icon="leaf"
            label={t('centres.filterCrop')}
            options={['All', ...crops]}
            value={cropFilter}
            onChange={setCropFilter}
          />
          <FilterChips
            icon="clipboard"
            label={t('centres.filterStatus')}
            options={STATUS_FILTERS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </View>

        <View style={styles.actionsRow}>
          <View style={styles.actionGrow}>
            <PrimaryButton
              label={t('centres.searchBtn')}
              onPress={applySearch}
              icon="search"
              accessibilityHint={t('centres.searchBtnHint')}
            />
          </View>
          <SecondaryButton
            label={t('centres.reset')}
            onPress={resetAll}
            icon="refresh"
            accessibilityHint={t('centres.resetHint')}
          />
        </View>
      </View>

      {/* Results */}
      <View style={styles.resultsHeader}>
        <View style={styles.resultsTitleRow}>
          <Ionicons name="business" size={15} color={Colors.primaryDark} />
          <Text style={[styles.resultsTitle, { fontSize: fs(16) }]}>{t('centres.results')}</Text>
        </View>
        <View style={styles.resultsMeta}>
          <Ionicons name="location" size={13} color={Colors.textMuted} />
          <Text style={[styles.locationSummary, { fontSize: fs(12) }]}>{locationSummary}</Text>
          <Text style={[styles.resultCount, { fontSize: fs(12) }]}>
            {filtered.length === 1
              ? t('centres.oneResult')
              : t('centres.resultsCount', { n: filtered.length })}
          </Text>
        </View>
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon="search"
          title={t('centres.noResults')}
          message={t('centres.noResultsBody')}
          action={<SecondaryButton label={t('centres.reset')} onPress={resetAll} small />}
        />
      ) : (
        <View style={[styles.grid, !wide && styles.gridStack]}>
          {filtered.map((centre) => (
            <CentreCard
              key={centre.id}
              centre={centre}
              action={
                <PrimaryButton
                  label={t('centres.bookHere')}
                  onPress={() => router.push(path.booking as never)}
                  small
                />
              }
            />
          ))}
        </View>
      )}
    </ScreenShell>
  );
}
  function FilterChips({
  icon,
  label,
  options,
  value,
  onChange,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { t, fs } = useI18n();
  const displayFor = (option: string) => {
    if (option === 'All') return t('centres.all');
    if (option === 'Open') return t('centres.open');
    if (option === 'Closed') return t('centres.closed');
    return option;
  };
  return (
    <View style={styles.chipGroup}>
      <View style={styles.chipGroupLabel}>
        {icon ? <Ionicons name={icon} size={13} color={Colors.textMuted} /> : null}
        <Text style={[styles.chipLabel, { fontSize: fs(12) }]}>{label}</Text>
      </View>
      <View style={styles.chipPillRow}>
        {options.map((option) => {
          const active = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text
                style={[styles.chipText, active && styles.chipTextActive, { fontSize: fs(12) }]}
                numberOfLines={1}
              >
                {displayFor(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
  const styles = StyleSheet.create({
  liveNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.greenLight,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.green,
  },
  liveText: {
    color: Colors.green,
    fontWeight: '800',
  },
  panel: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  panelTitle: {
    color: Colors.primaryDark,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  panelStep: {
    color: Colors.textMuted,
    fontWeight: '600',
    flexShrink: 1,
    marginLeft: 'auto',
    textAlign: 'right',
  },
  selectRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  stack: {
    flexDirection: 'column',
    width: '100%',
  },
  panelDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  searchFieldWrap: {
    width: '100%',
  },
  searchWrap: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 28,
    zIndex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    alignItems: 'flex-start',
    marginTop: Spacing.sm,
  },
  chipGroup: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  chipGroupLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  chipLabel: {
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  chipPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  chipText: {
    color: Colors.text,
    fontWeight: '700',
  },
  chipTextActive: {
    color: Colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  actionGrow: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultsTitle: {
    fontWeight: '800',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  resultsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  locationSummary: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  resultCount: {
    color: Colors.textMuted,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gridStack: {
    flexDirection: 'column',
  },
});