import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { Colors, Fonts, MaxContentWidth, Radius, Spacing } from '../constants/theme';
import type { MegaLink, MegaSection } from '../data/megaMenu';
import { useI18n } from '../i18n';
import { path } from '../navigation';
import BootstrapIcon from './BootstrapIcon';
import { APP_ICONS } from './iconGlyphs';
import Button from './Button';

/**
 * Desktop mega-menu panel + the mobile drawer's accordion section.
 *
 * Interaction contract (GovernmentHeader owns the open/closed state):
 *  - the panel opens by *clicking* a header item — never by hover;
 *  - left column selects a sub-category (rail), middle column lists that
 *    rail's pages, right column holds the section's related registers;
 *  - every destination is a real `<a href>` (through Button's `href`), so
 *    new-tab and status-bar affordances keep working.
 */

/** Structural view of the DOM node RNW renders for a View (web navigation only). */
export type DomHandle = {
  contains?: (node: Node) => boolean;
  focus?: () => void;
  querySelectorAll?: (selector: string) => ArrayLike<{ focus?: () => void }>;
};

type ActiveCheck = (href: MegaLink['href']) => boolean;
type Navigate = (href: MegaLink['href']) => void;

/**
 * Shared 0→1 entrance value: a 140ms fade that settles 6px. Collapses to zero
 * duration when the OS asks for reduced motion.
 */
function useEnterAnimation() {
  const [enter] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const reduced =
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animation = Animated.timing(enter, {
      toValue: 1,
      duration: reduced ? 0 : 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [enter]);
  return enter;
}

/** `{ opacity, transform }` for an entrance value. */
const enterStyle = (enter: Animated.Value) => ({
  opacity: enter,
  transform: [
    { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) },
  ],
});

type PanelProps = {
  section: MegaSection;
  isActive: ActiveCheck;
  onNavigate: Navigate;
  /** Third (contextual) column — dropped on tablets where width is tight. */
  showAside: boolean;
  panelRef: React.RefObject<View | null>;
};

/**
 * Panel height budget: a consistent band of 25–30% of the viewport, clamped so
 * the overlay stays usable on short laptop screens and never swallows the page
 * on tall ones. Anything that does not fit scrolls *inside* the panel — the page
 * below the header never reflows.
 */
const PANEL_MIN_VH = 0.25;
const PANEL_MAX_VH = 0.3;
const MIN_PANEL_HEIGHT = 200;
const MAX_PANEL_HEIGHT = 380;

/** `{ minHeight, maxHeight }` for the panel shell, in px. */
function panelHeightFor(viewportHeight: number) {
  const minHeight = Math.min(
    Math.round(Math.max(viewportHeight * PANEL_MIN_VH, MIN_PANEL_HEIGHT)),
    MAX_PANEL_HEIGHT
  );
  const maxHeight = Math.min(
    Math.round(Math.max(viewportHeight * PANEL_MAX_VH, minHeight)),
    MAX_PANEL_HEIGHT
  );
  return { minHeight, maxHeight };
}

