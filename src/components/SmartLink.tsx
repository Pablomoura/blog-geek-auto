"use client";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useLoading } from "@/app/loading-context";
import { ComponentProps } from "react";

type SmartLinkProps = ComponentProps<typeof NextLink>;

export default function SmartLink({ href, children, ...props }: SmartLinkProps) {
  const pathname = usePathname();
  const { setLoading } = useLoading();

  const handleClick = () => {
    if (href === pathname) return;
    setLoading(true);
  };

  return (
    <NextLink href={href} onClick={handleClick} {...props}>
      {children}
    </NextLink>
  );
}
