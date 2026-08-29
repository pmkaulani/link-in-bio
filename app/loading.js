import BrandLogo from '../components/BrandLogo';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center gap-4 animate-profile-in">
        <BrandLogo size="lg" variant="full" theme="light" className="animate-pulse" />
        <div className="h-0.5 w-32 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full w-1/2 rounded-full bg-white animate-indeterminate-slide" />
        </div>
      </div>
    </div>
  );
}
