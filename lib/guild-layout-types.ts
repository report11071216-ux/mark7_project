export type RecentMember = {
  user_id: string;
  points: number;
  joined_at: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
    mark_url?: string | null;
    card_url?: string | null;
  } | null;
};
export type RankingMember = {
  user_id: string;
  points: number;
  role: string;
  title?: string | null;
  profiles: {
    username: string | null;
    avatar_url: string | null;
    mark_url?: string | null;
    card_url?: string | null;
  } | null;
};
export type OnlineMember = {
  user_id: string;
  last_seen_at: string | null;
  title?: string | null;
  profiles: {
    username: string | null;
    avatar_url: string | null;
    mark_url?: string | null;
    card_url?: string | null;
  } | null;
};
export type NoticePost = {
  id: string;
  title: string;
  created_at: string;
  is_notice: boolean;
  author: { username: string | null } | null;
};
export type RaidItem = {
  id: string;
  title: string;
  raid_date: string;
  raid_time: string | null;
  difficulty: string | null;
  max_members: number;
  members: Array<{
    user_id: string;
    username: string | null;
    avatar_url: string | null;
    confirmed: boolean;
  }>;
};
export type RaidEntry = {
  id: string;
  title: string;
  image_url: string | null;
  gold_normal: number;
  gold_hard: number;
  gold_nightmare: number;
};
export type GuildLayoutData = {
  guild: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    total_points: number;
    member_count: number;
    max_members: number;
    logo_url: string | null;
    is_recruiting: boolean;
    server: string | null;
    discord_widget_id: string | null;
  };
  attendanceDates: string[];
  alreadyAttended: boolean;
  streak: number;
  totalAttendances: number;
  recentMembers: RecentMember[];
  rankingMembers: RankingMember[];
  onlineMembers: OnlineMember[];
  noticePosts: NoticePost[];
  raidList: RaidItem[];
  raids: RaidEntry[];
  welcomeMessage: string | null;
  guardianIndex: number;
  guardianImageUrl: string | null;
  weaknesses: Array<{ name: string; color: string }>;
  primaryColor: string;
  backgroundColor: string;
  bannerUrl: string | null;
  equippedBackgroundUrl?: string | null;
  cardStyle?: string;
};
