import { Image } from 'expo-image';
import type { Href } from 'expo-router';
import { router, usePathname } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { Colors, Fonts, Spacing } from '../constants/theme';
import { MEGA_SECTIONS, type MegaSection } from '../data/megaMenu';
import { useI18n, type LanguageCode, type TextSizeLevel } from '../i18n';
import { path } from '../navigation';
import BootstrapIcon from './BootstrapIcon';
import Button from './Button';
import { MegaMenuPanel, MegaNavAccordion, type DomHandle } from './MegaMenu';

/* ── Header navigation ─────────────────────────────────────────────────────
   The bar carries eight items: Home plus the seven sections defined in
   `src/data/megaMenu.ts`. Clicking a section opens its full-width mega panel;
   the structure is data, so adding a page means editing that file alone. */

/**
 * Bilingual portal title — authentic gov-portal style shows the portal name in
 * two languages (English + Hindi devanagari). The main line is the localized
 * `common.appName`; the line underneath is always the *other* script so the
 * header reads like a real Indian government website.
 */
const HINDI_APP_NAME = 'राष्ट्रीय भूमि अधिग्रहण एवं प्रबंधन प्रणाली';
const ENGLISH_APP_NAME = 'National Land Acquisition & Management System';


const LANG_OPTIONS: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ml', label: 'മലയാളം' },
];

const TEXT_SIZES: { level: TextSizeLevel; label: string }[] = [
  { level: 'small', label: 'A-' },
  { level: 'normal', label: 'A' },
  { level: 'large', label: 'A+' },
];

/* ── Web-only DOM helpers ──────────────────────────────────────────────────
   React Native Web renders every View/Pressable as a real element, so the
   header can use `contains`/`focus` for click-outside, focus-out and
   focus-restore behaviour. Kept at module scope so the dismissal effect below
   has no unstable dependencies. */
type Focusable = { focus?: () => void };

const nodeHandle = (value: unknown) => value as DomHandle | null | undefined;

/** True when `target` sits inside the open section's trigger or its panel. */
function isInsideOpenPanel(
  triggerRefs: React.RefObject<Record<string, unknown>>,
  panelRef: React.RefObject<View | null>,
  key: string | null,
  target: Node | null
) {
  if (!key || !target) return false;
  const owners = [nodeHandle(triggerRefs.current[key]), nodeHandle(panelRef.current)];
  return owners.some((node) => node?.contains?.(target));
}

/** Hand focus back to the header item that owns the panel. */
function focusSectionTrigger(
  triggerRefs: React.RefObject<Record<string, unknown>>,
  key: string | null
) {
  if (!key) return;
  const wrapper = nodeHandle(triggerRefs.current[key]);
  const control = wrapper?.querySelectorAll?.('button, a')?.[0] as Focusable | undefined;
  control?.focus?.();
}

