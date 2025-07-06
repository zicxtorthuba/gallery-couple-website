import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="pt-16 pb-8" style={{ backgroundColor: '#FFA69E' }}>
      <div className="container mx-auto px-4">
        <div className="content-container rounded-3xl p-8 shadow-lg">
        <div className="pt-1 text-center text-sm text-muted-foreground">
          <p>© {currentYear} Zunhee. All rights reserved.</p>
        </div>
        </div>
      </div>
    </footer>
  );
}
