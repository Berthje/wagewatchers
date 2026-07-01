export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Admin is not part of the themed rollout yet — pin it to dark so its
  // hardcoded dark styling and token-based components stay consistent
  // regardless of the visitor's light/dark preference.
  return <div className="dark">{children}</div>;
}
