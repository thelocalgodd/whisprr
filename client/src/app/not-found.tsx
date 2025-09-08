import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-text h-screen w-screen flex flex-col items-center justify-center">
      <p className="text-2xl dark:text-white font-bold">
        page not found
        <span className="text-red-600">.</span>
      </p>
      <Link href="/">home</Link>
    </div>
  );
}
