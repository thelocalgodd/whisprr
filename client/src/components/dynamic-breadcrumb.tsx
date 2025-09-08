"use client";
import { usePathname } from "next/navigation";
import { Breadcrumb, BreadcrumbItem } from "./ui/breadcrumb";
import Link from "next/link";

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const breadcrumb = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb className="text-sm px-4 bg-gray-100 rounded-lg dark:bg-gray-800 dark:text-gray-400 flex items-center">
      {breadcrumb.map((item, index) => (
        <span key={item} className="flex items-center">
          <BreadcrumbItem>
            <Link href={`/${breadcrumb.slice(0, index + 1).join("/")}`}>
              {decodeURIComponent(item.charAt(0).toUpperCase() + item.slice(1))}
            </Link>
          </BreadcrumbItem>
          {index < breadcrumb.length - 1 && (
            <span className="mx-2 text-gray-400 dark:text-gray-500 select-none">
              {">"}
            </span>
          )}
        </span>
      ))}
    </Breadcrumb>
  );
}
