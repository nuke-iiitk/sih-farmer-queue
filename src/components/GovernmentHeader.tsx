import { Image } from 'expo-image';
import type { Href } from 'expo-router';
import { router, usePathname } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '../constants/theme';
import { useI18n, type LanguageCode, type TextSizeLevel } from '../i18n';
import { path } from '../navigation';
import BootstrapIcon from './BootstrapIcon';
import Button from './Button';

type NavItem = {
  key: string;
  label: string;
  href: Href;
};

/** A dropdown category on the desktop bar (and a section in the mobile menu). */
type NavGroup = {
  key: string;
  label: string;
  items: NavItem[];
};

/** The two destinations that stay visible as plain links on the bar. */
const NAV_LINKS: NavItem[] = [
  { key: 'home', label: 'Home', href: path.home },
  { key: 'dashboard', label: 'Dashboard', href: path.dashboard },
];

/**
 * Every other entry from the original flat menu, grouped into dropdown
 * categories. Routes are identical to the previous list — this is a pure
 * navigation-structure change: no page was added, removed, renamed or
 * duplicated, so all 15 remaining destinations stay reachable.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    key: 'acquisition',
    label: 'Acquisition',
    items: [
      { key: 'workflow', label: 'Acquisition Workflow', href: path.workflow },
      { key: 'proposal', label: 'Submit Proposal', href: path.proposal },
      { key: 'possession', label: 'Possession', href: path.possession },
      { key: 'alerts', label: 'Alerts', href: path.alerts },
    ],
  },
  {
    key: 'projects',
    label: 'Projects',
    items: [
      { key: 'projects', label: 'Projects', href: path.projects },
      { key: 'awards', label: 'Awards', href: path.awards },
    ],
  },
  {
    key: 'land',
    label: 'Land & GIS',
    items: [
      { key: 'parcels', label: 'Land Parcels', href: path.parcels },
      { key: 'gis', label: 'GIS Map', href: path.gis },
    ],
  },
  {
    key: 'compensation',
    label: 'Compensation & R&R',
    items: [
      { key: 'compensation', label: 'Compensation', href: path.compensation },
      { key: 'rr', label: 'R&R', href: path.rr },
    ],
  },
  {
    key: 'documents',
    label: 'Documents',
    items: [{ key: 'documents', label: 'Documents', href: path.documents }],
  },
  {
    key: 'reports',
    label: 'Reports',
    items: [{ key: 'reports', label: 'Reports & Analytics', href: path.reports }],
  },
  {
    key: 'administration',
    label: 'Administration',
    items: [{ key: 'admin', label: 'Administration', href: path.administration }],
  },
  {
    key: 'more',
    label: 'More',
    items: [
      { key: 'about', label: 'About', href: path.about },
      { key: 'help', label: 'Help', href: path.help },
    ],
  },
];

/** Dropdown sizing — deliberately compact, never a mega-menu. */
const MENU_MIN_WIDTH = 200;
const MENU_MAX_WIDTH = 240;

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

