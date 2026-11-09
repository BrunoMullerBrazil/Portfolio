import type { Metadata } from "next";
import PrivacyPolicy from "./PrivacyPolicy";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como o site de Bruno Müller trata dados pessoais e cookies, conforme a LGPD.",
};

export default function PrivacyPage() {
  return <PrivacyPolicy />;
}
