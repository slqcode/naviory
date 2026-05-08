// src/utils/groupTheme.ts
// 分组图标和颜色的集中管理。
// - 图标：lucide-react 中语义相关的一组图标
// - 颜色：Tailwind 色盘中饱和度较高、在浅/深色背景下都有良好辨识度的颜色
import {
  Briefcase,
  FolderKanban,
  Sparkles,
  Code,
  FileText,
  Wrench,
  Clock,
  Bookmark,
  Star,
  Heart,
  Home,
  Book,
  Globe,
  Rocket,
  Zap,
  Palette,
  Music,
  Camera,
  ShoppingCart,
  Gamepad2,
  GraduationCap,
  Coffee,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';

/** 可选图标列表（按类别排序，让用户更容易找到合适的） */
export const GROUP_ICONS: { name: string; component: LucideIcon }[] = [
  { name: 'Briefcase', component: Briefcase },
  { name: 'FolderKanban', component: FolderKanban },
  { name: 'Code', component: Code },
  { name: 'FileText', component: FileText },
  { name: 'Book', component: Book },
  { name: 'GraduationCap', component: GraduationCap },
  { name: 'Sparkles', component: Sparkles },
  { name: 'Rocket', component: Rocket },
  { name: 'Zap', component: Zap },
  { name: 'Lightbulb', component: Lightbulb },
  { name: 'Star', component: Star },
  { name: 'Heart', component: Heart },
  { name: 'Bookmark', component: Bookmark },
  { name: 'Home', component: Home },
  { name: 'Globe', component: Globe },
  { name: 'Wrench', component: Wrench },
  { name: 'Palette', component: Palette },
  { name: 'Music', component: Music },
  { name: 'Camera', component: Camera },
  { name: 'Gamepad2', component: Gamepad2 },
  { name: 'Coffee', component: Coffee },
  { name: 'ShoppingCart', component: ShoppingCart },
  { name: 'Clock', component: Clock },
];

const ICON_MAP = new Map(GROUP_ICONS.map((i) => [i.name, i.component]));

/**
 * 按名称获取图标组件。未匹配时返回默认的 Bookmark。
 */
export function getGroupIcon(name?: string): LucideIcon {
  if (!name) return Bookmark;
  return ICON_MAP.get(name) ?? Bookmark;
}

/** 分组颜色定义：key 为色名，value 为前景/背景的 Tailwind class */
export interface GroupColorStyle {
  /** 色名（存储到 group.color 字段） */
  key: string;
  /** 在浅色模式下用作图标颜色和分组色条的 HEX，同时用于调色板展示 */
  hex: string;
  /** 图标容器的底色 class（浅/深色模式） */
  bgClass: string;
  /** 图标本身的颜色 class（浅/深色模式） */
  textClass: string;
}

export const GROUP_COLORS: GroupColorStyle[] = [
  { key: 'blue',    hex: '#3B82F6', bgClass: 'bg-blue-100 dark:bg-blue-900/40',       textClass: 'text-blue-600 dark:text-blue-300' },
  { key: 'indigo',  hex: '#6366F1', bgClass: 'bg-indigo-100 dark:bg-indigo-900/40',   textClass: 'text-indigo-600 dark:text-indigo-300' },
  { key: 'purple',  hex: '#A855F7', bgClass: 'bg-purple-100 dark:bg-purple-900/40',   textClass: 'text-purple-600 dark:text-purple-300' },
  { key: 'pink',    hex: '#EC4899', bgClass: 'bg-pink-100 dark:bg-pink-900/40',       textClass: 'text-pink-600 dark:text-pink-300' },
  { key: 'red',     hex: '#EF4444', bgClass: 'bg-red-100 dark:bg-red-900/40',         textClass: 'text-red-600 dark:text-red-300' },
  { key: 'orange',  hex: '#F97316', bgClass: 'bg-orange-100 dark:bg-orange-900/40',   textClass: 'text-orange-600 dark:text-orange-300' },
  { key: 'yellow',  hex: '#EAB308', bgClass: 'bg-yellow-100 dark:bg-yellow-900/40',   textClass: 'text-yellow-700 dark:text-yellow-300' },
  { key: 'green',   hex: '#22C55E', bgClass: 'bg-green-100 dark:bg-green-900/40',     textClass: 'text-green-600 dark:text-green-300' },
  { key: 'teal',    hex: '#14B8A6', bgClass: 'bg-teal-100 dark:bg-teal-900/40',       textClass: 'text-teal-600 dark:text-teal-300' },
  { key: 'cyan',    hex: '#06B6D4', bgClass: 'bg-cyan-100 dark:bg-cyan-900/40',       textClass: 'text-cyan-600 dark:text-cyan-300' },
  { key: 'gray',    hex: '#6B7280', bgClass: 'bg-gray-200 dark:bg-gray-700',          textClass: 'text-gray-700 dark:text-gray-200' },
];

const COLOR_MAP = new Map(GROUP_COLORS.map((c) => [c.key, c]));

/** 根据色名获取 Tailwind class 组合。未匹配时返回 indigo */
export function getGroupColorStyle(key?: string): GroupColorStyle {
  if (!key) return COLOR_MAP.get('indigo')!;
  return COLOR_MAP.get(key) ?? COLOR_MAP.get('indigo')!;
}
