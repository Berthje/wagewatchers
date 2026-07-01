export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Admin follows the site theme (light default + dark toggle) via the root
  // ThemeProvider — no forced dark. The per-page AdminShell provides the sidebar
  // chrome; the login page renders standalone without it.
  return <>{children}</>;
}
