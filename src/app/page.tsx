"use client";

import { useState } from "react";
import { FormEditor } from "@/components/form/FormEditor";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { YamlEditor } from "@/components/yaml/YamlEditor";
import { ConfigProvider } from "@/contexts/ConfigContext";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"form" | "yaml">("form");

  return (
    <ConfigProvider>
      <div className="flex flex-col h-full">
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="flex-1 flex min-h-0">
          {/* Mobile overlay backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-20 bg-black/40 md:hidden"
              onClick={() => setSidebarOpen(false)}
              onKeyDown={() => {}}
            />
          )}
          {/* Sidebar - desktop inline, mobile overlay */}
          {sidebarOpen && (
            <div className="w-56 shrink-0 overflow-hidden max-md:fixed max-md:top-12 max-md:bottom-0 max-md:left-0 max-md:z-30 max-md:w-72 max-md:shadow-2xl">
              <Sidebar onCloseMobile={() => setSidebarOpen(false)} />
            </div>
          )}
          {/* Mobile tab switcher */}
          <div className="flex-1 flex flex-col min-w-0 md:hidden">
            <div className="flex border-b border-zinc-200 dark:border-zinc-700 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("form")}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  activeTab === "form"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                表单编辑
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("yaml")}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  activeTab === "yaml"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                YAML 预览
              </button>
            </div>
            <div className="flex-1 min-h-0">
              {activeTab === "form" ? <FormEditor /> : <YamlEditor />}
            </div>
          </div>
          {/* Desktop form + yaml side by side */}
          <div className="hidden md:flex md:flex-1 min-w-0">
            <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-200 dark:border-zinc-700">
              <FormEditor />
            </div>
            <div className="flex-1 flex flex-col min-w-0">
              <YamlEditor />
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
