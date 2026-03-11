"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {

const pathname = usePathname();
const isLanding = pathname === "/";

const [sidebarOpen, setSidebarOpen] = useState(false);
const [loading, setLoading] = useState(false);

return (

<div className="flex flex-col min-h-screen">

{/* Navbar + Sidebar */}
{!isLanding && (
<>
<Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
<Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
</>
)}

{/* Conteúdo */}

<main className={`flex-1 ${!isLanding ? "pt-16" : ""}`}>

<div
className={!isLanding ? "p-4 md:p-8" : ""}>
{children}

</div>

</main>

<Footer />

</div>

);

}