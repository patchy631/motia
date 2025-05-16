import { ArrowRight } from 'lucide-react';

export default function HeaderLogo() {
  return (
    <div className="inline-flex items-center gap-2.5 hover:opacity-90 transition-opacity">
      <div className="bg-linear-to-r from-blue-500 to-blue-600 rounded-full p-1">
        <ArrowRight
          className="h-4 w-4 text-white"
          strokeWidth={3}
        />
      </div>
      <span className="font-bold tracking-tight text-lg bg-linear-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
        motia
      </span>
    </div>
  );
}