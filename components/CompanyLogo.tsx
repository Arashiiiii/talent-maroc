'use client'; // This tells Next.js this specific part is for the browser

export default function CompanyLogo({ logoUrl, companyName }: { logoUrl: string, companyName: string }) {
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=random`;

  if (!logoUrl) {
    return (
      <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl border border-blue-100 uppercase">
        {companyName?.charAt(0) || 'J'}
      </div>
    );
  }

  return (
    <img 
      src={logoUrl} 
      alt={companyName} 
      className="w-14 h-14 rounded-lg object-contain border border-slate-100 bg-slate-50 p-1"
      onError={(e) => {
        (e.target as HTMLImageElement).src = fallbackUrl;
      }}
    />
  );
}