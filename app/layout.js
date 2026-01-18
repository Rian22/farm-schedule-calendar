import "./globals.css";

export const metadata = {
  title: "Jadwal Kegiatan Pertanian",
  description: "Farm Schedule Calendar"
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen text-gray-900">{children}</body>
    </html>
  );
}