export default function GovernmentHeader() {
  const { t, fs, setLanguage, language, textSize, setTextSize } = useI18n();
  const pathname = usePathname();
  const { width, height } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  /** Key of the open desktop mega section (null = all closed). */
  const [openSection, setOpenSection] = useState<string | null>(null);
  /** Key of the expanded section in the mobile drawer accordion (null = none). */
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null);
  /** Trigger wrappers per section + the open panel — web click/focus checks. */
  const triggerRefs = useRef<Record<string, unknown>>({});
  const panelRef = useRef<View | null>(null);
  const compact = width < 768;
  const phone = width < 600;
  const openPanel = openSection
    ? MEGA_SECTIONS.find((section) => section.key === openSection)
    : undefined;
  /** Tablet keeps two columns (sub-categories + pages); the contextual column
      needs the full desktop width. */
  const showAside = width >= 1024;

  const navigate = (href: Href) => {
    setMenuOpen(false);
    setOpenSection(null);
    setOpenMobileSection(null);
    router.push(href as never);
  };

  /**
   * True when `href` is the current route (or a parent of it). The home route
   * '/' matches exactly — a plain startsWith('/') would flag every page.
   */
  const activeHref = (href: Href) => {
    const hrefStr = typeof href === 'string' ? href : String(href);
    if (hrefStr === '/') return pathname === '/';
    return pathname === hrefStr || pathname.startsWith(`${hrefStr}/`);
  };

  /**
   * Clicking a header item opens its panel, switches to another section's panel,
   * or closes the open one. Hover alone never opens anything.
   */
  const toggleSection = (key: string) => {
    setOpenSection((current) => (current === key ? null : key));
  };

  // A panel never outlives its context: when the route or the viewport changes,
  // close it during render (React's guarded state-adjustment pattern) instead of
  // cascading through an effect.
  const [navContext, setNavContext] = useState({ pathname, width });
  if (navContext.pathname !== pathname || navContext.width !== width) {
    setNavContext({ pathname, width });
    if (openSection) setOpenSection(null);
  }

  // Web dismissal + keyboard behaviour. Clicking is the only way in (hovering a
  // header item never opens a panel): Escape closes and hands focus back to the
  // trigger, arrow keys walk the panel's links, and a click or a focus move
  // anywhere outside the trigger + panel retires the open section.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const isInside = (target: Node | null) =>
      isInsideOpenPanel(triggerRefs, panelRef, openSection, target);

    const onKeyDown = (event: KeyboardEvent) => {
      if (!openSection) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        focusSectionTrigger(triggerRefs, openSection);
        setOpenSection(null);
        return;
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const panel = nodeHandle(panelRef.current);
      const links = Array.from(panel?.querySelectorAll?.('a[href], button') ?? []);
      if (!links.length) return;
      event.preventDefault();
      const active = document.activeElement as Focusable | null;
      const index = links.findIndex((item) => item === active);
      // ArrowDown from the trigger enters the panel; from a link it steps on.
      const step = event.key === 'ArrowDown' ? 1 : -1;
      const next =
        index < 0
          ? step > 0
            ? 0
            : links.length - 1
          : Math.min(Math.max(index + step, 0), links.length - 1);
      links[next]?.focus?.();
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (isInside(event.target as Node | null)) return;
      setOpenSection(null);
    };

    const onFocusIn = (event: FocusEvent) => {
      if (isInside(event.target as Node | null)) return;
      setOpenSection(null);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onDocumentClick, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onDocumentClick, true);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [openSection]);

  const skipToContent = () => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById('main-content');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const submitSearch = () => {
    router.push(path.centres as never);
  };

  const langLabel = useMemo(
    () => LANG_OPTIONS.find((l) => l.code === language)?.label ?? 'English',
    [language]
  );

  /** Segmented English/हिन्दी/മലയാളം switch. `tight` = slim paddings for the phone nav bar. */
  const renderLangRow = (tight: boolean) => (
    <View style={[styles.langRow, tight && styles.langRowTight]}>
      {LANG_OPTIONS.map((lang) => (
        <Pressable
          key={lang.code}
          onPress={() => setLanguage(lang.code)}
          style={[styles.langBtn, tight && styles.langBtnTight, language === lang.code && styles.langBtnActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: language === lang.code }}
          accessibilityLabel={lang.label}
        >
          <Text
            style={[
              styles.langBtnText,
              { fontSize: fs(11) },
              language === lang.code && styles.langBtnTextActive,
            ]}
          >
            {lang.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  /**
   * One header item: a disclosure button that owns a mega panel. It reads as
   * active while one of its pages is the current route, or while its panel is
   * open — the existing bar styling, unchanged.
   */
  const renderSectionTrigger = (section: MegaSection) => {
    const open = openSection === section.key;
    const on =
      open || section.rails.some((rail) => rail.links.some((link) => activeHref(link.href)));
    // Web fills the trigger navy when active/open (white caret); native tints
    // it light blue, so keep the caret dark there for contrast.
    const caretColor = Platform.OS === 'web' && on ? Colors.white : Colors.primaryDark;
    return (
      <View
        key={section.key}
        ref={(element) => {
          triggerRefs.current[section.key] = element;
        }}
        style={[styles.navGroup, on && styles.navGroupOpen]}
      >
        <Button
          label={section.label}
          variant="outline-primary"
          small
          active={on}
          expanded={open}
          haspopup
          className="fpp-nav-btn"
          accessibilityLabel={`${section.label} menu`}
          after={<BootstrapIcon name="bi-chevron-down" size={13} color={caretColor} />}
          onPress={() => toggleSection(section.key)}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, openSection ? styles.containerOpen : null]}>
      {/* Utility strip — accessibility controls (desktop/tablet only; on phones
          this row cramped, overlapped and added pure noise). */}
      {!compact ? (
        <View style={styles.utilityBar}>
          <View style={styles.utilityLeft}>
            <Pressable onPress={skipToContent} accessibilityRole="link">
              <Text style={[styles.utilityLink, { fontSize: fs(11) }]}>{t('top.skip')} |</Text>
            </Pressable>
            <Text style={[styles.utilityLink, { fontSize: fs(11) }]}>{t('top.screenReader')} |</Text>
          </View>
          <View style={styles.utilityRight}>
            <Text style={[styles.utilityMuted, { fontSize: fs(11) }]}>{t('top.textSize')}:</Text>
            {TEXT_SIZES.map((option) => (
              <Pressable
                key={option.level}
                onPress={() => setTextSize(option.level)}
                accessibilityRole="button"
                accessibilityState={{ selected: textSize === option.level }}
                style={[styles.sizeBtn, textSize === option.level && styles.sizeBtnActive]}
              >
                <Text
                  style={[
                    styles.sizeBtnText,
                    { fontSize: option.level === 'small' ? 9 : option.level === 'large' ? 12 : 10 },
                    textSize === option.level && styles.sizeBtnTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
            <Text style={[styles.utilityMuted, { fontSize: fs(11) }]}>| {t('top.language')}: {langLabel}</Text>
          </View>
        </View>
      ) : null}

      {/* Government identity strip — one slim line on compact screens */}
      <View style={[styles.topBar, compact && styles.topBarCompact]}>
        <Text style={[styles.govText, { fontSize: compact ? fs(11) : fs(13) }]}>
          भारत सरकार / Government of India
        </Text>
        {!compact ? (
          <Text style={[styles.deptText, { fontSize: fs(11) }]}>{t('common.gov')}</Text>
        ) : null}
      </View>

      {/* Brand bar with National Emblem (+ Flag & language switch on desktop) */}
      <View style={[styles.brandBar, compact && styles.brandBarCompact, phone && styles.brandBarPhone]}>
        <View style={[styles.brandLeft, compact && styles.brandLeftCompact]}>
          <Pressable
            onPress={() => navigate(path.home)}
            accessibilityRole="link"
            accessibilityLabel="State Emblem of India — back to home"
            style={styles.emblemBtn}
          >
            <Image
              source={require('../assets/emblem.svg')}
              style={[styles.emblem, phone && styles.emblemPhone]}
              contentFit="contain"
              accessibilityLabel="State Emblem of India"
            />
          </Pressable>
          {!compact ? <View style={styles.brandDivider} /> : null}
          <View style={[styles.brandText, compact && styles.brandTextCompact]}>
            <Text style={[styles.portalName, { fontSize: fs(phone ? 15 : compact ? 16 : 19) }]} numberOfLines={1}>
              {t('common.appName')}
            </Text>
            {!phone ? (
              <Text style={[styles.portalNameLocal, { fontSize: fs(compact ? 11 : 12) }]} numberOfLines={1}>
                {language === 'hi' ? ENGLISH_APP_NAME : HINDI_APP_NAME}
              </Text>
            ) : null}
            {!compact ? (
              <Text style={[styles.portalTagline, { fontSize: fs(11) }]}>{t('common.tagline')}</Text>
            ) : null}
          </View>
        </View>

        {/* Desktop: flag + language switch. Compact: quick search + login. */}
        {!compact ? (
          <View style={styles.brandRight}>
            <Image
              source={require('../assets/flag.svg')}
              style={styles.flag}
              contentFit="contain"
              accessibilityLabel="Flag of India"
            />
            {renderLangRow(false)}
          </View>
        ) : (
          <View style={styles.brandActions}>
            <Button
              variant="outline-primary"
              iconOnly
              accessibilityLabel={t('header.search')}
              accessibilityHint={t('header.searchHint')}
              leading={<BootstrapIcon name="bi-search" size={15} color={Colors.primaryDark} />}
              onPress={() => navigate(path.centres)}
            />
            <Button
              variant="primary"
              small
              label={t('nav.login')}
              accessibilityHint={t('header.loginHint')}
              leading={<BootstrapIcon name="bi-box-arrow-in-right" size={12} color={Colors.white} />}
              onPress={() => navigate(path.login)}
            />
          </View>
        )}
      </View>

      {/* Native-only tap-catcher: dismisses an open panel when tapping the
          brand/utility area (on web the document listener does this without
          ever swallowing the user's click). */}
      {openSection && Platform.OS !== 'web' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={() => setOpenSection(null)}
          style={styles.dismissLayer}
        />
      ) : null}

      {/* Navigation row: hamburger (mobile) or links + search + login (desktop) */}
      <View style={styles.navRow} accessibilityRole="header" accessibilityLabel={t('nav.menu')}>
        {compact ? (
          <>
            <Button
              variant="outline-secondary"
              label={menuOpen ? t('common.close') : t('nav.menu')}
              accessibilityLabel={menuOpen ? t('common.close') : t('nav.menu')}
              expanded={menuOpen}
              haspopup
              leading={
                <BootstrapIcon
                  name={menuOpen ? 'bi-x-lg' : 'bi-list'}
                  size={18}
                  color={Colors.primaryDark}
                />
              }
              onPress={() => setMenuOpen((v) => !v)}
            />
            {/* Language switch pinned to the right of the nav bar — fixed row,
                never wraps or overlaps the hamburger. */}
            {renderLangRow(true)}
          </>
        ) : (
          <>
            <View style={styles.navLinks}>
              {/* Home: a plain single-click link — no panel to open. */}
              <Button
                label={t('nav.home')}
                variant="outline-primary"
                small
                active={activeHref(path.home)}
                className="fpp-nav-btn"
                onPress={() => navigate(path.home)}
              />
              {MEGA_SECTIONS.map(renderSectionTrigger)}
            </View>

            <View style={styles.navRight}>
              <View style={styles.searchBox}>
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={t('header.search')}
                  placeholderTextColor={Colors.textMuted}
                  style={[styles.searchInput, { fontSize: fs(12) }]}
                  onSubmitEditing={submitSearch}
                  accessibilityLabel={t('header.search')}
                />
                                <Button
                  variant="primary"
                  small
                  label={t('header.searchBtn')}
                  leading={<BootstrapIcon name="bi-search" size={12} color={Colors.white} />}
                  onPress={submitSearch}
                />
              </View>
              <Button
                variant="primary"
                label={t('nav.login')}
                accessibilityHint={t('header.loginHint')}
                leading={<BootstrapIcon name="bi-box-arrow-in-right" size={13} color={Colors.white} />}
                onPress={() => navigate(path.login)}
              />
            </View>
          </>
        )}

        {/* Full-width mega panel: opens on click, anchored under this row so it
            can never be clipped by the brand/utility bars, and paints above the
            page (the container raises its z-index while a section is open). */}
        {!compact && openPanel ? (
          <MegaMenuPanel
            key={openPanel.key}
            section={openPanel}
            isActive={activeHref}
            onNavigate={navigate}
            showAside={showAside}
            panelRef={panelRef}
          />
        ) : null}
      </View>

      {/* Mobile drawer — an accordion: the section titles expand in place, so the
          drawer stays short while every destination stays two taps away. */}
      {compact && menuOpen ? (
        <ScrollView
          style={[styles.mobileMenuScroll, { maxHeight: Math.round(height * 0.55) }]}
          contentContainerStyle={styles.mobileMenu}
          keyboardShouldPersistTaps="handled"
        >
          <Button
            label={t('nav.home')}
            variant="outline-primary"
            active={activeHref(path.home)}
            className="w-100"
            onPress={() => navigate(path.home)}
          />
          {MEGA_SECTIONS.map((section) => (
            <MegaNavAccordion
              key={section.key}
              section={section}
              isActive={activeHref}
              onNavigate={navigate}
              expanded={openMobileSection === section.key}
              onToggle={() =>
                setOpenMobileSection((current) =>
                  current === section.key ? null : section.key
                )
              }
            />
          ))}
          <View style={styles.mobileGroup}>
            <Text style={[styles.mobileGroupLabel, { fontSize: fs(11) }]}>
              {t('footer.portalInfo')}
            </Text>
            <Button
              label={t('nav.about')}
              variant="outline-secondary"
              small
              active={activeHref(path.about)}
              className="w-100"
              onPress={() => navigate(path.about)}
            />
            <Button
              label={t('nav.help')}
              variant="outline-secondary"
              small
              active={activeHref(path.help)}
              className="w-100"
              onPress={() => navigate(path.help)}
            />
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
  },
  /* Lift the header only while a dropdown is open, so the absolutely
     positioned menu panel paints above the page content below it. */
  containerOpen: {
    zIndex: 1,
  },
  utilityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 4,
    flexWrap: 'wrap',
    gap: 4,
  },
  utilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  utilityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  utilityLink: {
    color: Colors.info,
    fontWeight: '600',
  },
  utilityMuted: {
    color: Colors.textMuted,
    fontWeight: '600',
  },
  sizeBtn: {
    minWidth: 22,
    minHeight: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  sizeBtnActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  sizeBtnText: {
    color: Colors.text,
    fontWeight: '800',
  },
  sizeBtnTextActive: {
    color: Colors.white,
  },
  topBar: {
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    paddingVertical: 6,
  },
  govText: {
    color: Colors.white,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Fonts.semiBold,
  },
  deptText: {
    color: Colors.saffronLight,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 1,
    fontFamily: Fonts.regular,
  },
  brandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  brandBarCompact: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: Spacing.sm,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLeftCompact: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  emblem: {
    width: 34,
    height: 44,
  },
  emblemBtn: {
    padding: 3,
    borderRadius: 8,
  },
  brandDivider: {
    width: 1,
    height: 44,
    backgroundColor: Colors.border,
  },
  brandText: {
    flexDirection: 'column',
  },
  portalName: {
    color: Colors.primaryDark,
    fontWeight: '800',
    letterSpacing: 0.2,
    fontFamily: Fonts.extraBold,
  },
  portalNameLocal: {
    color: Colors.primaryDark,
    fontWeight: '600',
    letterSpacing: 0,
    marginTop: 2,
    fontFamily: Fonts.semiBold,
  },
  portalTagline: {
    color: Colors.textMuted,
    fontWeight: '500',
  },
  brandRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    width: 46,
    height: 31,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceMuted,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  langBtnActive: {
    backgroundColor: Colors.primaryDark,
  },
  langBtnText: {
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  langBtnTextActive: {
    color: Colors.white,
  },
  /* Phone variants — slim segmented switch for the mobile nav bar */
  langRowTight: {
    flexShrink: 0,
  },
  langBtnTight: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  topBarCompact: {
    paddingVertical: 4,
  },
  brandBarPhone: {
    paddingVertical: 10,
  },
  emblemPhone: {
    width: 28,
    height: 37,
  },
  brandTextCompact: {
    flex: 1,
    minWidth: 0,
  },
  /* Compact quick actions on the brand row (search + login) */
  brandActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  headerIconBtn: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBtnPressed: {
    backgroundColor: Colors.primaryLight,
  },
  loginBtnSm: {
    height: 34,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
    backgroundColor: Colors.primaryDark,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnSmPressed: {
    opacity: 0.85,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: Colors.primaryLight,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    /* Grow to fill the row, shrink when the viewport is tight (the items then
       wrap inside instead of pushing the search/login group off screen). */
    flexGrow: 1,
    flexShrink: 1,
    /* Above navRight while a dropdown is open — the panel may overlap it. */
    zIndex: 1,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    /* Right-aligned on the first line; right-aligned on its own line when
       the nav links wrap (auto margins absorb the free space either way). */
    marginLeft: 'auto',
  },
  /* ── Header items that own a mega panel ───────────────────────── */
  navGroup: {
    position: 'relative',
  },
  navGroupOpen: {
    zIndex: 1,
  },
  /* The mega panel itself (rail, link cards, aside, footer) is styled in
     MegaMenu.tsx; the header only hosts its trigger and the open-state
     stacking order. */
  dismissLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    /* Extends past the header so page-content taps dismiss the menu too. */
    height: 100000,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDark,
    backgroundColor: Colors.white,
  },
  searchInput: {
    minWidth: 150,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: Colors.text,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  searchBtnText: {
    color: Colors.white,
    fontWeight: '700',
  },
  loginBtn: {
    borderWidth: 1,
    borderColor: Colors.primaryDark,
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  loginBtnText: {
    color: Colors.white,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  menuBtnText: {
    color: Colors.primaryDark,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mobileMenuScroll: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
  },
  mobileMenu: {
    paddingHorizontal: 12,
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  mobileGroup: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    gap: 6,
  },
  mobileGroupLabel: {
    color: Colors.primaryDark,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    paddingHorizontal: 2,
  },
});
