import { ICONS } from '../../lib/icons';

export default function MinimalTheme({ profile, links }) {
  return (
    <main className="min-h-screen flex flex-col items-center bg-white px-6 py-14">
      <div className="w-full max-w-[420px] flex flex-col items-center">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="w-24 h-24 rounded-full object-cover border border-gray-200 shadow-md mb-4"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xl font-semibold text-gray-400 mb-4">
            {(profile.display_name || profile.username || '?').slice(0, 2).toUpperCase()}
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">
          {profile.display_name || profile.username}
        </h1>
        {profile.bio && (
          <p className="text-sm text-gray-500 text-center max-w-[320px] mb-8">{profile.bio}</p>
        )}

        <nav className="w-full flex flex-col gap-3">
          {links.map((link) => {
            const icon = ICONS[link.icon] || ICONS.link;
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-full border-2 border-gray-900 font-semibold text-gray-900 hover:bg-gray-900 hover:text-white transition"
              >
                <i className={icon.className}></i>
                <span>{link.title}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </main>
  );
}
