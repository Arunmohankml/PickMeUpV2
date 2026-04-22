"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "next-intl";
import LanguageModal from "./LanguageModal";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  backPath?: string;
  rightAction?: React.ReactNode;
}

export default function PageHeader({ title, showBack = true, backPath, rightAction }: PageHeaderProps) {
  const router = useRouter();
  const locale = useLocale();
  const [isLangOpen, setIsLangOpen] = useState(false);

  const langLabels: Record<string, string> = {
    en: "English",
    ml: "മലയാളം",
    hi: "हिन्दी"
  };

  const handleBack = () => {
    if (backPath) {
      router.push(backPath);
    } else {
      router.back();
    }
  };

  return (
    <>
      <div style={{
        padding: "1rem 1.2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        paddingTop: "calc(1rem + var(--safe-top))"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {showBack && (
            <button 
              onClick={handleBack}
              className="active-scale"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                color: "#fff"
              }}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <h1 style={{ fontSize: "1.2rem", margin: 0, fontWeight: "800" }}>{title}</h1>
            <button 
              onClick={() => setIsLangOpen(true)}
              className="active-scale"
              style={{ 
                background: "rgba(250, 204, 21, 0.1)", 
                border: "1px solid var(--primary)", 
                color: "var(--primary)", 
                borderRadius: "20px",
                padding: "4px 12px",
                fontSize: "0.75rem",
                fontWeight: "800",
                cursor: "pointer" 
              }}
            >
              {langLabels[locale] || "Language"}
            </button>
          </div>
        </div>
        {rightAction && (
          <div>{rightAction}</div>
        )}
      </div>

      <LanguageModal isOpen={isLangOpen} onClose={() => setIsLangOpen(false)} />
    </>
  );
}
