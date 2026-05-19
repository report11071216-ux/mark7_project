import Link from "next/link";

type GuildCardProps = {
  guild: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    logo_url: string | null;
    total_points: number;
    member_count: number;
    max_members: number;
  };
  role?: string;
};

export default function GuildCard({ guild, role }: GuildCardProps) {
  return (
    <Link
      href={`/g/${guild.code}`}
      className="block rounded-2xl bg-white p-6 shadow transition hover:shadow-xl"
    >
      <div className="mb-4 flex items-start gap-4">
        {guild.logo_url ? (
          <img
            src={guild.logo_url}
            alt={guild.name}
            className="h-16 w-16 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-2xl text-white">
            🏰
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{guild.name}</h3>
          <p className="text-xs text-gray-500">코드: {guild.code}</p>
          {role && (
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                role === "master"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {role === "master" ? "👑 마스터" : "멤버"}
            </span>
          )}
        </div>
      </div>

      {guild.description && (
        <p className="mb-4 line-clamp-2 text-sm text-gray-600">
          {guild.description}
        </p>
      )}

      <div className="flex justify-between border-t border-gray-100 pt-3 text-sm">
        <span className="text-gray-600">
          👥 {guild.member_count} / {guild.max_members}명
        </span>
        <span className="font-semibold text-blue-600">
          ⭐ {guild.total_points.toLocaleString()}P
        </span>
      </div>
    </Link>
  );
}