export function MegaMenuPanel({ section, isActive, onNavigate, showAside, panelRef }: PanelProps) {
  const { t, fs } = useI18n();
  const { height } = useWindowDimensions();
  // Open on the rail that owns the current route, so the panel is contextual.
  const [railKey, setRailKey] = useState(() => {
    const owning = section.rails.find((item) => item.links.some((link) => isActive(link.href)));
    return (owning ?? section.rails[0]).key;
  });
  const rail = section.rails.find((item) => item.key === railKey) ?? section.rails[0];
  const enter = useEnterAnimation();

  return (
    <Animated.View
      ref={panelRef}
      /* RNW maps role="navigation" to a real <nav> element, so the panel is a
         labelled landmark rather than a widget-style menu: the entries stay
         ordinary links (Tab/Shift+Tab, Enter, middle-click all behave). */
      role="navigation"
      accessibilityLabel={`${section.title} mega menu`}
      style={[styles.panel, panelHeightFor(height), enterStyle(enter)]}
    >
      <View style={styles.inner}>
        {/* Everything above the footer scrolls inside the panel: the shell keeps
            its viewport-bounded height, so the page never reflows. */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.columns}>
            {/* Left column — the section's sub-categories. Selecting one re-fills
                the middle column; the selected row keeps a subtle tint + bar. */}
            <View style={[styles.rail, showAside ? styles.railWide : styles.railNarrow]}>
              <Text style={[styles.railHeading, { fontSize: fs(11) }]}>{section.title}</Text>
              {section.rails.map((item) => {
                const selected = item.key === rail.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setRailKey(item.key)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: selected }}
                    {...({ 'aria-expanded': selected } as object)}
                    accessibilityLabel={item.label}
                    style={(state) => {
                      const { pressed, hovered, focused } = state as {
                        pressed: boolean;
                        hovered?: boolean;
                        focused?: boolean;
                      };
                      return [
                        styles.railItem,
                        (hovered || pressed) && styles.railItemHover,
                        focused && styles.railItemFocus,
                        selected && styles.railItemSelected,
                      ];
                    }}
                  >
                    <BootstrapIcon
                      name={item.icon}
                      size={15}
                      color={selected ? Colors.primaryDark : Colors.textMuted}
                    />
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.railLabel,
                        { fontSize: fs(13) },
                        selected && styles.railLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <BootstrapIcon
                      name={APP_ICONS.chevronForward}
                      size={11}
                      color={selected ? Colors.primary : Colors.borderDark}
                    />
                  </Pressable>
                );
              })}
            </View>

            {/* Middle column — the selected sub-category's pages. */}
            <View style={styles.links}>
              <Text style={[styles.linksHeading, { fontSize: fs(11) }]}>{rail.label}</Text>
              <View style={styles.linkList}>
                {rail.links.map((link) => (
                  <Button
                    key={String(link.href)}
                    variant="nav"
                    href={link.href}
                    label={link.label}
                    description={link.description}
                    className="fpp-mega-link"
                    active={isActive(link.href)}
                    accessibilityLabel={link.label}
                    after={
                      <BootstrapIcon
                        name={APP_ICONS.arrowForward}
                        size={13}
                        color={Colors.primary}
                      />
                    }
                    onPress={() => onNavigate(link.href)}
                  />
                ))}
              </View>
            </View>

            {/* Right column — related registers (context, not a second copy). */}
            {showAside ? (
              <View style={styles.aside}>
                <Text style={[styles.asideHeading, { fontSize: fs(11) }]}>
                  {section.aside.title}
                </Text>
                {section.aside.links.map((link) => (
                  <Button
                    key={String(link.href)}
                    variant="nav"
                    href={link.href}
                    label={link.label}
                    description={link.description}
                    className="fpp-mega-link-sm"
                    accessibilityLabel={link.label}
                    onPress={() => onNavigate(link.href)}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* Panel footer — the section hub plus the standing portal links. */}
        <View style={styles.footer}>
          <Button
            variant="link"
            href={section.hub}
            label={`${t('common.viewAll')} ${section.label}`}
            className="fpp-mega-hub"
            after={<BootstrapIcon name={APP_ICONS.arrowForward} size={13} color={Colors.info} />}
            onPress={() => onNavigate(section.hub)}
          />
          <View style={styles.footerMeta}>
            <Button
              variant="nav"
              href={path.about}
              label={t('nav.about')}
              className="fpp-mega-foot-link"
              onPress={() => onNavigate(path.about)}
            />
            <Text style={styles.footerDivider}>|</Text>
            <Button
              variant="nav"
              href={path.help}
              label={t('nav.help')}
              className="fpp-mega-foot-link"
              onPress={() => onNavigate(path.help)}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

type AccordionProps = {
  section: MegaSection;
  isActive: ActiveCheck;
  onNavigate: Navigate;
  expanded: boolean;
  onToggle: () => void;
};

/**
 * Mobile/tablet drawer entry: the section title expands in place to reveal its
 * sub-categories and pages, so the drawer stays short instead of listing every
 * destination as a full-width button.
 */
export function MegaNavAccordion({
  section,
  isActive,
  onNavigate,
  expanded,
  onToggle,
}: AccordionProps) {
  const { t, fs } = useI18n();
  const enter = useEnterAnimation();

  return (
    <View style={styles.accordion}>
      <Button
        variant="outline-primary"
        label={section.label}
        className="w-100"
        expanded={expanded}
        accessibilityLabel={`${section.label} menu`}
        after={
          <BootstrapIcon
            name={expanded ? APP_ICONS.chevronDown : APP_ICONS.chevronForward}
            size={13}
            color={Colors.primaryDark}
          />
        }
        onPress={onToggle}
      />

      {expanded ? (
        <Animated.View style={[styles.accordionBody, enterStyle(enter)]}>
          {section.rails.map((rail) => (
            <View key={rail.key} style={styles.accordionGroup}>
              <Text style={[styles.accordionGroupLabel, { fontSize: fs(10) }]}>
                {rail.label}
              </Text>
              {rail.links.map((link) => (
                <Button
                  key={String(link.href)}
                  variant="outline-secondary"
                  small
                  label={link.label}
                  className="w-100"
                  active={isActive(link.href)}
                  onPress={() => onNavigate(link.href)}
                />
              ))}
            </View>
          ))}
          <Button
            variant="link"
            small
            label={`${t('common.viewAll')} ${section.label}`}
            onPress={() => onNavigate(section.hub)}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── Desktop panel shell ─────────────────────────────────────────── */
  panel: {
    /* Floating overlay: pinned to the bottom edge of the nav row, full width,
       held inside a 25–30vh band (`minHeight`/`maxHeight` are set inline from
       the viewport) and scrolling its own content — it never grows the
       document, so the page under the header never reflows. */
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
    overflow: 'hidden',
    zIndex: 1000,
    boxShadow: '0 14px 30px rgba(10, 32, 77, 0.22)',
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
    paddingBottom: 6,
    /* Column flex inside the height-bounded shell: the scroll area takes the
       remaining space and the footer stays pinned at the panel's bottom edge. */
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    /* Grows into the panel's min-height slack (so the footer sits at the
       bottom edge) and shrinks/scrolls when the content exceeds the band. */
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  scrollContent: {
    /* Keep the natural height (RNW would otherwise stretch the content to the
       scroll area); the panel only scrolls when the budget is exceeded. */
    flexGrow: 0,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.md,
  },

  /* ── Left column: sub-categories ─────────────────────────────────── */
  rail: {
    flexDirection: 'column',
    gap: 1,
    paddingRight: Spacing.md,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Colors.border,
  },
  railWide: {
    width: 250,
  },
  railNarrow: {
    width: 200,
  },
  railHeading: {
    color: Colors.textMuted,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: Fonts.extraBold,
    paddingHorizontal: 10,
    paddingBottom: 4,
  },
  railItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  railItemHover: {
    backgroundColor: Colors.surfaceMuted,
  },
  railItemFocus: {
    backgroundColor: Colors.primaryLight,
  },
  railItemSelected: {
    backgroundColor: Colors.primaryLight,
    borderLeftColor: Colors.primary,
  },
  railLabel: {
    flex: 1,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  railLabelSelected: {
    color: Colors.primaryDark,
    fontWeight: '800',
    fontFamily: Fonts.bold,
  },

  /* ── Middle column: the selected rail's pages ────────────────────── */
  links: {
    flex: 1,
    minWidth: 0,
  },
  linksHeading: {
    color: Colors.textMuted,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: Fonts.extraBold,
    paddingHorizontal: 10,
    paddingBottom: 4,
  },
  linkList: {
    gap: 1,
  },

  /* ── Right column: related registers ────────────────────────────── */
  aside: {
    width: 250,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 1,
  },
  asideHeading: {
    color: Colors.textMuted,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: Fonts.extraBold,
    paddingHorizontal: 6,
    paddingTop: 2,
    paddingBottom: 3,
  },

  /* ── Footer: section hub + standing portal links ─────────────────── */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: 6,
    paddingTop: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  footerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerDivider: {
    color: Colors.borderDark,
  },
  /* ── Mobile drawer accordion ─────────────────────────────────────── */
  accordion: {
    gap: 4,
  },
  accordionBody: {
    gap: 8,
    paddingLeft: Spacing.sm,
    marginTop: 2,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primaryLight,
  },
  accordionGroup: {
    gap: 4,
  },
  accordionGroupLabel: {
    color: Colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 2,
    paddingTop: 4,
  },
});