export default function GovernmentHeader() {
  const { t, fs, setLanguage, language, textSize, setTextSize } = useI18n();
  const pathname = usePathname();
  const { width, height } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  /** Key of the open desktop dropdown category (null = all closed). */
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  /** Which edge the open menu is anchored to (keeps it inside the viewport). */
  const [menuFlipped, setMenuFlipped] = useState(false);
  /** Shared 0→1 value driving the subtle menu entrance animation. Lazy state
      keeps the Animated.Value stable without reading a ref during render. */
  const [menuAnim] = useState(() => new Animated.Value(0));
  /** Trigger elements per category — used for viewport-edge checks (web). */
  const groupRefs = useRef<Record<string, unknown>>({});
  const compact = width < 768;
  const phone = width < 600;

  const navigate = (href: Href) => {
    setMenuOpen(false);
    setOpenGroup(null);
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

  /** Open a category dropdown (or close it when its trigger is pressed again). */
  const toggleGroup = (group: NavGroup) => {
    if (openGroup === group.key) {
      setOpenGroup(null);
      return;
    }
    // Anchor the panel away from the right viewport edge when the trigger sits
    // close to it, so a dropdown can never overflow the screen.
    let flip = false;
    const node = groupRefs.current[group.key] as
      | { getBoundingClientRect?: () => { right: number } }
      | null
      | undefined;
    if (Platform.OS === 'web' && typeof document !== 'undefined' && node?.getBoundingClientRect) {
      flip =
        node.getBoundingClientRect().right + MENU_MAX_WIDTH + 12 >
        document.documentElement.clientWidth;
    }
    setMenuFlipped(flip);
    setOpenGroup(group.key);
  };

  // A dropdown never outlives its context: when the route or the viewport
  // changes, close it during render (React's guarded state-adjustment
  // pattern) instead of cascading through an effect.
  const [navContext, setNavContext] = useState({ pathname, width });
  if (navContext.pathname !== pathname || navContext.width !== width) {
    setNavContext({ pathname, width });
    if (openGroup) setOpenGroup(null);
  }

  // Web dismissal — Escape plus clicks anywhere outside. A click that lands
  // inside the open category (its trigger button or its panel) belongs to the
  // control's own React handler; closing first would unmount the panel before
  // a menu item's onPress could run. So clicks inside the open group are
  // skipped, and only clicks anywhere else dismiss the dropdown.
  useEffect(() => {
    if (!openGroup) return;
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpenGroup(null);
        setMenuOpen(false);
      }
    };
    const onDocumentClick = (event: MouseEvent) => {
      const group = groupRefs.current[openGroup] as
        | { contains?: (node: Node) => boolean }
        | null
        | undefined;
      const target = event.target as Node | null;
      if (target && typeof group?.contains === 'function' && group.contains(target)) return;
      setOpenGroup(null);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onDocumentClick, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onDocumentClick, true);
    };
  }, [openGroup]);

  // Subtle entrance (fade + 4px settle). Zero duration honours reduced motion.
  useEffect(() => {
    if (!openGroup) return;
    menuAnim.setValue(0);
    const reducedMotion =
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    Animated.timing(menuAnim, {
      toValue: 1,
      duration: reducedMotion ? 0 : 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [openGroup, menuAnim]);

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

  /** One desktop category: trigger button + (when open) its dropdown menu. */
  const renderNavGroup = (group: NavGroup) => {
    const open = openGroup === group.key;
    const sectionActive = group.items.some((item) => activeHref(item.href));
    const on = open || sectionActive;
    // Web fills the trigger navy when active/open (white caret); native tints
    // it light blue, so keep the caret dark there for contrast.
    const caretColor = Platform.OS === 'web' && on ? Colors.white : Colors.primaryDark;
    return (
      <View
        key={group.key}
        ref={(element) => {
          groupRefs.current[group.key] = element;
        }}
        style={[styles.navGroup, on && styles.navGroupOpen]}
      >
        <Button
          label={group.label}
          variant="outline-primary"
          small
          active={on}
          expanded={open}
          className="fpp-nav-btn"
          accessibilityLabel={`${group.label} menu`}
          after={<BootstrapIcon name="bi-chevron-down" size={13} color={caretColor} />}
          onPress={() => toggleGroup(group)}
        />
        {open ? renderNavMenu(group) : null}
      </View>
    );
  };

  /** Compact dropdown panel listing a category's existing routes. */
  const renderNavMenu = (group: NavGroup) => (
    <Animated.View
      accessibilityRole="menu"
      accessibilityLabel={`${group.label} pages`}
      style={[
        styles.menu,
        menuFlipped ? styles.menuAnchorRight : styles.menuAnchorLeft,
        {
          opacity: menuAnim,
          transform: [
            { translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [-4, 0] }) },
          ],
        },
      ]}
    >
      {group.items.map((item, index) => {
        const isActive = activeHref(item.href);
        return (
          <Pressable
            key={item.key}
            accessibilityRole="menuitem"
            accessibilityState={{ selected: isActive }}
            onPress={() => navigate(item.href)}
            style={(state) => {
              // RNW also reports `hovered`/`focused` here; native only `pressed`.
              const { pressed, hovered, focused } = state as {
                pressed: boolean;
                hovered?: boolean;
                focused?: boolean;
              };
              return [
                styles.menuItem,
                index < group.items.length - 1 && styles.menuItemDivider,
                (hovered || pressed) && styles.menuItemTint,
                focused && styles.menuItemFocus,
                isActive && styles.menuItemActive,
              ];
            }}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.menuItemText,
                { fontSize: fs(14) },
                isActive && styles.menuItemTextActive,
              ]}
            >
              {item.label}
            </Text>
            {isActive ? (
              <BootstrapIcon name="bi-check-lg" size={15} color={Colors.primary} />
            ) : null}
          </Pressable>
        );
      })}
    </Animated.View>
  );

  return (
    <View style={[styles.container, openGroup ? styles.containerOpen : null]}>
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

      {/* Native-only tap-catcher: dismisses an open dropdown when tapping the
          brand/utility area (on web the document click listener does this
          without ever swallowing the user's click). */}
      {openGroup && Platform.OS !== 'web' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={() => setOpenGroup(null)}
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
              {NAV_LINKS.map((item) => {
                const isActive = activeHref(item.href);
                return (
                  <Button
                    key={item.key}
                    label={item.label}
                    variant="outline-primary"
                    small
                    active={isActive}
                    className="fpp-nav-btn"
                    onPress={() => navigate(item.href)}
                  />
                );
              })}
              {NAV_GROUPS.map(renderNavGroup)}
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
      </View>

      {/* Mobile drawer — grouped sections (same categories as the desktop
          dropdowns), scrollable so every page stays reachable on short screens */}
      {compact && menuOpen ? (
        <ScrollView
          style={[styles.mobileMenuScroll, { maxHeight: Math.round(height * 0.55) }]}
          contentContainerStyle={styles.mobileMenu}
          keyboardShouldPersistTaps="handled"
        >
          {NAV_LINKS.map((item) => (
            <Button
              key={item.key}
              label={item.label}
              variant="outline-primary"
              active={activeHref(item.href)}
              className="w-100"
              onPress={() => navigate(item.href)}
            />
          ))}
          {NAV_GROUPS.map((group) => (
            <View key={group.key} style={styles.mobileGroup}>
              <Text style={[styles.mobileGroupLabel, { fontSize: fs(11) }]}>
                {group.label}
              </Text>
              {group.items.map((item) => (
                <Button
                  key={item.key}
                  label={item.label}
                  variant="outline-primary"
                  active={activeHref(item.href)}
                  className="w-100"
                  onPress={() => navigate(item.href)}
                />
              ))}
            </View>
          ))}
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
  /* ── Grouped navigation dropdowns ─────────────────────────────── */
  navGroup: {
    position: 'relative',
  },
  navGroupOpen: {
    zIndex: 1,
  },
  menu: {
    position: 'absolute',
    top: '100%',
    marginTop: 4,
    minWidth: MENU_MIN_WIDTH,
    maxWidth: MENU_MAX_WIDTH,
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    overflow: 'hidden',
    zIndex: 1000,
    boxShadow: '0 6px 18px rgba(10, 32, 77, 0.18)',
  },
  menuAnchorLeft: {
    left: 0,
  },
  menuAnchorRight: {
    right: 0,
  },
  menuItem: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingHorizontal: 14,
    backgroundColor: Colors.white,
  },
  menuItemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  menuItemTint: {
    backgroundColor: Colors.surfaceMuted,
  },
  menuItemFocus: {
    backgroundColor: Colors.primaryLight,
  },
  menuItemActive: {
    backgroundColor: Colors.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    paddingLeft: 11,
  },
  menuItemText: {
    color: Colors.text,
    fontWeight: '600',
    flexShrink: 1,
  },
  menuItemTextActive: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
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
