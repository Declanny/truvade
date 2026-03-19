import Link from "next/link";
import Image from "next/image";

interface LocationCardProps {
  name: string;
  image: string;
  href: string;
}

export function LocationCard({ name, image, href }: LocationCardProps) {
  return (
    <Link href={href} className="group flex flex-col items-center gap-2 shrink-0">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gray-100 ring-2 ring-transparent group-hover:ring-gray-900 transition-all">
        <Image
          src={image}
          alt={name}
          width={96}
          height={96}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
        />
      </div>
      <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-gray-900 text-center leading-tight max-w-[80px] sm:max-w-[96px]">
        {name}
      </span>
    </Link>
  );
}
