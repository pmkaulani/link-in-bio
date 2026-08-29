import { ICONS } from '../../lib/icons';

export default function GrowthTheme({ profile, links }) {
  const featured = links.find((l) => l.is_featured);
  const rest = links.filter((l) => !l.is_featured);
  const ordered = featured ? [featured, ...rest] : links;
  const initials = (profile.display_name || profile.username || '?').slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#EAFBF1] to-[#CDEFDC] px-6 py-14">
      <div className="w-full max-w-[420px] flex flex-col items-center">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="w-24 h-24 rounded-full object-cover border-[3px] border-[#14A866] shadow-lg mb-4"
          />
        ) : (
          <div
            className="w-24 h-24 rounded-full bg-white border-[3px] border-[#14A866] flex items-center justify-center text-2xl font-semibold text-[#0E7A46] shadow-lg mb-4"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {initials}
          </div>
        )}
        <h1
          className="text-2xl font-semibold text-[#10261B] mb-1 text-center"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {profile.display_name || profile.username}
        </h1>
        <p className="text-sm font-semibold text-[#0E7A46] mb-3">@{profile.username}</p>
        {profile.bio && (
          <p className="text-sm text-[#52685C] text-center max-w-[300px] mb-8">{profile.bio}</p>
        )}

        <nav className="w-full flex flex-col gap-3">
          {ordered.map((link) => {
            const icon = ICONS[link.icon] || ICONS.link;
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 w-full p-4 rounded-2xl transition hover:-translate-y-0.5 ${
                  link.is_featured
                    ? 'bg-gradient-to-br from-[#0E7A46] to-[#0A6339] shadow-lg text-white'
                    : 'bg-white shadow-sm text-[#10261B]'
                }`}
              >
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: link.is_featured ? 'rgba(255,255,255,0.18)' : `${icon.color}20`,
                    color: link.is_featured ? '#fff' : icon.color,
                  }}
                >
                  <i className={icon.className}></i>
                </span>
                <span className="flex-grow min-w-0">
                  <span className="block font-bold text-[15px] truncate">{link.title}</span>
                  {link.subtitle && (
                    <span
                      className={`block text-xs truncate ${
                        link.is_featured ? 'text-[#DFF7EA]' : 'text-[#52685C]'
                      }`}
                    >
                      {link.subtitle}
                    </span>
                  )}
                </span>
                <i
                  className={`fa-solid fa-arrow-right text-sm flex-shrink-0 ${
                    link.is_featured ? 'text-white' : 'text-[#52685C]'
                  }`}
                ></i>
              </a>
            );
          })}
        </nav>
      </div>
    </main>
  );
}
