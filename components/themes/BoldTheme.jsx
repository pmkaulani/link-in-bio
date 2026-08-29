import { ICONS } from '../../lib/icons';

const PALETTE = ['#2F8CFF', '#FF3D8A', '#FFD23D', '#2ECC71', '#FF7A1A', '#9B5CFF'];

export default function BoldTheme({ profile, links }) {
  return (
    <main className="min-h-screen flex flex-col items-center bg-[#1B1035] px-6 py-14">
      <div className="w-full max-w-[420px] flex flex-col items-center">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl mb-5"
          />
        ) : (
          <div className="w-28 h-28 rounded-full bg-[#FF3D8A] border-4 border-white flex items-center justify-center text-2xl font-extrabold text-white shadow-xl mb-5">
            {(profile.display_name || profile.username || '?').slice(0, 2).toUpperCase()}
          </div>
        )}
        <h1 className="text-3xl font-extrabold text-white mb-1 text-center">
          {profile.display_name || profile.username}
        </h1>
        {profile.bio && (
          <p className="text-sm font-medium text-white/70 text-center max-w-[300px] mb-8">{profile.bio}</p>
        )}

        <nav className="w-full flex flex-col gap-3">
          {links.map((link, i) => {
            const icon = ICONS[link.icon] || ICONS.link;
            const bg = PALETTE[i % PALETTE.length];
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full p-4 rounded-xl font-bold text-[#1B1035] shadow-lg hover:-translate-y-0.5 transition"
                style={{ background: bg }}
              >
                <i className={`${icon.className} text-lg`}></i>
                <span className="flex-grow">{link.title}</span>
                <i className="fa-solid fa-arrow-right"></i>
              </a>
            );
          })}
        </nav>
      </div>
    </main>
  );
}
