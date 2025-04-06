"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLoading } from "@/app/loading-context";

export default function SmartLink({ href, children, ...props }: any) {
  const pathname = usePathname();
  const { setLoading } = useLoading();

  const handleClick = () => {
    if (href === pathname) return; // ← impede bug da barra ao clicar no mesmo link
    setLoading(true);
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
