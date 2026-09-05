import { Image } from 'expo-image';
import { router, usePathname } from 'expo-router';
import type { Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { Colors, Fonts, Spacing } from '../constants/theme';
import { useI18n, type LanguageCode, type TextSizeLevel } from '../i18n';
import { path } from '../navigation';
import BootstrapIcon from './BootstrapIcon';
import NavButton from './NavButton';

type NavItem = {
  key: string;
  label: string;
  href: Href;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', href: path.home },
  { key: 'about', label: 'About the Portal', href: path.about },
  { key: 'centres', label: 'Procurement Centres', href: path.centres },
  { key: 'booking', label: 'Slot Booking', href: path.booking },
  { key: 'queue', label: 'Track Token', href: path.queue },
  { key: 'status', label: 'Status', href: path.status },
  { key: 'notices', label: 'Notices', href: path.notices },
  { key: 'help', label: 'Help', href: path.help },
];

/**
 * Bilingual portal title — authentic gov-portal style shows the portal name in
 * two languages (English + Hindi devanagari). The main line is the localized
 * `common.appName`; the line underneath is always the *other* script so the
 * header reads like a real Indian government website.
 */
const HINDI_APP_NAME = 'राष्ट्रीय किसान क्रय पोर्टल';
const ENGLISH_APP_NAME = 'National Farmer Procurement Portal';

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
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const compact = width < 768;
  const [emblemScale] = useState(() => new Animated.Value(1));

  const springEmblem = (toValue: number) => {
    Animated.spring(emblemScale, {
      toValue,
      useNativeDriver: Platform.OS !== 'web',
      speed: 45,
      bounciness: 7,
    }).start();
  };

  const navigate = (href: Href) => {
    setMenuOpen(false);
    router.push(href as never);
  };

  const activeHref = (href: Href) => {
    const hrefStr = typeof href === 'string' ? href : String(href);
    return pathname === hrefStr || pathname.startsWith(hrefStr);
  };

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

  return (
    <View style={styles.container}>
      {/* Utility strip — accessibility controls (authentic gov-portal touch) */}
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

      {/* Government identity strip */}
      <View style={styles.topBar}>
        <Text style={[styles.govText, { fontSize: fs(13) }]}>
          भारत सरकार / Government of India
        </Text>
        <Text style={[styles.deptText, { fontSize: fs(11) }]}>{t('common.gov')}</Text>
      </View>

      {/* Brand bar with National Emblem + Flag */}
      <View style={[styles.brandBar, compact && styles.brandBarCompact]}>
        <View style={[styles.brandLeft, compact && styles.brandLeftCompact]}>
          <Animated.View style={{ transform: [{ scale: emblemScale }] }}>
            <Pressable
              onPress={() => navigate(path.home)}
              onPressIn={() => springEmblem(0.9)}
              onPressOut={() => springEmblem(1)}
              accessibilityRole="link"
              accessibilityLabel="State Emblem of India — back to home"
              style={({ pressed }) => [styles.emblemBtn, pressed && styles.emblemBtnPressed]}
            >
              <Image
                source={require('../assets/emblem.svg')}
                style={styles.emblem}
                contentFit="contain"
                accessibilityLabel="State Emblem of India"
              />
            </Pressable>
          </Animated.View>
          {!compact ? <View style={styles.brandDivider} /> : null}
          <View style={styles.brandText}>
            <Text style={[styles.portalName, { fontSize: fs(compact ? 16 : 19) }]} numberOfLines={2}>
              {t('common.appName')}
            </Text>
            <Text style={[styles.portalNameLocal, { fontSize: fs(compact ? 11 : 12) }]} numberOfLines={1}>
              {language === 'hi' ? ENGLISH_APP_NAME : HINDI_APP_NAME}
            </Text>
            {!compact ? (
              <Text style={[styles.portalTagline, { fontSize: fs(11) }]}>{t('common.tagline')}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.brandRight}>
          {!compact ? (
            <Image
              source={require('../assets/flag.svg')}
              style={styles.flag}
              contentFit="contain"
              accessibilityLabel="Flag of India"
            />
          ) : null}
          <View style={styles.langRow}>
            {LANG_OPTIONS.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => setLanguage(lang.code)}
                style={[styles.langBtn, language === lang.code && styles.langBtnActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: language === lang.code }}
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
        </View>
      </View>

      {/* Navigation row: hamburger (mobile) or links + search + login (desktop) */}
      <View style={styles.navRow}>
        {compact ? (
          <Pressable
            onPress={() => setMenuOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: menuOpen }}
            accessibilityLabel={menuOpen ? t('common.close') : t('nav.menu')}
            style={styles.menuBtn}
          >
            <BootstrapIcon
              name={menuOpen ? 'bi-x-lg' : 'bi-list'}
              fallback={menuOpen ? 'close' : 'menu'}
              size={20}
              color={Colors.primaryDark}
            />
            <Text style={[styles.menuBtnText, { fontSize: fs(12) }]}>
              {menuOpen ? t('common.close') : t('nav.menu')}
            </Text>
          </Pressable>
        ) : (
          <>
            <View style={styles.navLinks}>
              {NAV_ITEMS.map((item) => {
                const isActive = activeHref(item.href);
                return (
                  <NavButton
                    key={item.key}
                    label={item.label}
                    onPress={() => navigate(item.href)}
                    active={isActive}
                  />
                );
              })}
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
                <Pressable onPress={submitSearch} style={styles.searchBtn} accessibilityRole="button">
                  <BootstrapIcon name="bi-search" fallback="search" size={12} color={Colors.white} />
                  <Text style={[styles.searchBtnText, { fontSize: fs(12) }]}>{t('header.searchBtn')}</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => navigate(path.login)}
                style={styles.loginBtn}
                accessibilityRole="button"
              >
                <View style={styles.loginRow}>
                  <BootstrapIcon name="bi-box-arrow-in-right" fallback="log-in" size={13} color={Colors.white} />
                  <Text style={[styles.loginBtnText, { fontSize: fs(13) }]}>{t('nav.login')}</Text>
                </View>
              </Pressable>
            </View>
          </>
        )}
      </View>

      {/* Mobile drawer — expands inline under the nav row */}
      {compact && menuOpen ? (
        <View style={styles.mobileMenu}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeHref(item.href);
            return (
              <NavButton
                key={item.key}
                label={item.label}
                onPress={() => navigate(item.href)}
                active={isActive}
                block
              />
            );
          })}
          <View style={styles.mobileSearchRow}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('header.search')}
              placeholderTextColor={Colors.textMuted}
              style={[styles.mobileSearchInput, { fontSize: fs(13) }]}
              onSubmitEditing={submitSearch}
              accessibilityLabel={t('header.search')}
            />
            <Pressable onPress={submitSearch} style={styles.mobileSearchBtn} accessibilityRole="button">
              <BootstrapIcon name="bi-search" fallback="search" size={13} color={Colors.white} />
              <Text style={[styles.mobileSearchBtnText, { fontSize: fs(13) }]}>{t('header.searchBtn')}</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => navigate(path.login)}
            style={styles.mobileLogin}
            accessibilityRole="button"
          >
            <View style={styles.loginRow}>
              <BootstrapIcon name="bi-box-arrow-in-right" fallback="log-in" size={14} color={Colors.white} />
              <Text style={[styles.mobileLoginText, { fontSize: fs(14) }]}>{t('nav.login')}</Text>
            </View>
          </Pressable>
        </View>
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
  emblemBtnPressed: {
    opacity: 0.75,
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
    gap: 10,
    flexWrap: 'wrap',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  mobileMenu: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingHorizontal: 12,
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  mobileSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    backgroundColor: Colors.surfaceAlt,
  },
  mobileSearchInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: Colors.text,
  },
  mobileSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  mobileSearchBtnText: {
    color: Colors.white,
    fontWeight: '700',
  },
  mobileLogin: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
    backgroundColor: Colors.primaryDark,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileLoginText: {
    color: Colors.white,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
