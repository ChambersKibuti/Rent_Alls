import React from "react";
import PageLayout from "@/components/PageLayout";

export default function Privacy() {
  return (
    <PageLayout>
      <div className="pt-28 pb-32 max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-black text-zinc-900 mb-8">Privacy Policy</h1>
        <div className="prose prose-invert prose-sm max-w-none text-zinc-600 space-y-4">
          <p>RentAlls values your privacy and is committed to protecting your personal information. This policy explains how we collect, use, and safeguard your data.</p>
          <h2 className="text-zinc-900 font-bold text-lg">Information We Collect</h2>
          <p>We collect your name, email, and contact details when you register. Payment information is processed securely through our payment providers and is never stored on our servers.</p>
          <h2 className="text-zinc-900 font-bold text-lg">How We Use Your Data</h2>
          <p>Your information is used to process rental transactions, communicate about your bookings, and improve our services. We do not sell your data to third parties.</p>
          <h2 className="text-zinc-900 font-bold text-lg">Contact</h2>
          <p>For privacy inquiries, reach us at <a href="mailto:info@rentalls.com" className="text-[#2E5BFF] hover:underline">info@rentalls.com</a> or call +254 725 217 874.</p>
        </div>
      </div>
    </PageLayout>
  );
}