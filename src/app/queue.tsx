import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import Button from '../components/Button';
import InfoCard, { MetaRow } from '../components/InfoCard';
import ScreenShell from '../components/ScreenShell';
import SectionHeading from '../components/SectionHeading';
import StatusBadge from '../components/StatusBadge';
import { Colors, Radius, Spacing } from '../constants/theme';
import {
  ALL_PROJECTS,
  MOCK_PARCELS,
  type LandProject,
  type LandParcel,
  type AcquisitionStage,
} from '../data/landAcquisitionData';
import { useI18n } from '../i18n';
import { path } from '../navigation';
import { APP_ICONS, AppIcon } from '../components/AppIcon';

const STAGES: ('All' | AcquisitionStage)[] = [
  'All',
  'Proposal',
  'Scrutiny',
  'Approval',
  'Notification',
  'Award',
  'Compensation',
  'Possession',
  'R&R',
  'Closure',
];

export default function NationalGISMapScreen() {
  const { t, fs } = useI18n();
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  // Filters: State | District | Project | Acquisition Stage | Parcel Status
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedStage, setSelectedStage] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [activeProject, setActiveProject] = useState<LandProject>(ALL_PROJECTS[0]);
  const [activeParcel, setActiveParcel] = useState<LandParcel>(MOCK_PARCELS[0]);
  const [mapLayer, setMapLayer] = useState<'corridors' | 'parcels' | 'satellite'>('corridors');

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return ALL_PROJECTS.filter((p) => {
      if (selectedState !== 'All' && p.state !== selectedState) return false;
      if (selectedStage !== 'All' && p.currentStage !== selectedStage) return false;
      if (selectedStatus !== 'All' && p.status !== selectedStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.district.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedState, selectedStage, selectedStatus, searchQuery]);

  // Parcels belonging to the active project
  const projectParcels = useMemo(() => {
    return MOCK_PARCELS.filter((p) => p.projectId === activeProject.id);
  }, [activeProject]);

  return (
    <ScreenShell wide breadcrumbs={[{ label: 'Home', href: path.home }, { label: 'National GIS Map' }]}>
      <SectionHeading
        title="National Land Acquisition GIS Map & Spatial Cadastral Viewer"
        subtitle="Real-time multi-layer spatial monitoring: Corridors, acquisition zones, parcel boundaries and land possession."
      />

      {/* 3-Column Layout: Filters | Interactive GIS Map | Information Panel */}
      <View style={[styles.mainLayout, wide && styles.mainLayoutRow]}>
        {/* Left Column: Spatial Filters */}
        <View style={[styles.filtersCol, !wide && styles.colFull]}>
          <View style={styles.filterCard}>
            <Text style={[styles.panelHeader, { fontSize: fs(14) }]}>Spatial & Stage Filters</Text>

            {/* Quick Search */}
            <View style={styles.searchBox}>
              <AppIcon name={APP_ICONS.search} size={15} color={Colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { fontSize: fs(12) }]}
                placeholder="Search corridor or district..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* State Filter */}
            <Text style={[styles.filterLabel, { fontSize: fs(11) }]}>State / UT:</Text>
            <View style={styles.chipRow}>
              {['All', 'Kerala', 'Maharashtra', 'Rajasthan', 'Telangana', 'Karnataka', 'Punjab'].map((st) => (
                <Pressable
                  key={st}
                  onPress={() => setSelectedState(st)}
                  style={[styles.chip, selectedState === st && styles.chipActive]}
                >
                  <Text style={[styles.chipText, selectedState === st && styles.chipTextActive, { fontSize: fs(11) }]}>
                    {st}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Acquisition Stage Filter */}
            <Text style={[styles.filterLabel, { fontSize: fs(11) }]}>Acquisition Stage:</Text>
            <View style={styles.chipRow}>
              {['All', 'Notification', 'Award', 'Compensation', 'Possession', 'R&R'].map((stg) => (
                <Pressable
                  key={stg}
                  onPress={() => setSelectedStage(stg)}
                  style={[styles.chip, selectedStage === stg && styles.chipActive]}
                >
                  <Text style={[styles.chipText, selectedStage === stg && styles.chipTextActive, { fontSize: fs(11) }]}>
                    {stg}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Project Status Filter */}
            <Text style={[styles.filterLabel, { fontSize: fs(11) }]}>Project Status:</Text>
            <View style={styles.chipRow}>
              {['All', 'Active', 'Delayed', 'Completed'].map((pst) => (
                <Pressable
                  key={pst}
                  onPress={() => setSelectedStatus(pst)}
                  style={[styles.chip, selectedStatus === pst && styles.chipActive]}
                >
                  <Text style={[styles.chipText, selectedStatus === pst && styles.chipTextActive, { fontSize: fs(11) }]}>
                    {pst}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Project Quick Picker */}
            <Text style={[styles.filterLabel, { fontSize: fs(11) }]}>Select Project Corridor:</Text>
            <View style={styles.projectList}>
              {filteredProjects.map((p) => {
                const isSelected = activeProject.id === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => {
                      setActiveProject(p);
                      const matched = MOCK_PARCELS.find((pcl) => pcl.projectId === p.id);
                      if (matched) setActiveParcel(matched);
                    }}
                    style={[styles.projPickItem, isSelected && styles.projPickItemActive]}
                  >
                    <View style={styles.projPickTop}>
                      <Text style={[styles.projPickName, isSelected && styles.projPickNameActive, { fontSize: fs(12) }]} numberOfLines={1}>
                        {p.code}: {p.name}
                      </Text>
                      <StatusBadge
                        status={p.status === 'Delayed' ? 'Cancelled' : p.status === 'Completed' ? 'Completed' : 'Upcoming'}
                        translatedLabel={p.status}
                        small
                      />
                    </View>
                    <Text style={[styles.projPickMeta, isSelected && styles.projPickMetaActive, { fontSize: fs(10) }]}>
                      {p.district}, {p.state} · {p.landAcquiredHa}/{p.landProposedHa} ha
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Center Column: GIS Map Visualizer Container */}
        <View style={[styles.mapCol, !wide && styles.colFull]}>
          <View style={styles.mapContainer}>
            {/* Map Layer Toolbar */}
            <View style={styles.mapToolbar}>
              <View style={styles.toolbarLeft}>
                <AppIcon name={APP_ICONS.map} size={16} color={Colors.white} />
                <Text style={[styles.toolbarTitle, { fontSize: fs(12) }]}>
                  NATIONAL SPATIAL CADASTRE · BHARAT-GIS v4.2
                </Text>
              </View>
              <View style={styles.layerTabs}>
                <Pressable
                  onPress={() => setMapLayer('corridors')}
                  style={[styles.layerTab, mapLayer === 'corridors' && styles.layerTabActive]}
                >
                  <Text style={[styles.layerTabText, mapLayer === 'corridors' && styles.layerTabTextActive, { fontSize: fs(11) }]}>
                    Corridors
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setMapLayer('parcels')}
                  style={[styles.layerTab, mapLayer === 'parcels' && styles.layerTabActive]}
                >
                  <Text style={[styles.layerTabText, mapLayer === 'parcels' && styles.layerTabTextActive, { fontSize: fs(11) }]}>
                    Cadastral Parcels
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setMapLayer('satellite')}
                  style={[styles.layerTab, mapLayer === 'satellite' && styles.layerTabActive]}
                >
                  <Text style={[styles.layerTabText, mapLayer === 'satellite' && styles.layerTabTextActive, { fontSize: fs(11) }]}>
                    Satellite Imagery
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Simulated GIS Canvas (Authentic vector GIS map appearance) */}
            <View style={styles.gisCanvas}>
              {/* GIS Grid Coordinates Overlay */}
              <View style={styles.gisCoordinates}>
                {/*
                  The family is applied inline rather than through the
                  StyleSheet: a class rule from here loses to the site-wide
                  typography rule inlined in app/+html.tsx, which deliberately
                  outranks RN Web's own component classes. Inline styles win
                  that fight, keeping the readout monospaced as intended.
                */}
                <Text style={[styles.coordText, { fontFamily: 'monospace' }]}>
                  LAT: {activeProject.lat.toFixed(4)}° N | LNG: {activeProject.lng.toFixed(4)}° E | WGS84 CRS EPSG:4326 | SCALE 1:12,500
                </Text>
              </View>

              {/* Geographic Contour Lines / Visual Representation */}
              <View style={styles.gisMapBackground}>
                {/* SVG/Vector-style Corridor Ribbon */}
                <View style={styles.corridorRibbon}>
                  <View style={styles.corridorLine} />
                  <View style={styles.corridorBufferZone} />
                </View>

                {/* Simulated Cadastral Land Parcel Polygons */}
                <View style={styles.parcelPolygonsRow}>
                  {projectParcels.map((pcl, idx) => {
                    const isParcelActive = activeParcel.id === pcl.id;
                    return (
                      <Pressable
                        key={pcl.id}
                        onPress={() => setActiveParcel(pcl)}
                        style={[
                          styles.parcelPolygon,
                          isParcelActive && styles.parcelPolygonActive,
                          pcl.possessionStatus === 'Possession Taken' ? styles.parcelPossessed : styles.parcelPending,
                        ]}
                      >
                        <Text style={[styles.polygonLabel, { fontSize: fs(10) }]}>
                          Khasra #{pcl.surveyNumber}
                        </Text>
                        <Text style={[styles.polygonArea, { fontSize: fs(9) }]}>
                          {pcl.areaHa} ha · {pcl.possessionStatus === 'Possession Taken' ? 'Possessed' : 'In Progress'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Spatial Project Marker Pin (Click opens project panel as requested) */}
                <View style={styles.projectPinWrap}>
                  <View style={styles.projectPinCircle}>
                    <AppIcon name={APP_ICONS.location} size={22} color={Colors.white} />
                  </View>
                  <View style={styles.projectPinCard}>
                    <Text style={[styles.pinTitle, { fontSize: fs(11) }]}>
                      {activeProject.code} ({activeProject.sector})
                    </Text>
                    <Text style={[styles.pinDesc, { fontSize: fs(10) }]}>
                      {activeProject.landAcquiredHa} ha Acquired ({activeProject.possessionPercent}%)
                    </Text>
                  </View>
                </View>

                {/* Map Legend (Corridor, Acquired, In-Progress, Delayed) */}
                <View style={styles.gisLegend}>
                  <Text style={[styles.legendHeader, { fontSize: fs(10) }]}>LEGEND</Text>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.green }]} />
                    <Text style={[styles.legendText, { fontSize: fs(9) }]}>Possession Taken</Text>
                  </View>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.saffron }]} />
                    <Text style={[styles.legendText, { fontSize: fs(9) }]}>Notice / Valuation</Text>
                  </View>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
                    <Text style={[styles.legendText, { fontSize: fs(9) }]}>Delayed / Section 19 Lapse Alert</Text>
                  </View>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                    <Text style={[styles.legendText, { fontSize: fs(9) }]}>Project Alignment Corridor</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Right Column: Selected Parcel & Corridor Information Panel (Requirement 9) */}
        <View style={[styles.infoCol, !wide && styles.colFull]}>
          {/* Selected Project Box (Prompt Item 5: NH-XXX Expansion, State, District, Proposed, Acquired, Compensation, Possession, R&R) */}
          <View style={styles.projectOverviewBox}>
            <View style={styles.infoBoxHeader}>
              <Text style={[styles.infoBoxTitle, { fontSize: fs(13) }]}>Selected Project Corridor</Text>
              <StatusBadge
                status={activeProject.status === 'Delayed' ? 'Cancelled' : 'Completed'}
                translatedLabel={activeProject.status}
                small
              />
            </View>

            <View style={styles.projectInfoTable}>
              <MetaRow label="Project:" value={activeProject.name} />
              <MetaRow label="State:" value={activeProject.state} />
              <MetaRow label="District:" value={activeProject.district} />
              <MetaRow label="Land Proposed:" value={`${activeProject.landProposedHa} ha`} />
              <MetaRow label="Land Acquired:" value={`${activeProject.landAcquiredHa} ha`} />
              <MetaRow label="Compensation:" value={`₹${activeProject.compensationBudgetCr} Cr`} />
              <MetaRow label="Possession:" value={`${activeProject.possessionPercent}%`} />
              <MetaRow label="R&R:" value={`${activeProject.rrPercent}%`} />
            </View>
          </View>

          {/* Selected Parcel Panel (Prompt Item 9: Selected Parcel: Parcel ID, Survey Number, Area, Project, Status, Compensation, Possession, R&R) */}
          <View style={styles.parcelInspectorBox}>
            <View style={styles.infoBoxHeader}>
              <Text style={[styles.infoBoxTitle, { fontSize: fs(13) }]}>Selected Land Parcel</Text>
              <StatusBadge
                status={activeParcel.possessionStatus === 'Possession Taken' ? 'Completed' : 'Waiting'}
                translatedLabel={activeParcel.possessionStatus}
                small
              />
            </View>

            <View style={styles.projectInfoTable}>
              <MetaRow label="Parcel ID:" value={activeParcel.id} />
              <MetaRow label="Survey Number:" value={activeParcel.surveyNumber} />
              <MetaRow label="Area:" value={`${activeParcel.areaHa} ha`} />
              <MetaRow label="Project:" value={activeParcel.projectName} />
              <MetaRow label="Status:" value={activeParcel.acquisitionStatus} />
              <MetaRow label="Compensation:" value={`₹${activeParcel.compensationAmountLakhs} Lakhs (${activeParcel.compensationStatus})`} />
              <MetaRow label="Possession:" value={activeParcel.possessionStatus} />
              <MetaRow label="R&R:" value={activeParcel.rrStatus} />
            </View>

            <View style={styles.actionWrap}>
              <Button
                variant="primary"
                label="View Title & Cadastral Award"
                onPress={() => router.push(path.awards as never)}
                small
              />
            </View>
          </View>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  mainLayout: {
    gap: Spacing.md,
  },
  mainLayoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  filtersCol: {
    width: 290,
  },
  mapCol: {
    flex: 1,
    minWidth: 320,
  },
  infoCol: {
    width: 320,
    gap: Spacing.md,
  },
  colFull: {
    width: '100%',
  },
  filterCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    gap: 8,
  },
  panelHeader: {
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    gap: 6,
    minHeight: 36,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
  },
  filterLabel: {
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  chipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  chipText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.white,
  },
  projectList: {
    gap: 6,
    marginTop: 4,
  },
  projPickItem: {
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    backgroundColor: Colors.white,
  },
  projPickItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  projPickTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  projPickName: {
    fontWeight: '700',
    color: Colors.primaryDark,
    flex: 1,
  },
  projPickNameActive: {
    fontWeight: '800',
  },
  projPickMeta: {
    color: Colors.textMuted,
    marginTop: 2,
  },
  projPickMetaActive: {
    color: Colors.primaryDark,
  },
  mapContainer: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  mapToolbar: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolbarTitle: {
    color: Colors.white,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  layerTabs: {
    flexDirection: 'row',
    gap: 4,
  },
  layerTab: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  layerTabActive: {
    backgroundColor: Colors.white,
  },
  layerTabText: {
    color: Colors.textOnDark,
    fontWeight: '700',
  },
  layerTabTextActive: {
    color: Colors.primaryDark,
  },
  gisCanvas: {
    minHeight: 520,
    backgroundColor: '#0a1d37',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gisCoordinates: {
    position: 'absolute',
    top: 8,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    zIndex: 10,
  },
  coordText: {
    color: '#00ffcc',
    fontSize: 9,
    // fontFamily is set inline at the use site so it survives the portal-wide
    // typography rule — see the comment in the GIS canvas below.
    fontWeight: '700',
  },
  gisMapBackground: {
    width: '100%',
    height: '100%',
    minHeight: 520,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0e2340',
  },
  corridorRibbon: {
    position: 'absolute',
    width: '90%',
    height: 48,
    backgroundColor: 'rgba(13, 71, 161, 0.45)',
    borderColor: '#38bdf8',
    borderWidth: 1.5,
    borderRadius: 4,
    transform: [{ rotate: '-8deg' }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  corridorLine: {
    width: '100%',
    height: 3,
    backgroundColor: '#e65100',
  },
  corridorBufferZone: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  parcelPolygonsRow: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 12,
    top: 140,
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 5,
  },
  parcelPolygon: {
    width: 140,
    height: 76,
    borderRadius: 4,
    borderWidth: 2,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  parcelPolygonActive: {
    borderColor: '#ffffff',
    borderWidth: 3,
    shadowColor: '#ffffff',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  parcelPossessed: {
    backgroundColor: 'rgba(22, 130, 59, 0.75)',
    borderColor: '#4ade80',
  },
  parcelPending: {
    backgroundColor: 'rgba(230, 81, 0, 0.75)',
    borderColor: '#fbbf24',
  },
  polygonLabel: {
    color: Colors.white,
    fontWeight: '800',
    textAlign: 'center',
  },
  polygonArea: {
    color: '#e2e8f0',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  projectPinWrap: {
    position: 'absolute',
    top: 260,
    left: '42%',
    alignItems: 'center',
    zIndex: 10,
  },
  projectPinCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  projectPinCard: {
    marginTop: 6,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  pinTitle: {
    color: Colors.white,
    fontWeight: '800',
  },
  pinDesc: {
    color: '#93c5fd',
    fontWeight: '600',
  },
  gisLegend: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(10, 20, 40, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 4,
    gap: 4,
    zIndex: 10,
  },
  legendHeader: {
    color: Colors.textOnDark,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: Colors.white,
    fontWeight: '600',
  },
  projectOverviewBox: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  parcelInspectorBox: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryDark,
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  infoBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoBoxTitle: {
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  projectInfoTable: {
    gap: 2,
  },
  actionWrap: {
    marginTop: Spacing.md,
  },
});
