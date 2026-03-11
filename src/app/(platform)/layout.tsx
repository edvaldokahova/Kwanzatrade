import Sidebar from "@/components/Sidebar";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-gray-900 text-white min-h-screen">

      <Sidebar />

      <main className="flex-1 p-10">
        {children}
      </main>

    </div>
  );
}