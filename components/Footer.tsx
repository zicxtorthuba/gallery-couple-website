import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-[#93E1D8]/10 pt-16 pb-8">
        <div className="pt-1 text-center text-sm text-muted-foreground">
          <p>© {currentYear} Zunhee. All rights reserved.</p>
        </div>
    </footer>
  );
}
